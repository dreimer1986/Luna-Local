import {installAutoPopup} from './auto-popup.mjs?v=20261030-v2';
import {AvatarCommands} from './avatar-commands.mjs?v=20261029-v10';
import {RoomPlayback} from './room-playback.mjs?v=20261029-v10';
import {LunaSession, PHASES} from './session.mjs?v=20261030-v12';
import {LunaRig} from './rig.mjs?v=0.4.0b5';
import {LunaLive2DRig, localAssetURL} from './live2d-rig.mjs?v=20261031-emotions1';

class LunaAvatarCard extends HTMLElement {
  constructor() { super(); this.attachShadow({mode: 'open'}); }
  setConfig(config) {
    if (!['card', 'popup'].includes(config.presentation || 'card')) throw Error('presentation: card oder popup');
    if (!['illustration', 'technical', 'live2d'].includes(config.avatar || 'illustration')) throw Error('avatar: illustration, live2d oder technical');
    if (!['full', 'waist'].includes(config.framing || 'full')) throw Error('framing: full oder waist');
    if (config.waist_zoom !== undefined && (!Number.isFinite(config.waist_zoom) || config.waist_zoom < 1 || config.waist_zoom > 3)) throw Error('waist_zoom: Zahl von 1 bis 3');
    if (config.avatar === 'live2d') {
      if (config.live2d_model) localAssetURL(config.live2d_model);
      if (config.live2d_runtime) localAssetURL(config.live2d_runtime);
    }
    this.teardown();
    this.config = {...config};
    this.style.setProperty('--luna-waist-zoom', String(config.waist_zoom ?? 1.2));
    // Match kiosk-mode's explicit maintenance URL without changing saved config.
    this.displayOnly = config.display_only === true && !new URLSearchParams(location.search).has('disable_km');
    this.toggleAttribute('transparent-background', config.background === 'transparent');
    if (this.isConnected) this.mount();
  }
  set hass(value) {
    this._hass = value;
    if (this.session) this.session.hass = value;
    else if (this.isConnected) this.mount();
  }
  connectedCallback() { this.mount(); }
  disconnectedCallback() { this.teardown(); }
  getCardSize() { return this.config?.presentation === 'popup' ? 1 : 8; }
  static getStubConfig() { return {presentation: 'card', avatar: 'illustration', continuous: false}; }
  mount() {
    if (this.session || !this._hass || !this.config) return;
    const root = this.shadowRoot;
    root.innerHTML = `<style>
      :host{display:block} *{box-sizing:border-box} ha-card{overflow:hidden}
      .panel{position:relative;isolation:isolate;height:min(900px,94dvh);background:var(--card-background-color,#fff);color:var(--primary-text-color,#242032);border-radius:18px;overflow:hidden}
      .stage{position:absolute;inset:0;height:100%;overflow:hidden;background:radial-gradient(ellipse at 70% 20%,#737ba4 0,#293556 35%,#131c31 85%)}
      .stage:before{content:'';position:absolute;width:135px;height:135px;border-radius:50%;right:10%;top:24px;background:#f5f0db;box-shadow:0 0 55px #e2e5ff75}
      .stage[data-background="plain"]{background:var(--secondary-background-color,#e7e9ef)}.stage[data-background="plain"]:before{display:none}
      :host([transparent-background]){background:transparent!important}
      :host([transparent-background]) ha-card,:host([transparent-background]) .panel,:host([transparent-background]) dialog,:host([transparent-background]) .stage{background:transparent!important;box-shadow:none;border:0}
      :host([transparent-background]) .stage:before{display:none}
      :host([transparent-background]) dialog::backdrop{background:transparent;backdrop-filter:none}
      .rig{height:100%;position:relative;z-index:1}.rig svg{width:100%;height:100%;display:block}
      .stage[data-avatar="illustration"],.stage[data-avatar="live2d"]{width:100%;height:100%;aspect-ratio:auto;max-height:none}
      .stage[data-avatar="live2d"] .rig{position:absolute;inset:0}
      .portrait{display:block;width:100%;height:100%;object-fit:contain;object-position:center;position:relative;z-index:1}
      .stage[data-framing="waist"]:not([data-avatar="live2d"]) > .rig,.stage[data-framing="waist"] > .portrait{transform:scale(var(--luna-waist-zoom,1.2));transform-origin:50% 0}
      .framing{position:absolute;right:10px;top:10px;z-index:3;opacity:.85}
      .badge{position:absolute;top:10px;left:12px;background:#121a30d9;color:#fff;padding:5px 10px;border-radius:16px;font:12px system-ui;z-index:2}
      .controls{position:absolute;z-index:2;bottom:0;left:0;right:0;max-height:55%;overflow:auto;overscroll-behavior:contain;padding:28px 14px 14px;display:grid;gap:10px;background:linear-gradient(transparent,color-mix(in srgb,var(--card-background-color,#fff) 55%,transparent) 48px);scrollbar-width:thin} .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      button,input{font:inherit}button{cursor:pointer;border:1px solid var(--divider-color,#ccd0db);border-radius:12px;padding:9px 12px;background:var(--secondary-background-color,#eef0f7);color:inherit}
      button.primary{background:#425ca1;color:#fff;border-color:#425ca1}button:disabled{opacity:.5;cursor:default}
      button:focus-visible,input:focus-visible{outline:3px solid #778ef0;outline-offset:2px}
      .status{margin:0;font-weight:600;flex:1}.error{color:var(--error-color,#b42334);margin:0;white-space:pre-wrap}
      form{display:flex;gap:8px}input[type=text]{min-width:0;flex:1;padding:10px;border:1px solid var(--divider-color,#ccd0db);border-radius:12px;background:var(--card-background-color,#fff);color:inherit}
      label,summary{font-size:13px}.transcript{max-height:180px;overflow:auto;white-space:pre-wrap;font-size:14px}.transcript p{margin:8px 0}
      .note{font-size:11px;opacity:.7;margin:0}dialog{border:0;border-radius:20px;padding:0;width:min(600px,95vw);max-height:94dvh;color:inherit;background:var(--card-background-color,#fff);overflow:hidden}
      dialog::backdrop{background:#080e20ae;backdrop-filter:blur(5px)}dialog .panel{height:90dvh}.launch{padding:16px;width:100%}
      @media(hover:hover) and (pointer:fine){
        .controls{opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease}
        .panel:hover .controls,.controls:focus-within{opacity:1;pointer-events:auto;transform:none}
      }
      @media(prefers-reduced-motion:reduce){.controls{transition:none}}
      [hidden]{display:none!important}@media(max-width:400px){.controls{padding:24px 10px 10px;max-height:60%}}
    </style>
    <ha-card><button class="launch" hidden>Luna öffnen</button><div class="dock"></div></ha-card>
    <dialog aria-label="Mit Luna sprechen"></dialog>
    <section class="panel" aria-label="Luna Lokal">
      <div class="stage"><button class="framing" aria-pressed="false" title="Bildausschnitt wechseln">Bis zur Hüfte</button><div class="rig"></div><span class="badge">Luna · Animationsvorschau</span></div>
      <div class="controls">
        <label>Sprachassistent <select class="pipeline" aria-label="Sprachassistent"><option value="">Wird geladen …</option></select></label>
        <p class="pipeline-note note"></p>
        <div class="row"><p class="status" role="status" aria-live="polite"></p><button class="expand" aria-label="Luna als Popup öffnen">Vergrößern</button><button class="close" hidden>Schließen</button></div>
        <p class="error" role="alert" hidden></p>
        <div class="row"><button class="listen primary">Sprechen</button><button class="finish">Fertig</button><button class="stop">Stopp</button><button class="mute" aria-pressed="false">Ton aus</button></div>
        <p class="note">Aufnahme bis „Fertig“ oder mindestens 3 Sekunden Stille nach dem Sprechen.</p>
        <label><input class="continuous" type="checkbox"> Nach Lunas Antwort wieder zuhören</label>
        <form><input type="text" maxlength="2000" aria-label="Nachricht an Luna" placeholder="Oder schreibe Luna …"><button type="submit">Senden</button></form>
        <details><summary>Gespräch</summary><div class="transcript" aria-live="polite"></div></details>
        <p class="note">Audio-basierte Lippen-Näherung · Das Mikrofon stoppt beim Verlassen dieser Ansicht.</p>
        <button class="retry-animation" hidden>Animation erneut laden</button>
      </div>
    </section>`;
    this.session = new LunaSession(this._hass, {
      ...this.config, expressions: ['technical', 'live2d'].includes(this.config.avatar) && this.config.expressions !== false,
    });
    this.panel = root.querySelector('.panel'); this.dialog = root.querySelector('dialog');
    this.dock = root.querySelector('.dock'); this.dock.append(this.panel);
    this.popupOnly = this.config.presentation === 'popup';
    root.querySelector('.launch').hidden = !this.popupOnly;
    this.dock.hidden = this.popupOnly;
    root.querySelector('.continuous').checked = this.config.continuous === true;
    root.querySelector('.stage').dataset.background = ['plain', 'transparent'].includes(this.config.background) ? this.config.background : 'moon';
    root.querySelector('.stage').dataset.avatar = this.config.avatar || 'illustration';
    this.framingKey = `luna-framing:${location.pathname}:${this.config.live2d_model || this.config.avatar || 'illustration'}`;
    let framing = this.config.framing || 'full';
    try { const saved = localStorage.getItem(this.framingKey); if (['full', 'waist'].includes(saved)) framing = saved; } catch {}
    const setFraming = value => {
      root.querySelector('.stage').dataset.framing = value;
      this.currentFraming = value;
      this.rig?.setFraming?.(value);
      const button = root.querySelector('.framing');
      button.textContent = value === 'full' ? 'Bis zur Hüfte' : 'Ganz zeigen';
      button.setAttribute('aria-pressed', String(value === 'waist'));
      button.setAttribute('aria-label', value === 'full' ? 'Avatar bis zur Hüfte zeigen' : 'Avatar ganz zeigen');
    };
    setFraming(framing);
    root.querySelector('.framing').onclick = event => {
      event.stopPropagation();
      const value = root.querySelector('.stage').dataset.framing === 'full' ? 'waist' : 'full';
      setFraming(value);
      try { localStorage.setItem(this.framingKey, value); } catch {}
    };
    root.querySelector('.listen').onclick = () => this.session.listen(root.querySelector('.continuous').checked);
    root.querySelector('.finish').onclick = () => this.session.finishInput();
    root.querySelector('.stop').onclick = () => this.session.stop();
    root.querySelector('.mute').onclick = () => this.session.setMuted(!this.session.muted);
    root.querySelector('.continuous').onchange = event => { this.session.continuous = event.target.checked; };
    root.querySelector('form').onsubmit = event => {
      event.preventDefault(); const input = root.querySelector('input[type=text]');
      const text = input.value; input.value = '';
      this.session.continuous = root.querySelector('.continuous').checked;
      this.session.sendText(text);
    };
    root.querySelector('.expand').onclick = root.querySelector('.launch').onclick = () => this.openPopup();
    root.querySelector('.close').onclick = () => this.dialog.close();
    this.dialog.addEventListener('close', () => {
      if (!this.isConnected || !this.session) return;
      this.dock.append(this.panel);
      root.querySelector('.expand').hidden = false; root.querySelector('.close').hidden = true;
      if (this.popupOnly) this.session.stop();
      if (!this.config.auto_popup_instance)
        (root.querySelector(this.popupOnly ? '.launch' : '.expand')).focus();
    });
    if (this.config.avatar === 'technical') {
      this.rig = new LunaRig(root.querySelector('.rig'), this.session);
    } else if (this.config.avatar === 'live2d') {
      const startRig = () => {
        this.rig?.destroy();
        root.querySelector('.retry-animation').hidden = true;
        this.rig = new LunaLive2DRig(root.querySelector('.rig'), this.session, this.config, (state, message) => {
          root.querySelector('.badge').textContent = state === 'loading' ? 'Luna lädt …' : 'Luna';
          root.querySelector('.note').textContent = state === 'error'
            ? `Animation nicht verfügbar: ${message} Gespräche sind weiterhin möglich.`
            : 'Das Mikrofon stoppt beim Verlassen dieser Ansicht.';
          root.querySelector('.retry-animation').hidden = state !== 'error';
        });
        this.rig.setFraming(this.currentFraming);
      };
      root.querySelector('.retry-animation').onclick = startRig;
      startRig();
    } else {
      const portrait = document.createElement('img');
      portrait.className = 'portrait';
      portrait.alt = 'Luna mit tiefblauen Augen, Ragdoll-Ohren und cremefarbenem Pullover';
      portrait.src = new URL('./assets/luna-waist.png', import.meta.url).href;
      portrait.decoding = 'async';
      root.querySelector('.rig').replaceWith(portrait);
      root.querySelector('.badge').textContent = 'Luna';
      root.querySelector('.note').textContent = 'Das Mikrofon stoppt beim Verlassen dieser Ansicht.';
    }
    this.render = this.render.bind(this); this.session.addEventListener('change', this.render);
    this.loadPipelines();
    if(this.config.follow_automations !== false)this.session.avatarCommands=new AvatarCommands(this._hass);
    if (this.config.follow_rooms !== false)
      this.session.roomPlayback = new RoomPlayback(this._hass, () => this.render());
    if (this.displayOnly) {
      const style = document.createElement('style');
      style.textContent = `:host{position:fixed;inset:0;z-index:100;display:block;background:#131c31}
        ha-card,.panel,.dock{height:100%;border:0;border-radius:0;box-shadow:none}
        .controls,.badge,.launch{display:none!important}
        .stage[data-avatar],.stage{height:100%;width:100%;max-height:none;aspect-ratio:auto}
        .stage:before{width:min(22vw,22vh);height:min(22vw,22vh);right:18%;top:6%}`;
      root.append(style);
      this.panel.title = 'Antippen für Vollbild';
      this.panel.onclick = async () => {
        if (!document.fullscreenElement) {
          try { await (this.config.background === 'transparent' ? document.documentElement : this).requestFullscreen?.(); } catch {}
        }
        this.keepAwake();
      };
      this.onVisibility = () => { if (document.visibilityState === 'visible') this.keepAwake(); };
      document.addEventListener('visibilitychange', this.onVisibility);
      this.keepAwake();
    }
    this.render();
  }
  async loadPipelines() {
    const session = this.session, root = this.shadowRoot;
    const key = `luna-pipeline:${location.pathname}:${this.config.pipeline || 'auto'}`;
    try {
      const data = await session.availablePipelines();
      if (this.session !== session) return;
      const choices = data.pipelines.filter(p => p.tts_engine);
      let saved; try { saved = localStorage.getItem(key); } catch {}
      if (saved && choices.some(p => p.id === saved)) session.config.pipeline = saved;
      const selected = await session.selectPipeline();
      if (this.session !== session) return;
      const select = root.querySelector('.pipeline');select.replaceChildren();
      for (const pipeline of choices) {
        const option = document.createElement('option');option.value = pipeline.id;
        option.textContent = pipeline.name;select.append(option);
      }
      select.value = selected.id;
      const note = () => {
        const pipeline = choices.find(p => p.id === select.value);
        root.querySelector('.pipeline-note').textContent = session.localAgents.includes(pipeline?.conversation_engine)
          ? 'Luna mit lokalem Gedächtnis.' : 'Dieser Assistent verwendet Lunas lokales Gedächtnis nicht.';
      };
      note();
      select.onchange = () => {
        session.setPipeline(select.value);note();
        try { localStorage.setItem(key, select.value); } catch {}
      };
    } catch (error) {
      if (this.session === session) root.querySelector('.pipeline-note').textContent = error.message;
    }
  }
  async keepAwake() {
    if (!this.isConnected || !this.displayOnly || document.visibilityState !== 'visible' || this.wakeLock || this.wakePending) return;
    this.wakePending = true;
    try {
      const lock = await navigator.wakeLock?.request('screen');
      if (!this.isConnected || !this.displayOnly) { await lock?.release(); return; }
      this.wakeLock = lock;
      lock?.addEventListener('release', () => { if (this.wakeLock === lock) this.wakeLock = null; });
    } catch {} finally { this.wakePending = false; }
  }
  openPopup() {
    if (this.dialog.open) return;
    this.dialog.append(this.panel);
    this.shadowRoot.querySelector('.expand').hidden = true;
    this.shadowRoot.querySelector('.close').hidden = false;
    this.dialog.showModal();
  }
  render() {
    const s = this.session, root = this.shadowRoot;
    const remote = s.phase === 'idle' ? s.roomPlayback?.sample() : null;
    root.querySelector('.status').textContent = remote ? `Luna spricht · ${remote.room}` : PHASES[s.phase];
    const error = root.querySelector('.error'); error.textContent = s.error; error.hidden = !s.error;
    root.querySelector('.finish').disabled = s.phase !== 'listening';
    root.querySelector('.stop').disabled = s.phase === 'idle' || s.phase === 'error';
    root.querySelector('.listen').textContent = s.phase === 'speaking' ? 'Unterbrechen & sprechen' : 'Sprechen';
    root.querySelector('.mute').textContent = s.muted ? 'Ton an' : 'Ton aus';
    root.querySelector('.mute').setAttribute('aria-pressed', String(s.muted));
    const transcript = root.querySelector('.transcript'); transcript.replaceChildren();
    for (const message of s.transcript) {
      const p = document.createElement('p');
      p.textContent = `${message.who === 'luna' ? 'Luna' : 'Du'}: ${message.text}`;
      transcript.append(p);
    }
    transcript.scrollTop = transcript.scrollHeight;
    if (!this.config.auto_popup_instance)
      window.dispatchEvent(new CustomEvent('luna-avatar-state', {detail:{card:this,config:this.config}}));
  }
  teardown() {
    if (this.onVisibility) document.removeEventListener('visibilitychange', this.onVisibility);
    this.onVisibility = null;
    this.wakeLock?.release().catch(() => {}); this.wakeLock = null;
    this.rig?.destroy(); this.rig = null;
    this.session?.roomPlayback?.destroy();
    this.session?.avatarCommands?.destroy();
    this.session?.destroy(); this.session = null;
    this.shadowRoot.replaceChildren();
  }
}
if (!customElements.get('luna-avatar-card')) customElements.define('luna-avatar-card', LunaAvatarCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'luna-avatar-card')) window.customCards.push({
  type: 'luna-avatar-card', name: 'Luna Lokal', description: 'Luna mit Browser-Mikrofon, Sprachausgabe und Avatar-Vorschau',
});

installAutoPopup();
