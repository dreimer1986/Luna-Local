// Core must exist BEFORE evaluating Framework enums (not just before creating models).
let ready;
export async function mountLuna(...args) {
  if (!ready) ready = (async () => {
    if (!globalThis.Live2DCubismCore) await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('./Core/live2dcubismcore.min.js', import.meta.url).href;
      script.onload = resolve;
      script.onerror = () => {script.remove(); reject(Error('Cubism Core konnte nicht geladen werden.'));};
      document.head.append(script);
    });
    return import('./player.mjs');
  })().catch(error => {ready = null; throw error;});
  const runtime = await ready;
  return runtime.mountLuna(...args);
}
