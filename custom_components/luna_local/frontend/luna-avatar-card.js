import {LunaSession, PHASES} from './session.mjs?v=0.4.0b4';
import {LunaRig} from './rig.mjs?v=0.4.0b4';
import {LunaLive2DRig, localAssetURL} from './live2d-rig.mjs?v=0.4.0b4';

class LunaAvatarCard extends HTMLElement {
  constructor() { super(); this.attachShadow({mode: 'open'}); }
  setConfig(config) {
    if (!['card', 'popup'].includes(config.presentation || 'card')) throw Error('presentation: card oder popup');
    if (!['illustration', 'technical', 'live2d'].includes(config.avatar || 'illustration')) throw Error('avatar: illustration, live2d oder technical');
    if (config.avatar === 'live2d') {
      if (config.live2d_model) localAssetURL(config.live2d_model);
      if (config.live2d_runtime) localAssetURL(config.live2d_runtime);
    }
    this.teardown();
    this.config = {...config};
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
      .panel{background:var(--card-background-color,#fff);color:var(--primary-text-color,#242032);border-radius:18px;overflow:hidden}
      .stage{height:390px;position:relative;overflow:hidden;background:radial-gradient(ellipse at 70% 20%,#737ba4 0,#293556 35%,#131c31 85%)}
      .stage:before{content:'';position:absolute;width:135px;height:135px;border-radius:50%;right:10%;top:24px;background:#f5f0db;box-shadow:0 0 55px #e2e5ff75}
      .stage[data-background="plain"]{background:var(--secondary-background-color,#e7e9ef)}.stage[data-background="plain"]:before{display:none}
      .rig{height:100%;position:relative;z-index:1}.rig svg{width:100%;height:100%;display:block}
      .stage[data-avatar="illustration"],.stage[data-avatar="live2d"]{width:100%;height:auto;aspect-ratio:2/3;max-height:640px}
      .stage[data-avatar="live2d"] .rig{position:absolute;inset:0}
      .portrait{display:block;width:100%;height:100%;object-fit:contain;object-position:center;position:relative;z-index:1}
      .badge{position:absolute;bottom:10px;left:12px;background:#121a30d9;color:#fff;padding:5px 10px;border-radius:16px;font:12px system-ui;z-index:2}
      .controls{padding:14px;display:grid;gap:10px} .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      button,input{font:inherit}button{cursor:pointer;border:1px solid var(--divider-color,#ccd0db);border-radius:12px;padding:9px 12px;background:var(--secondary-background-color,#eef0f7);color:inherit}
      button.primary{background:#425ca1;color:#fff;border-color:#425ca1}button:disabled{opacity:.5;cursor:default}
      button:focus-visible,input:focus-visible{outline:3px solid #778ef0;outline-offset:2px}
      .status{margin:0;font-weight:600;flex:1}.error{color:var(--error-color,#b42334);margin:0;white-space:pre-wrap}
      form{display:flex;gap:8px}input[type=text]{min-width:0;flex:1;padding:10px;border:1px solid var(--divider-color,#ccd0db);border-radius:12px;background:var(--card-background-color,#fff);color:inherit}
      label,summary{font-size:13px}.transcript{max-height:180px;overflow:auto;white-space:pre-wrap;font-size:14px}.transcript p{margin:8px 0}
      .note{font-size:11px;opacity:.7;margin:0}dialog{border:0;border-radius:20px;padding:0;width:min(600px,95vw);max-height:94dvh;color:inherit;background:var(--card-background-color,#fff);overflow:auto}
      dialog::backdrop{background:#080e20ae;backdrop-filter:blur(5px)}dialog .stage{height:min(58dvh,580px)}.launch{padding:16px;width:100%}
      [hidden]{display:none!important}@media(max-width:400px){.stage{height:330px}.controls{padding:10px}}
    </style>
    <ha-card><button class="launch" hidden>Luna öffnen</button><div class="dock"></div></ha-card>
    <dialog aria-label="Mit Luna sprechen"></dialog>
    <section class="panel" aria-label="Luna Lokal">
      <div class="stage"><div class="rig"></div><span class="badge">Luna · Animationsvorschau</span></div>
      <div class="controls">
        <div class="row"><p class="status" role="status" aria-live="polite"></p><button class="expand" aria-label="Luna als Popup öffnen">Vergrößern</button><button class="close" hidden>Schließen</button></div>
        <p class="error" role="alert" hidden></p>
        <div class="row"><button class="listen primary">Sprechen</button><button class="finish">Fertig</button><button class="stop">Stopp</button><button class="mute" aria-pressed="false">Ton aus</button></div>
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
    root.querySelector('.stage').dataset.background = this.config.background === 'plain' ? 'plain' : 'moon';
    root.querySelector('.stage').dataset.avatar = this.config.avatar || 'illustration';
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
      this.dock.append(this.panel);
      root.querySelector('.expand').hidden = false; root.querySelector('.close').hidden = true;
      if (this.popupOnly) this.session.stop();
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
    this.render();
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
    root.querySelector('.status').textContent = PHASES[s.phase];
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
  }
  teardown() {
    this.rig?.destroy(); this.rig = null;
    this.session?.destroy(); this.session = null;
    this.shadowRoot.replaceChildren();
  }
}
if (!customElements.get('luna-avatar-card')) customElements.define('luna-avatar-card', LunaAvatarCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'luna-avatar-card')) window.customCards.push({
  type: 'luna-avatar-card', name: 'Luna Lokal', description: 'Luna mit Browser-Mikrofon, Sprachausgabe und Avatar-Vorschau',
});
