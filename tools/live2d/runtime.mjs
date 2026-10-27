// Luna-owned adapter to the official Cubism Web Framework, built locally.
// No sample model or proprietary Core is embedded in this source file.
import {CubismFramework} from '@framework/live2dcubismframework';
import {CubismUserModel} from '@framework/model/cubismusermodel';
import {CubismModelSettingJson} from '@framework/cubismmodelsettingjson';
import {CubismMatrix44} from '@framework/math/cubismmatrix44';
import {CubismEyeBlink} from '@framework/effect/cubismeyeblink';
import {ACubismMotion} from '@framework/motion/acubismmotion';

let corePromise;
async function initializeCore() {
  if (!corePromise) corePromise = new Promise((resolve, reject) => {
    if (globalThis.Live2DCubismCore) return resolve();
    const script = document.createElement('script');
    script.src = new URL('./Core/live2dcubismcore.min.js', import.meta.url).href;
    script.onload = resolve;
    script.onerror = () => {script.remove(); reject(Error('Cubism Core konnte nicht geladen werden.'));};
    document.head.append(script);
  }).catch(error => {corePromise = null; throw error;});
  await corePromise;
  if (!CubismFramework.isStarted()) CubismFramework.startUp();
  if (!CubismFramework.isInitialized()) CubismFramework.initialize();
}

function assetURL(file, base) {
  if (typeof file !== 'string' || !file || file.includes('\\')) throw Error('Ungültiger Modellpfad');
  const decoded = decodeURIComponent(file);
  const url = new URL(decoded, base), folder = new URL('.', base);
  if (url.origin !== folder.origin || !url.pathname.startsWith(folder.pathname) || url.search || url.hash)
    throw Error('Modell-Dateien müssen im selben Modellordner liegen.');
  return url;
}

