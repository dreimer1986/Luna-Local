import {RoomPlayback} from './room-playback.mjs?v=20261029-v10';

// Independent of dashboard card lifecycle: HA loads this as an extra JS module.
export class PopupTiming {
  constructor(delay = 3000) { this.delay = delay; this.dismissed = new Set(); this.lastActive = null; }
  update(ids, now) {
    const active = new Set(ids);
    for (const id of this.dismissed) if (!active.has(id)) this.dismissed.delete(id);
    const wanted = ids.filter(id => !this.dismissed.has(id));
    if (wanted.length) { this.lastActive = now; return true; }
    if (ids.length) { this.lastActive = null; return false; }
    return this.lastActive !== null && now - this.lastActive < this.delay;
  }
  dismiss(ids) { ids.forEach(id => this.dismissed.add(id)); this.lastActive = null; }
}

function findCard(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.type === 'custom:luna-avatar-card' && !value.display_only) return value;
  for (const item of Object.values(value)) {
    const found = findCard(item); if (found) return found;
  }
  return null;
}

export class LunaAutoPopup {
  constructor(env = globalThis) {
    this.env = env; this.timing = new PopupTiming(); this.sources = new Map(); this.ids = [];
    this.onCard = event => {
      const {card, config} = event.detail || {};
      if (!card || config?.auto_popup_instance) return;
      if (config) this.config = {...config};
      this.sources.set(card, true); this.update();
    };
    env.addEventListener('luna-avatar-state', this.onCard);
    this.timer = env.setInterval(() => this.connect(), 500);
    this.connect();
  }
  async connect() {
    const hass = this.env.document.querySelector('home-assistant')?.hass;
    if (!hass?.connection) { this.close(); return; }
    if (this.hass?.connection !== hass.connection) {
      this.remote?.destroy(); this.close(); this.hass = hass;
      this.remote = new RoomPlayback(hass, () => this.update(), this.env);
      const connection = hass.connection;
      try {
        const config = await hass.callWS({type:'lovelace/config'});
        if (this.hass?.connection === connection && !this.config) this.config = findCard(config);
      } catch { /* A visible card can provide its configuration later. */ }
    }
    this.hass = hass;
    if (this.card) this.card.hass = hass;
    this.update();
  }
  update() {
    if (!this.hass) return;
    let source = null;
    for (const card of this.sources.keys()) {
      if (!card.isConnected || !card.session) { this.sources.delete(card); continue; }
      if (card.session.phase === 'speaking') source = card;
    }
    const room = this.remote?.sample();
    this.ids = [
      ...(source ? [`local:${source.session.generation}`] : []),
      ...(room ? [`room:${room.id}`] : []),
    ];
    const wanted = this.timing.update(this.ids, this.env.performance.now());
    // An already-open avatar popup/fullscreen needs no duplicate overlay.
    const alreadyVisible = [...this.sources.keys()].some(c => c.displayOnly || c.dialog?.open);
    if (this.env.document.hidden || alreadyVisible || !wanted) { this.close(); return; }
    if (!this.config) return;
    if (!this.card) this.open();
    if (!this.card) return;
    if (this.card.rig) this.card.rig.session = source?.session || this.card.session;
  }
  open() {
    const card = this.env.document.createElement('luna-avatar-card');
    card.setConfig({...this.config, presentation:'popup', display_only:false,
      continuous:false, follow_rooms:false, follow_automations:false, auto_popup_instance:true});
    card.hass = this.hass;
    // Keep the launcher out of the document layout; the modal uses the top layer.
    card.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;z-index:10000';
    this.env.document.body.append(card);
    this.card = card;
    card.session.roomPlayback = {sample: () => this.remote?.sample(), destroy() {}};
    const style = this.env.document.createElement('style');
    style.textContent = '.controls,.framing,.badge{display:none!important}.auto-close{position:absolute;right:10px;top:10px;z-index:5}';
    card.shadowRoot.append(style);
    const button = this.env.document.createElement('button');
    button.className = 'auto-close'; button.textContent = 'Schließen';
    button.onclick = () => this.dismiss();
    card.panel.append(button);
    card.dialog.addEventListener('cancel', event => { event.preventDefault(); this.dismiss(); });
    card.openPopup();
  }
  dismiss() { this.timing.dismiss(this.ids); this.close(); }
  close() {
    const card = this.card; this.card = null;
    if (card) { card.dialog.close(); card.remove(); }
  }
}

export function installAutoPopup(env = globalThis) {
  if (!env.__lunaAutoPopup) env.__lunaAutoPopup = new LunaAutoPopup(env);
  return env.__lunaAutoPopup;
}
