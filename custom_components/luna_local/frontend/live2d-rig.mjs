import {LunaPerformance} from './performance.mjs?v=20261028-v9';

export function localAssetURL(path, base = globalThis.location.href) {
  const url = new URL(path, base), origin = new URL(base).origin;
  if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw Error('Lunas Modell und Animation müssen von dieser Home-Assistant-Instanz geladen werden.');
  return url.href;
}

export class LunaLive2DRig {
  constructor(host, session, config = {}, onStatus = () => {}) {
    this.host = host; this.session = session; this.config = config; this.onStatus = onStatus;
    this.abort = new AbortController(); this.performance = new LunaPerformance();
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.visible = true; this.framing = config.framing || 'full';
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Luna: animierte Ragdoll-Katze');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;position:relative;z-index:1';
    this.portrait = document.createElement('img'); this.portrait.className = 'portrait';
    this.portrait.src = new URL('./assets/luna-waist.png', import.meta.url).href;
    this.portrait.alt = 'Luna mit tiefblauen Augen und cremefarbenem Pullover';
    host.replaceChildren(this.portrait);
    this.resize = new ResizeObserver(() => this.size()); this.resize.observe(host);
    this.visibility = new IntersectionObserver(entries => {
      this.visible = entries[0]?.isIntersecting !== false;
    }); this.visibility.observe(host);
    this.lost = event => {event.preventDefault(); this.failed(Error('Die Grafikverbindung wurde unterbrochen.'));};
    this.canvas.addEventListener('webglcontextlost', this.lost);
    this.ready = this.load();
  }
  async load() {
    try {
      this.onStatus('loading');
      const runtimeURL = localAssetURL(this.config.live2d_runtime || '/local/luna/runtime/runtime.mjs');
      const modelURL = localAssetURL(this.config.live2d_model || '/local/luna/model/luna.model3.json');
      const runtime = await import(runtimeURL);
      if (this.abort.signal.aborted) return;
      const player = await runtime.mountLuna(this.canvas, modelURL, {signal: this.abort.signal});
      if (this.abort.signal.aborted) { player.dispose(); return; }
      this.player = player; this.host.replaceChildren(this.canvas); this.size();
      this.last = performance.now(); this.started = this.last; this.onStatus('ready');
      this.frame = requestAnimationFrame(now => this.tick(now));
    } catch (error) { if (!this.abort.signal.aborted) this.failed(error); }
  }
  size() {
    const rect = this.host.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
  }
  setFraming(value) { this.framing = value === 'waist' ? 'waist' : 'full'; }
  view() {
    if (this.framing !== 'waist') return {zoom: 1, y: 0};
    const requested = this.config.waist_zoom ?? this.player?.waistZoom ?? 1.2;
    const fraction = Math.min(.95, .95 * this.canvas.width / this.canvas.height * 1.5);
    const zoom = Math.min(3, requested * .95 / fraction);
    return {zoom, y: (zoom * fraction - .95) / 2};
  }
  tick(now) {
    if (this.abort.signal.aborted || !this.player) return;
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    try {
      if (this.visible && !document.hidden) {
        this.player.draw(dt, {...this.performance.sample(this.session, (now - this.started) / 1000, dt, this.reduced.matches), view: this.view()});
      }
    } catch (error) { this.failed(error); return; }
    this.frame = requestAnimationFrame(next => this.tick(next));
  }
  failed(error) {
    cancelAnimationFrame(this.frame); this.player?.dispose(); this.player = null;
    this.host.replaceChildren(this.portrait);
    this.onStatus('error', error?.message || String(error));
  }
  destroy() {
    this.abort.abort(); cancelAnimationFrame(this.frame);
    this.resize.disconnect(); this.visibility.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.lost);
    this.player?.dispose(); this.player = null;
  }
}
