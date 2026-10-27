import {estimateViseme} from '../../../custom_components/luna_local/frontend/rig.mjs';

export const FACE_POSES = {
  // head tilt (radians), brow lift (pixels), blush, gaze x, eye softness
  neutral: [0, 0, 0, 0, 0], joyful: [.012, 1, .35, 0, .12],
  amused: [-.018, 1.5, .25, 0, .2], shy: [-.025, -.5, .8, -1.4, .1],
  curious: [.025, 2, 0, 1, 0], thoughtful: [-.012, -.5, 0, -1, .06],
  surprised: [0, 3, .1, 0, 0], concerned: [.014, -1, 0, 0, .05],
  sad: [-.014, -1.5, 0, -.6, .12],
};
export const MOUTH_TARGETS = {
  sil: [0, 1, .1, 0], PP: [0, 1, .1, 0],
  aa: [1, 1, .85, 0], E: [1, 1.12, .43, 0],
  O: [1, 1, 1, 1], FF: [1, 1.04, .2, 0],
};
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export function eased(current, target, seconds, timeConstant = .18) {
  return current + (target - current) * (1 - Math.exp(-clamp(seconds, 0, .1) / timeConstant));
}

// Continuous geometry: the original character is one mesh, not separate moving
// head/neck stickers. Coordinates describe the approved 1024 x 1536 illustration.
const VERTEX = `
attribute vec2 position;
varying vec2 uv;
uniform float time, tilt, nod, breath, gesture, still;
float bump(vec2 p, vec2 c, vec2 radius) { vec2 d=(p-c)/radius; return exp(-dot(d,d)*2.0); }
void main(){
  uv=position;
  vec2 p=position;
  float head=1.0-smoothstep(.31,.45,p.y);
  vec2 pivot=vec2(.50,.36);
  vec2 rel=(p-pivot)*vec2(1.,1.5);
  float a=tilt;
  vec2 rotated=vec2(cos(a)*rel.x-sin(a)*rel.y,sin(a)*rel.x+cos(a)*rel.y);
  p+=(rotated-rel)/vec2(1.,1.5)*head;
  p.y+=nod*head;
  float chest=bump(position,vec2(.5,.57),vec2(.40,.32));
  p.y-=breath*chest;
  p.x+=(position.x-.5)*breath*.35*chest;
  float arms=smoothstep(.15,.40,abs(position.x-.5))*smoothstep(.42,.93,position.y);
  p.x+=sign(position.x-.5)*gesture*arms;
  p.y-=abs(gesture)*arms*.35;
  // Hair follows the head with a very small lag at the ends.
  float hair=bump(position,vec2(.28,.32),vec2(.11,.12))+bump(position,vec2(.75,.29),vec2(.11,.12));
  p.x+=sin(time*1.05-0.6)*.0014*hair*(1.-still);
  float ears=bump(position,vec2(.285,.10),vec2(.10,.08))+bump(position,vec2(.72,.07),vec2(.10,.08));
  p.y+=sin(time*.67)*.0007*ears*(1.-still);
  p=(p-.5)*.955+.5;
  gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);
}`;
const FRAGMENT = `
precision highp float;
varying vec2 uv;
uniform sampler2D original, keyframe, rounded;
uniform float blink, mouth, mouthWidth, mouthHeight, roundness, blush, brow, gaze, softness;
const vec2 size=vec2(1024.,1536.);
float oval(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.65,1.,length((p-c)/r));}
vec4 sampleBase(vec2 p){return texture2D(original,p/size);}
void main(){
 vec2 p=uv*size;
 vec2 eyes[2]; eyes[0]=vec2(443.,378.); eyes[1]=vec2(601.,349.);
 vec2 q=p;
 for(int i=0;i<2;i++){
  vec2 center=eyes[i];
  float region=oval(p,center,vec2(65.,48.));
  // Slight softness preserves the painted eyes and never turns them into slits.
  q.y+=(p.y-center.y)*softness*.3*region;
  float iris=oval(p,center,vec2(25.,28.));
  q.x-=gaze*iris;
 }
 // Restrained brow motion, feathered into the surrounding original paint.
 q.y+=brow*(oval(p,vec2(439.,319.),vec2(39.,18.))+oval(p,vec2(575.,286.),vec2(42.,18.)));
 vec4 color=sampleBase(q);
 for(int i=0;i<2;i++){
  vec2 center=eyes[i];
  float mask=oval(p,center,vec2(68.,51.));
  // Compress the visible opening before showing the painted closed eyelid.
  float lid=clamp(blink,0.,1.);
  vec2 eyePoint=q;
  eyePoint.y=center.y+(q.y-center.y+10.*lid)/max(.18,1.-lid*.82);
  vec4 compressed=sampleBase(mix(q,eyePoint,mask));
  vec4 closed=texture2D(keyframe,p/size);
  vec4 eye=mix(compressed,closed,smoothstep(.25,.85,lid));
  color=mix(color,eye,mask*lid);
 }
 vec2 mc=vec2(530.,450.);
 float erase=oval(p,vec2(530.,447.),vec2(43.,16.));
 vec4 skin=.5*(sampleBase(p+vec2(0.,-21.))+sampleBase(p+vec2(0.,21.)));
 color=mix(color,skin,erase*mouth);
 float mm=oval(p,mc,vec2(36.*mouthWidth,28.*mouthHeight));
 vec2 mp=mc+(p-mc)/vec2(max(.55,mouthWidth),max(.14,mouthHeight));
 // Only mouth pixels come from generated keyframes; the face stays original.
 vec4 openMouth=texture2D(keyframe,mp/size);
 vec4 roundMouth=texture2D(rounded,p/size);
 float roundedMask=oval(p,mc,vec2(27.,25.));
 color=mix(color,openMouth,mm*mouth*(1.-roundness));
 color=mix(color,roundMouth,roundedMask*mouth*roundness);
 float cheeks=oval(p,vec2(414.,415.),vec2(43.,24.))+oval(p,vec2(628.,387.),vec2(39.,23.));
 color.rgb=mix(color.rgb,vec3(.96,.49,.53),cheeks*blush*.13);
 gl_FragColor=color;
}`;