export async function mountLuna(canvas, modelURL, {signal} = {}) {
  await initializeCore();
  signal?.throwIfAborted();
  const base = new URL(modelURL, location.href);
  if (base.origin !== location.origin) throw Error('Modell muss lokal bereitgestellt werden.');
  const load = async url => {
    const response = await fetch(url, {signal, credentials: 'same-origin'});
    if (!response.ok) throw Error(`Modell-Datei nicht verfügbar (${response.status})`);
    return response.arrayBuffer();
  };
  const buffer = await load(base), data = JSON.parse(new TextDecoder().decode(buffer));
  const setting = new CubismModelSettingJson(buffer, buffer.byteLength);
  const gl = canvas.getContext('webgl', {alpha: true, premultipliedAlpha: true, antialias: true});
  if (!gl) {setting.release(); throw Error('WebGL ist nicht verfügbar.');}
  const model = new CubismUserModel(), textures = [], motions = new Map(), expressions = new Map();
  let disposed = false, activeGroup = '', activeExpression = '', contextLost = false;
  const lost = event => {event.preventDefault(); contextLost = true;};
  canvas.addEventListener('webglcontextlost', lost);
  const dispose = () => {
    if (disposed) return;
    disposed = true; canvas.removeEventListener('webglcontextlost', lost);
    model.release();
    textures.forEach(texture => gl.deleteTexture(texture));
    motions.forEach(list => list.forEach(motion => ACubismMotion.delete(motion)));
    expressions.forEach(motion => ACubismMotion.delete(motion));
    setting.release();
  };
  try {
    model.loadModel(await load(assetURL(data.FileReferences.Moc, base)), true);
    if (!model._model) throw Error('Cubism hat das Modell zurückgewiesen.');
    model.createRenderer(canvas.width, canvas.height);
    const renderer = model.getRenderer(); renderer.startUp(gl); renderer.setIsPremultipliedAlpha(true);
    for (const [i, file] of data.FileReferences.Textures.entries()) {
      const bytes = await load(assetURL(file, base));
      const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}), {premultiplyAlpha: 'premultiply'});
      try {
        signal?.throwIfAborted();
        const texture = gl.createTexture(); textures.push(texture);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        renderer.bindTexture(i, texture);
      } finally { bitmap.close(); }
    }
    if (data.FileReferences.Physics) {
      const bytes = await load(assetURL(data.FileReferences.Physics, base)); model.loadPhysics(bytes, bytes.byteLength);
    }
    if (data.FileReferences.Pose) {
      const bytes = await load(assetURL(data.FileReferences.Pose, base)); model.loadPose(bytes, bytes.byteLength);
    }
    model._eyeBlink = CubismEyeBlink.create(setting);
    for (const entry of data.FileReferences.Expressions || []) {
      const bytes = await load(assetURL(entry.File, base));
      const expression = model.loadExpression(bytes, bytes.byteLength, entry.Name);
      if (!expression) throw Error('Ungültiger Gesichtsausdruck');
      expressions.set(entry.Name, expression);
    }
    for (const [group, entries] of Object.entries(data.FileReferences.Motions || {})) {
      const list = []; motions.set(group, list);
      for (const [i, entry] of entries.entries()) {
        const bytes = await load(assetURL(entry.File, base));
        const motion = model.loadMotion(bytes, bytes.byteLength, `${group}:${i}`, undefined, undefined, setting, group, i);
        if (!motion) throw Error('Ungültige Bewegung');
        motion.setEffectIds(
          Array.from({length: setting.getEyeBlinkParameterCount()}, (_, n) => setting.getEyeBlinkParameterId(n)),
          Array.from({length: setting.getLipSyncParameterCount()}, (_, n) => setting.getLipSyncParameterId(n)),
        );
        list.push(motion);
      }
    }
    signal?.throwIfAborted();
    const ids = new Map();
    for (let i = 0; i < model._model.getParameterCount(); i++) {
      const id = model._model.getParameterId(i); ids.set(id.getString(), id);
    }
    model._model.saveParameters();
    const shaderPath = new URL('./Shaders/WebGL/', import.meta.url).href;
    return {
      parameterIds: [...ids.keys()], expressionNames: [...expressions.keys()],
      motionGroups: [...motions.keys()], dispose,
      draw(dt, {group = 'Idle', expression = 'neutral', parameters = {}, reducedMotion = false} = {}) {
        if (disposed) return;
        if (contextLost) throw Error('Grafikkontext verloren; Ansicht neu öffnen.');
        dt = Math.max(0, Math.min(.05, Number.isFinite(dt) ? dt : 0));
        const core = model._model;
        core.loadParameters();
        if (!reducedMotion) {
          const desired = motions.has(group) ? group : 'Idle';
          if (motions.get(desired)?.length && (activeGroup !== desired || model._motionManager.isFinished())) {
            model._motionManager.startMotionPriority(motions.get(desired)[0], false, 1); activeGroup = desired;
          }
          model._motionManager.updateMotion(core, dt);
          core.saveParameters();
          model._eyeBlink.updateParameters(core, dt);
        }
        const face = expressions.has(expression) ? expression : 'neutral';
        if (face !== activeExpression && expressions.has(face)) {
          model._expressionManager.startMotionPriority(expressions.get(face), false, 1); activeExpression = face;
        }
        model._expressionManager.updateMotion(core, dt);
        for (const [name, value] of Object.entries(parameters)) {
          if (ids.has(name) && Number.isFinite(value)) core.setParameterValueById(ids.get(name), value);
        }
        if (!reducedMotion) model._physics?.evaluate(core, dt);
        model._pose?.updateParameters(core, dt); core.update();
        const w = canvas.width, h = canvas.height;
        model.setRenderTargetSize(w, h);
        const matrix = new CubismMatrix44(); matrix.scale(h / w, 1);
        const mm = model.getModelMatrix();
        mm.setHeight(Math.min(1.9, 1.9 * (w / h) * core.getCanvasHeight() / core.getCanvasWidth()));
        mm.setPosition(0, 0); matrix.multiplyByMatrix(mm);
        renderer.setMvpMatrix(matrix); renderer.setRenderState(null, [0, 0, w, h]);
        gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        renderer.drawModel(shaderPath);
      },
    };
  } catch (error) {dispose(); throw error;}
}
