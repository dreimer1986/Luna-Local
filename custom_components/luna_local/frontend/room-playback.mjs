// Silent audio analysis: no AudioContext destination, media element or microphone.
export function mouthEnvelope(buffer, step = .02) {
  const count = Math.ceil(buffer.duration / step), values = new Float32Array(count);
  const channels = Array.from({length: buffer.numberOfChannels}, (_, i) => buffer.getChannelData(i));
  for (let frame = 0; frame < count; frame++) {
    const start = Math.floor(frame * step * buffer.sampleRate), end = Math.min(buffer.length, Math.floor((frame + 1) * step * buffer.sampleRate));
    let energy = 0;
    for (let i = start; i < end; i++) for (const channel of channels) energy += channel[i] ** 2;
    const rms = Math.sqrt(energy / Math.max(1, (end - start) * channels.length));
    values[frame] = .85 * Math.max(0, Math.min(1, (rms - .008) * 15));
  }
  return {values, step, duration: buffer.duration};
}

export class RoomPlayback {
  constructor(hass, changed = () => {}, env = globalThis) {
    this.hass = hass; this.changed = changed; this.env = env; this.jobs = new Map();
    this.closed = false; this.revision = 0;
    this.connected = () => this.subscribe();
    this.disconnected = () => {this.clear(); this.changed();};
    hass.connection.addEventListener?.('connected', this.connected);
    hass.connection.addEventListener?.('disconnected', this.disconnected);
    this.subscribe();
  }
  async subscribe() {
    const revision = ++this.revision;
    this.env.clearTimeout(this.retry);
    if (this.unsubscribe) Promise.resolve(this.unsubscribe()).catch(() => {}); this.unsubscribe = null;
    try {
      const unsubscribe = await this.hass.connection.subscribeMessage(event => {
        if (!this.closed && revision === this.revision) this.receive(event);
      }, {type: 'luna_local/avatar/room_playback'});
      if (this.closed || revision !== this.revision) {await unsubscribe(); return;}
      this.unsubscribe = unsubscribe;
    } catch {
      if (!this.closed && revision === this.revision) this.retry = this.env.setTimeout(() => this.subscribe(), 5000);
    }
  }
  receive(event) {
    if (event?.reset) {this.clear(); this.subscribe(); return;}
    if (!event || typeof event.id !== 'string' || typeof event.device_id !== 'string') return;
    const existing = this.jobs.get(event.device_id);
    if (event.phase === 'idle') {
      if (existing?.id === event.id) {existing.abort.abort(); this.env.clearTimeout(existing.endTimer); this.jobs.delete(event.device_id); this.changed();}
      return;
    }
    if (!['preparing','speaking'].includes(event.phase) || !Number.isFinite(event.server_time)) return;
    const url = new URL(event.url, this.env.location.href);
    if (url.origin !== this.env.location.origin || !url.pathname.startsWith('/api/tts_proxy/')) return;
    if (existing && existing.id !== event.id) {existing.abort.abort(); this.env.clearTimeout(existing.endTimer);}
    const job = existing?.id === event.id ? existing : {id: event.id, abort: new AbortController(), envelope: null};
    const fresh = job !== existing;
    Object.assign(job, {phase: event.phase, room: String(event.room || ''), device: event.device_id,
      markers: event.emotion_markers || [], originalReply: event.original_reply || '',
      receivedAt: this.env.performance.now()});
    if (event.phase === 'speaking' && Number.isFinite(event.started_at))
      job.startedAt = this.env.performance.now() - Math.max(0, event.server_time - event.started_at) * 1000;
    this.jobs.set(event.device_id, job);
    if (fresh) this.load(job, url);
    this.scheduleEnd(job);
    this.changed();
  }
  scheduleEnd(job) {
    this.env.clearTimeout(job.endTimer);
    if (job.envelope && Number.isFinite(job.startedAt))
      job.endTimer = this.env.setTimeout(() => this.changed(), Math.max(0, job.startedAt + job.envelope.duration * 1000 - this.env.performance.now()) + 20);
  }
  async load(job, url) {
    try {
      const response = await this.env.fetch(url, {signal: job.abort.signal, credentials: 'same-origin'});
      if (!response.ok) throw Error('Audio unavailable');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > 20 * 1024 * 1024) throw Error('Audio too large');
      if (job.abort.signal.aborted) return;
      const Offline = this.env.OfflineAudioContext || this.env.webkitOfflineAudioContext;
      const context = new Offline(1, 1, 48000);
      const buffer = await context.decodeAudioData(bytes);
      if (job.abort.signal.aborted) return;
      job.envelope = mouthEnvelope(buffer); this.scheduleEnd(job); this.changed();
    } catch {if (!job.abort.signal.aborted) {job.error = true; this.changed();}}
  }
  sample() {
    const now = this.env.performance.now();
    const jobs = [...this.jobs.values()].filter(j => now - j.receivedAt < 300000);
    const job = jobs.filter(j => j.phase === 'speaking').sort((a,b) => b.startedAt-a.startedAt)[0];
    if (!job || !Number.isFinite(job.startedAt)) return null;
    const elapsed = Math.max(0, (now - job.startedAt) / 1000), envelope = job.envelope;
    if (envelope && elapsed >= envelope.duration) return null;
    return {id: job.id, room: job.room, speaking: !!envelope,
      mouth: envelope ? envelope.values[Math.floor(elapsed / envelope.step)] || 0 : 0};
  }
  clear() {for (const job of this.jobs.values()) {job.abort.abort(); this.env.clearTimeout(job.endTimer);} this.jobs.clear();}
  destroy() {
    this.closed = true; ++this.revision; this.clear(); this.env.clearTimeout(this.retry);
    if (this.unsubscribe) Promise.resolve(this.unsubscribe()).catch(() => {});
    this.hass.connection.removeEventListener?.('connected', this.connected);
    this.hass.connection.removeEventListener?.('disconnected', this.disconnected);
  }
}