function shader(gl, kind, source) {
  const result = gl.createShader(kind); gl.shaderSource(result, source); gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(result); gl.deleteShader(result); throw Error(error);
  }
  return result;
}
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url;
  });
}

export class IllustrationRig {
  constructor(host, session) {
    this.host = host; this.session = session; this.destroyed = false;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'portrait animated-portrait';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Luna, animierte Originalillustration');
    this.fallback = document.createElement('img'); this.fallback.className = 'portrait';
    this.fallback.alt = 'Luna'; this.fallback.src = new URL('./assets/luna-waist.png', import.meta.url).href;
    host.replaceChildren(this.fallback);
    this.pose = [...FACE_POSES.neutral]; this.mouth = [...MOUTH_TARGETS.sil];
    this.samples = new Float32Array(2048); this.spectrum = new Float32Array(1024);
    this.media = matchMedia('(prefers-reduced-motion: reduce)');
    this.nextBlink = 2.8; this.blinkStart = -10; this.blinkCount = 0;
    this.lastPhase = 'idle'; this.phaseStart = 0; this.lastShape = 'sil'; this.lastShapeTime = 0;
    this.poseStart = 0; this.time = 0; this.visible = true;
    this.observer = new IntersectionObserver(entries => { this.visible = entries[0]?.isIntersecting ?? true; });
    this.observer.observe(host);
    this.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.failed = true; this.canvas.replaceWith(this.fallback);
    });
    this.ready = this.initialize().catch(() => {
      this.failed = true; this.session.avatarWarning = 'Animation nicht verfügbar; Luna wird als Originalbild angezeigt.';
      this.session.emit();
    });
  }
  async initialize() {
    const images = await Promise.all(['luna-waist.png', 'luna-face-keyframe.png', 'luna-mouth-round.png']
      .map(name => loadImage(new URL('./assets/' + name, import.meta.url).href)));
    if (this.destroyed) return;
    const gl = this.canvas.getContext('webgl', {alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power'});
    if (!gl) throw Error('WebGL unavailable');
    this.gl = gl;
    const program = gl.createProgram(); this.program = program;
    const vertex = shader(gl, gl.VERTEX_SHADER, VERTEX), fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const vertices = [], cols = 40, rows = 60;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const left = x / cols, right = (x + 1) / cols, top = y / rows, bottom = (y + 1) / rows;
      vertices.push(left, top, right, top, left, bottom, left, bottom, right, top, right, bottom);
    }
    this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); this.count = vertices.length / 2;
    const location = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    this.textures = images.map((image, i) => {
      const texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(gl.getUniformLocation(program, ['original', 'keyframe', 'rounded'][i]), i);
      return texture;
    });
    this.uniforms = Object.fromEntries(['time','tilt','nod','breath','gesture','still','blink','mouth','mouthWidth','mouthHeight','roundness','blush','brow','gaze','softness']
      .map(name => [name, gl.getUniformLocation(program, name)]));
    this.host.replaceChildren(this.canvas);
    this.draw(0, {});
    this.tick = this.tick.bind(this); this.frame = requestAnimationFrame(this.tick);
  }
  tick(now) {
    if (this.destroyed || this.failed) return;
    const dt = this.lastFrame ? Math.min(.05, (now - this.lastFrame) / 1000) : 0;
    this.lastFrame = now;
    if (this.visible && !document.hidden) {
      if (!this.preview) this.time += dt;
      this.draw(this.time, {dt, ...(this.preview || {})});
    }
    this.frame = requestAnimationFrame(this.tick);
  }
  draw(time, options = {}) {
    const gl = this.gl; if (!gl || this.destroyed || this.failed) return;
    const s = this.session, dt = options.dt ?? .016, reduced = this.media.matches;
    const expression = options.expression || s.expression?.name || 'neutral';
    const intensity = clamp(options.intensity ?? s.expression?.intensity ?? 0, 0, 1);
    const target = FACE_POSES[expression] || FACE_POSES.neutral;
    this.pose = this.pose.map((value, i) => eased(value, target[i] * intensity, dt, .38));
    if (s.phase !== this.lastPhase) { this.lastPhase = s.phase; this.phaseStart = time; }
    let shape = options.shape || 'sil';
    if (!options.shape && s.phase === 'speaking' && s.analyser && s.audioContext?.state === 'running') {
      s.analyser.getFloatTimeDomainData(this.samples); s.analyser.getFloatFrequencyData(this.spectrum);
      shape = estimateViseme(this.samples, this.spectrum, s.audioContext.sampleRate, 2048);
    }
    // Close immediately on interruption/silence. Otherwise allow coarticulation.
    if (shape === 'sil' || time - this.lastShapeTime > .075 || options.shape) {
      this.lastShape = shape; this.lastShapeTime = time;
    }
    const mt = MOUTH_TARGETS[this.lastShape] || MOUTH_TARGETS.sil;
    this.mouth = this.mouth.map((value, i) => shape === 'sil' ? MOUTH_TARGETS.sil[i] : eased(value, mt[i], dt, .035));
    if (time >= this.nextBlink && !reduced) {
      this.blinkStart = time; this.nextBlink = time + 3.2 + (this.blinkCount++ % 3) * .7;
    }
    const blinkAge = time - this.blinkStart;
    const blink = options.blink ?? (blinkAge >= 0 && blinkAge < .18 ? Math.sin(blinkAge / .18 * Math.PI) ** .7 : 0);
    const elapsed = time - this.phaseStart;
    const nod = !reduced && s.phase === 'speaking' && elapsed < .85
      ? Math.sin(elapsed / .85 * Math.PI) * .0025 : 0;
    const gesture = !reduced && s.phase === 'speaking'
      ? Math.sin(Math.min(elapsed / 1.4, 1) * Math.PI) * .004 : 0;
    const values = {
      time, tilt: this.pose[0] + (reduced ? 0 : Math.sin(time * .62) * .004),
      nod, breath: reduced ? 0 : (1 + Math.sin(time * 1.35)) * .00075, gesture,
      still: reduced ? 1 : 0, blink,
      mouth: this.mouth[0], mouthWidth: this.mouth[1], mouthHeight: this.mouth[2], roundness: this.mouth[3],
      blush: this.pose[2], brow: this.pose[1], gaze: this.pose[3], softness: this.pose[4],
      ...options.uniforms,
    };
    const rect = this.host.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(2, Math.min(1024, Math.round(rect.width * ratio)));
    const height = Math.round(width * 1.5);
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    gl.viewport(0, 0, width, height); gl.useProgram(this.program); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    for (const [name, value] of Object.entries(values)) if (name in this.uniforms) gl.uniform1f(this.uniforms[name], value);
    gl.drawArrays(gl.TRIANGLES, 0, this.count);
    s.viseme = this.lastShape;
  }
  destroy() {
    this.destroyed = true; cancelAnimationFrame(this.frame); this.observer?.disconnect();
    if (this.gl) {
      this.textures?.forEach(texture => this.gl.deleteTexture(texture));
      this.gl.deleteBuffer(this.buffer); this.gl.deleteProgram(this.program);
    }
  }
}
