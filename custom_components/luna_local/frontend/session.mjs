export const VERSION = '0.4.0b3';
export const PHASES = {
  idle: 'Bereit', starting: 'Mikrofon wird gestartet', listening: 'Ich höre zu',
  thinking: 'Ich denke nach', preparing: 'Antwort wird vorbereitet',
  speaking: 'Luna spricht', error: 'Gespräch angehalten',
};

export function pcmPacket(handler, samples) {
  if (!Number.isInteger(handler) || handler < 0 || handler > 255) throw Error('Ungültiger Audio-Kanal');
  const data = new Uint8Array(1 + samples.length * 2);
  data[0] = handler;
  const view = new DataView(data.buffer);
  samples.forEach((sample, i) => view.setInt16(1 + i * 2, sample, true));
  return data;
}

export function speechText(result) {
  return result?.response?.speech?.plain?.speech || '';
}

export class LunaSession extends EventTarget {
  constructor(hass, config = {}, env = globalThis) {
    super();
    this.hass = hass;
    this.config = config;
    this.env = env;
    this.phase = 'idle';
    this.error = '';
    this.transcript = [];
    this.expression = {name: 'neutral', intensity: 0};
    this.conversationId = null;
    this.generation = 0;
    this.continuous = false;
    this.muted = false;
    this.viseme = 'sil';
    this.mouthCues = null;
    this.playbackTime = 0;
    this.pendingChunks = [];
    this.pipeline = null;
    this.connection = hass.connection;
    this.disconnectHandler = () => this.fail('Verbindung zu Home Assistant unterbrochen.');
    this.connection.addEventListener?.('disconnected', this.disconnectHandler);
    this.hiddenHandler = () => { if (env.document?.hidden) this.stop(); };
    env.document?.addEventListener('visibilitychange', this.hiddenHandler);
    this.pagehideHandler = () => this.stop();
    env.addEventListener?.('pagehide', this.pagehideHandler);
  }
  emit() { this.dispatchEvent(new Event('change')); }
  setPhase(phase) { this.phase = phase; this.emit(); }
  addMessage(who, text) {
    if (!text) return;
    this.transcript.push({who, text: String(text).slice(0, 8000)});
    if (this.transcript.length > 40) this.transcript.shift();
    this.emit();
  }
  async selectPipeline() {
    const [data, avatar] = await Promise.all([
      this.hass.callWS({type: 'assist_pipeline/pipeline/list'}),
      this.hass.callWS({type: 'luna_local/avatar/config'}),
    ]);
    const configured = this.config.pipeline;
    const isLuna = pipeline => avatar.agents.includes(pipeline.conversation_engine);
    const candidates = data.pipelines.filter(isLuna);
    this.pipeline = configured ? data.pipelines.find(p => p.id === configured) :
      candidates.find(p => p.id === data.preferred_pipeline) || (candidates.length === 1 ? candidates[0] : null);
    if (!this.pipeline) throw Error('Bitte in der Kartenkonfiguration die ID einer Assist-Pipeline mit Luna auswählen.');
    if (!isLuna(this.pipeline)) throw Error('Die gewählte Pipeline muss Luna als Gesprächsagent verwenden.');
    if (!this.pipeline.tts_engine) throw Error('In Lunas Assist-Pipeline fehlt die Sprachausgabe.');
    return this.pipeline;
  }
  async unlockAudio() {
    const AudioContext = this.env.AudioContext || this.env.webkitAudioContext;
    if (!AudioContext) throw Error('Dieser Browser unterstützt Web Audio nicht.');
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
      this.output = this.audioContext.createGain();
      this.output.gain.value = this.muted ? 0 : 1;
      this.output.connect(this.audioContext.destination);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.connect(this.output);
    }
    await this.audioContext.resume();
  }
  async listen(continuous = this.continuous) {
    this.stop(false);
    this.continuous = continuous;
    const turn = this.generation;
    this.error = '';
    this.expression = {name: 'curious', intensity: 0.25};
    this.setPhase('starting');
    try {
      if (!this.env.isSecureContext || !this.env.navigator?.mediaDevices?.getUserMedia) {
        throw Error('Das Browser-Mikrofon benötigt HTTPS (oder localhost). Textgespräche sind weiterhin möglich.');
      }
      // Resume during the user's initial gesture, before network requests.
      await this.unlockAudio();
      if (turn !== this.generation) return;
      const pipeline = await this.selectPipeline();
      if (turn !== this.generation) return;
      if (!pipeline.stt_engine) throw Error('In Lunas Assist-Pipeline fehlt die Spracherkennung.');
      const stream = await this.env.navigator.mediaDevices.getUserMedia({audio: {
        channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true,
      }});
      if (turn !== this.generation) { stream.getTracks().forEach(t => t.stop()); return; }
      this.stream = stream;
      // Reuse the context unlocked by the click, including on mobile Safari.
      this.captureContext = this.audioContext;
      await this.captureContext.audioWorklet.addModule(new URL('./capture-worklet.js', import.meta.url));
      if (turn !== this.generation) return;
      this.captureSource = this.captureContext.createMediaStreamSource(stream);
      this.worklet = new this.env.AudioWorkletNode(this.captureContext, 'luna-capture');
      this.worklet.port.onmessage = event => {
        if (turn !== this.generation || !this.stream) return;
        if (event.data === 'finished') { this.endInput(); return; }
        if (this.sttReady) this.sendPCM(event.data);
        else {
          this.pendingChunks.push(event.data);
          // Bounded pre-roll while waiting for STT to accept binary input.
          if (this.pendingChunks.length > 48) this.pendingChunks.shift();
        }
      };
      this.captureSource.connect(this.worklet);
      // Worklet outputs silence; connecting it ensures processing on all engines.
      this.worklet.connect(this.captureContext.destination);
      this.setPhase('listening');
      await this.run({start_stage: 'stt', input: {sample_rate: this.captureContext.sampleRate}}, turn);
    } catch (error) { if (turn === this.generation) this.fail(this.describeError(error)); }
  }
  async sendText(text) {
    text = text.trim();
    if (!text) return;
    this.stop(false);
    const turn = this.generation;
    this.error = '';
    this.addMessage('user', text);
    this.lastUserText = text;
    this.expression = {name: 'thoughtful', intensity: 0.25};
    this.setPhase('thinking');
    try {
      await this.unlockAudio();
      if (turn !== this.generation) return;
      await this.selectPipeline();
      if (turn !== this.generation) return;
      await this.run({start_stage: 'intent', input: {text}}, turn);
    } catch (error) { if (turn === this.generation) this.fail(this.describeError(error)); }
  }
  async run(options, turn) {
    this.ttsRequested = false;
    this.finishPending = false;
    this.runEnded = false;
    this.completed = false;
    this.abort = new AbortController();
    this.watchdog = this.env.setTimeout(() => {
      if (turn === this.generation) this.fail('Die Assist-Pipeline hat nicht rechtzeitig geantwortet.');
    }, 125000);
    const unsub = await this.hass.connection.subscribeMessage(
      event => { if (turn === this.generation) this.handleEvent(event, turn); },
      {type: 'assist_pipeline/run', ...options, end_stage: 'tts', pipeline: this.pipeline.id,
        conversation_id: this.conversationId, timeout: 120},
    );
    if (turn !== this.generation) { await unsub(); return; }
    if (this.runEnded) { await unsub(); return; }
    this.unsubscribe = unsub;
  }
  handleEvent(event, turn) {
    const data = event.data || {};
    switch (event.type) {
      case 'run-start':
        this.handler = data.runner_data?.stt_binary_handler_id;
        this.pendingAudioURL = data.tts_output?.url;
        break;
      case 'stt-start':
        this.sttReady = true;
        this.pendingChunks.splice(0).forEach(chunk => this.sendPCM(chunk));
        if (this.finishPending) this.finishInput();
        break;
      case 'stt-vad-end':
        this.finishInput();
        break;
      case 'stt-end':
        this.closeCapture();
        this.handler = null;
        this.lastUserText = data.stt_output?.text || '';
        this.addMessage('user', this.lastUserText);
        this.setPhase('thinking');
        break;
      case 'intent-start': this.setPhase('thinking'); break;
      case 'intent-end': {
        const result = data.intent_output;
        this.conversationId = result?.conversation_id || this.conversationId;
        const reply = speechText(result);
        this.addMessage('luna', reply);
        if (reply) this.getExpression(reply, turn);
        this.setPhase('preparing');
        break;
      }
      case 'tts-start': this.setPhase('preparing'); break;
      case 'tts-end': {
        const output = data.tts_output || data;
        const url = output.url || this.pendingAudioURL;
        if (url && !this.ttsRequested) {
          this.ttsRequested = true;
          this.playAudio(url, turn);
        }
        break;
      }
      case 'run-end':
        this.closeCapture();
        this.runEnded = true;
        this.env.clearTimeout(this.watchdog);
        // HA may send a timeout error immediately after run-end.
        this.endTimer = this.env.setTimeout(() => {
          if (turn !== this.generation) return;
          this.releaseSubscription();
          if (!this.ttsRequested) this.fail('Die Assist-Pipeline hat keine abspielbare Sprachausgabe geliefert.');
        }, 250);
        break;
      case 'error': this.fail(data.message || data.code || 'Assist-Fehler'); break;
    }
  }
  async getExpression(reply, turn) {
    this.expression = {name: 'neutral', intensity: 0};
    if (this.config.expressions === false) return;
    try {
      const expression = await this.hass.callWS({type: 'luna_local/avatar/expression',
        text: (this.lastUserText || '').slice(0, 2000), reply: reply.slice(0, 3000)});
      if (turn === this.generation) { this.expression = expression; this.emit(); }
    } catch { /* Optional expression service: voice remains usable. */ }
  }
  sendPCM(samples) {
    const socket = this.hass.connection.socket;
    if (this.handler == null || socket?.readyState !== 1) return;
    try { socket.send(pcmPacket(this.handler, samples)); }
    catch { /* A closing socket is handled by the disconnect event/watchdog. */ }
  }
  finishInput() {
    if (!this.sttReady) { this.finishPending = true; return; }
    if (this.flushing) return;
    if (this.worklet) {
      this.flushing = true;
      const turn = this.generation;
      this.worklet.port.postMessage('finish');
      this.flushTimer = this.env.setTimeout(() => {
        if (turn === this.generation) this.endInput();
      }, 250);
      this.setPhase('thinking');
      return;
    }
    this.endInput();
  }
  endInput() {
    this.pendingChunks.splice(0).forEach(chunk => this.sendPCM(chunk));
    this.sendPCM(new Int16Array());
    this.handler = null;
    this.closeCapture();
    this.setPhase('thinking');
  }
  closeCapture() {
    this.env.clearTimeout(this.flushTimer);
    this.flushing = false;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    if (this.worklet) this.worklet.port.onmessage = null;
    this.worklet?.disconnect();
    this.captureSource?.disconnect();
    if (this.captureContext && this.captureContext !== this.audioContext) {
      this.captureContext.close().catch(() => {});
    }
    this.worklet = this.captureSource = this.captureContext = null;
    this.pendingChunks = [];
    this.sttReady = false;
  }
  async playAudio(url, turn) {
    try {
      const audioURL = new URL(url, this.env.location.href);
      if (audioURL.origin !== this.env.location.origin) throw Error('Die Audio-URL muss von dieser Home-Assistant-Instanz stammen.');
      this.audioTimer = this.env.setTimeout(() => {
        if (turn === this.generation) this.fail('Die Sprachausgabe konnte nicht rechtzeitig geladen werden.');
      }, 30000);
      const response = await this.env.fetch(audioURL, {signal: this.abort.signal});
      if (!response.ok) throw Error(`Sprachausgabe nicht verfügbar (${response.status}).`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > 20 * 1024 * 1024) throw Error('Die Sprachausgabe ist zu groß.');
      if (turn !== this.generation) return;
      const buffer = await this.audioContext.decodeAudioData(bytes);
      if (turn !== this.generation) return;
      this.env.clearTimeout(this.audioTimer);
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = buffer;
      this.source.connect(this.analyser);
      this.source.onended = () => { if (turn === this.generation) this.complete(turn); };
      this.playbackStarted = this.audioContext.currentTime;
      this.playbackDuration = buffer.duration;
      this.source.start();
      this.setPhase('speaking');
    } catch (error) { if (turn === this.generation) this.fail(this.describeError(error)); }
  }
  complete(turn) {
    if (turn !== this.generation || this.completed) return;
    this.completed = true;
    this.viseme = 'sil';
    this.mouthCues = null;
    this.playbackTime = 0;
    this.source?.disconnect();
    this.source = null;
    this.setPhase('idle');
    if (this.continuous && !this.env.document?.hidden) {
      this.restartTimer = this.env.setTimeout(() => {
        if (turn === this.generation && this.continuous) this.listen(true);
      }, 400);
    }
  }
  setMuted(muted) {
    this.muted = muted;
    if (this.output) this.output.gain.value = muted ? 0 : 1;
    this.emit();
  }
  stop(resetContinuous = true) {
    ++this.generation;
    if (resetContinuous) this.continuous = false;
    this.env.clearTimeout(this.restartTimer);
    this.env.clearTimeout(this.endTimer);
    this.env.clearTimeout(this.watchdog);
    this.env.clearTimeout(this.audioTimer);
    this.sendPCM(new Int16Array());
    this.handler = null;
    this.abort?.abort();
    this.releaseSubscription();
    if (this.source) {
      this.source.onended = null;
      try { this.source.stop(); } catch { /* Already ended. */ }
      this.source.disconnect();
    }
    this.source = null;
    this.closeCapture();
    this.viseme = 'sil';
    this.mouthCues = null;
    this.playbackTime = 0;
    this.phase = 'idle';
    this.emit();
  }
  releaseSubscription() {
    const unsubscribe = this.unsubscribe;
    this.unsubscribe = null;
    if (unsubscribe) Promise.resolve().then(unsubscribe).catch(() => {});
  }
  fail(message) {
    this.stop();
    this.error = message;
    this.expression = {name: 'concerned', intensity: 0.3};
    this.setPhase('error');
  }
  describeError(error) {
    if (error?.name === 'NotAllowedError') return 'Mikrofon oder Audiowiedergabe nicht freigegeben. Bitte die Browser-Berechtigung prüfen.';
    if (error?.name === 'NotFoundError') return 'Kein Mikrofon gefunden.';
    return error?.message || String(error);
  }
  destroy() {
    this.stop();
    this.audioContext?.close().catch(() => {});
    this.connection.removeEventListener?.('disconnected', this.disconnectHandler);
    this.env.document?.removeEventListener('visibilitychange', this.hiddenHandler);
    this.env.removeEventListener?.('pagehide', this.pagehideHandler);
  }
}
