// Original, layered SVG preview rig. No external animation runtime required.
// Outfit/background are separate groups; the character's identity is fixed.
export const MOUTHS = {
  sil: 'M239 296 Q250 303 261 296 Q250 301 239 296Z',
  PP: 'M238 298 Q250 294 262 298 Q250 302 238 298Z',
  aa: 'M237 294 Q250 288 263 294 Q264 316 250 318 Q236 316 237 294Z',
  E: 'M231 296 Q250 289 269 296 Q263 309 250 309 Q237 309 231 296Z',
  O: 'M244 292 Q256 288 259 300 Q258 314 248 313 Q239 310 241 300Z',
  FF: 'M235 297 Q250 291 265 297 L260 304 Q250 300 240 304Z',
};

export const POSES = {
  // tilt, eye opening, brow lift, blush, ear angle, gaze
  neutral: [0, 1, 0, .25, 0, 0],
  joyful: [2, .85, -2, .45, -3, 0],
  amused: [-2, .6, -1, .4, -4, 0],
  shy: [-5, .85, 1, 1, 5, 2],
  curious: [5, 1.05, -3, .25, -5, 1],
  thoughtful: [-3, .88, 1, .2, 2, -2],
  surprised: [0, 1.15, -8, .3, -8, 0],
  concerned: [2, .92, 3, .2, 5, 0],
  sad: [-2, .8, 4, .15, 8, 1],
};

// A spectral estimate, not a phoneme aligner. Silence always closes the mouth.
export function estimateViseme(samples, spectrum, sampleRate, fftSize) {
  let energy = 0;
  for (const n of samples) energy += n * n;
  const rms = Math.sqrt(energy / samples.length);
  if (rms < 0.012) return 'sil';
  const band = (lo, hi) => {
    let sum = 0, count = 0;
    for (let i = Math.ceil(lo * fftSize / sampleRate); i < Math.min(spectrum.length, hi * fftSize / sampleRate); i++) {
      sum += 10 ** (spectrum[i] / 10); count++;
    }
    return sum / Math.max(1, count);
  };
  const low = band(150, 650), mid = band(650, 1500), high = band(1500, 3500), hiss = band(3500, 7500);
  if (hiss > mid * 1.5 && hiss > low * 0.5) return 'FF';
  if (high > mid * 1.25) return 'E';
  if (low > mid * 3) return 'O';
  return rms > 0.045 ? 'aa' : 'PP';
}

export function rigMarkup() {
  return `<svg viewBox="0 0 500 720" role="img" aria-label="Luna: animierte Ragdoll-Catgirl-Vorschau" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hair" x2=".2" y2="1"><stop stop-color="#fffaf1"/><stop offset=".65" stop-color="#f1e8de"/><stop offset="1" stop-color="#9f969c"/></linearGradient>
    <radialGradient id="skin"><stop stop-color="#fff1e4"/><stop offset="1" stop-color="#f4cbb9"/></radialGradient>
    <linearGradient id="iris" x2="0" y2="1"><stop stop-color="#101f59"/><stop offset=".55" stop-color="#235fa6"/><stop offset="1" stop-color="#83cced"/></linearGradient>
    <linearGradient id="knit" x2="1" y2="1"><stop stop-color="#fff6e6"/><stop offset="1" stop-color="#d9c9b9"/></linearGradient>
    <pattern id="stitch" width="22" height="25" patternUnits="userSpaceOnUse"><path d="M7 2Q18 12 8 24M15 2Q4 12 14 24" fill="none" stroke="#b9a796" stroke-width="1.3" opacity=".24"/></pattern>
    <radialGradient id="blush"><stop stop-color="#ef8e9e" stop-opacity=".65"/><stop offset="1" stop-color="#ef8e9e" stop-opacity="0"/></radialGradient>
  </defs>
  <g data-body>
    <path d="M145 270Q99 301 114 435L149 459 350 455Q397 355 354 270Z" fill="url(#hair)" stroke="#9d9294" stroke-width="2"/>
    <g data-outfit="cream-sweater">
      <path d="M192 356Q137 352 120 399L77 641Q88 661 119 655L157 510 147 682Q250 710 353 682L343 510 381 655Q409 662 423 641L382 399Q361 353 308 356Z" fill="url(#knit)" stroke="#b7a596" stroke-width="2"/>
      <path d="M192 356Q137 352 120 399L77 641Q88 661 119 655L157 510 147 682Q250 710 353 682L343 510 381 655Q409 662 423 641L382 399Q361 353 308 356Z" fill="url(#stitch)"/>
      <path d="M184 349Q250 369 316 349L319 398Q250 421 181 398Z" fill="url(#knit)" stroke="#b7a596" stroke-width="2"/>
      <path d="M192 359V395M207 363V400M222 367V403M237 368V406M252 368V406M267 368V405M282 365V403M297 361V398M309 357V394" stroke="#b8a898" opacity=".6" stroke-width="2"/>
      <path d="M154 666Q250 686 347 666M153 678Q250 699 347 678" fill="none" stroke="#b7a596" opacity=".6" stroke-width="2"/>
    </g>
    <g data-head>
      <g data-ear-left><path d="M132 161Q105 92 117 49Q170 66 199 112Z" fill="url(#hair)" stroke="#8d8290" stroke-width="3"/><path d="M140 137L130 74Q165 90 179 116Z" fill="#d7a8af"/><path d="M119 52L139 87 151 82 152 100 173 94 171 113 192 113Q155 130 132 161Z" fill="#857982" opacity=".7"/></g>
      <g data-ear-right><path d="M368 161Q395 92 383 49Q330 66 301 112Z" fill="url(#hair)" stroke="#8d8290" stroke-width="3"/><path d="M360 137L370 74Q335 90 321 116Z" fill="#d7a8af"/><path d="M381 52L361 87 349 82 348 100 327 94 329 113 308 113Q345 130 368 161Z" fill="#857982" opacity=".7"/></g>
      <path d="M137 157Q165 92 250 103Q339 91 368 164L386 301Q403 335 377 363L350 347 352 385 320 364 302 381 195 380 178 361 148 386 149 347 119 366Q97 333 118 301Z" fill="url(#hair)" stroke="#a79ba0" stroke-width="2"/>
      <path d="M144 207Q144 143 250 139Q356 143 356 207L348 272Q327 324 250 350Q173 324 152 272Z" fill="url(#skin)" stroke="#c59f95" stroke-width="1.6"/>
      <g data-brows fill="none" stroke="#9b807d" stroke-width="4" stroke-linecap="round"><path data-brow-left d="M167 207Q191 193 218 204"/><path data-brow-right d="M282 204Q309 193 333 207"/></g>
      <g data-eye-left style="transform-origin:193px 243px">
        <path d="M161 235Q185 210 220 232Q221 264 196 270Q169 270 161 235Z" fill="#fffdfa"/>
        <ellipse cx="194" cy="244" rx="20" ry="26" fill="url(#iris)"/><ellipse cx="195" cy="242" rx="8" ry="17" fill="#112348"/><ellipse cx="186" cy="228" rx="7" ry="9" fill="white"/><circle cx="204" cy="256" r="4" fill="#ddf8ff"/>
        <path d="M157 228L164 235Q188 214 220 232M162 230L157 220" fill="none" stroke="#4b3845" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g data-eye-right style="transform-origin:307px 243px">
        <path d="M280 232Q315 210 339 235Q331 270 304 270Q279 264 280 232Z" fill="#fffdfa"/>
        <ellipse cx="306" cy="244" rx="20" ry="26" fill="url(#iris)"/><ellipse cx="305" cy="242" rx="8" ry="17" fill="#112348"/><ellipse cx="298" cy="228" rx="7" ry="9" fill="white"/><circle cx="317" cy="256" r="4" fill="#ddf8ff"/>
        <path d="M280 232Q312 214 336 235L343 228M338 230L343 220" fill="none" stroke="#4b3845" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g data-blush opacity=".3"><ellipse cx="172" cy="277" rx="30" ry="18" fill="url(#blush)"/><ellipse cx="328" cy="277" rx="30" ry="18" fill="url(#blush)"/></g>
      <path d="M246 273Q250 277 254 273" fill="none" stroke="#d4a094" stroke-width="2"/>
      <path data-mouth d="${MOUTHS.sil}" fill="#713c4d" stroke="#a85d67" stroke-width="1.4"/>
      <path d="M133 220Q111 140 187 111Q257 76 313 121Q382 135 365 231L337 201 346 234Q321 210 307 165Q297 197 270 218L281 167Q251 209 212 219L229 174Q192 216 153 228L165 195Z" fill="url(#hair)" stroke="#b2a4a4" stroke-width="2"/>
      <path d="M146 198Q170 133 220 125M176 202Q204 160 235 136M242 188Q272 134 268 117M293 142Q320 147 336 188M146 242Q124 305 151 338M354 242Q376 305 349 338" fill="none" stroke="#fffdf7" opacity=".85" stroke-width="4" stroke-linecap="round"/>
      <path d="M237 106Q228 76 258 71Q244 84 249 103" fill="url(#hair)" stroke="#b2a4a4" stroke-width="1.5"/>
    </g>
  </g></svg>`;
}

export class LunaRig {
  constructor(host, session) {
    this.host = host; this.session = session;
    host.innerHTML = rigMarkup();
    this.head = host.querySelector('[data-head]');
    this.body = host.querySelector('[data-body]');
    this.mouth = host.querySelector('[data-mouth]');
    this.eyes = [...host.querySelectorAll('[data-eye-left], [data-eye-right]')];
    this.blush = host.querySelector('[data-blush]');
    this.brows = host.querySelector('[data-brows]');
    this.ears = [...host.querySelectorAll('[data-ear-left], [data-ear-right]')];
    this.pose = [...POSES.neutral];
    this.samples = new Float32Array(2048); this.spectrum = new Float32Array(1024);
    this.lastShape = 'sil'; this.lastChange = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.tick = this.tick.bind(this); this.frame = requestAnimationFrame(this.tick);
  }
  tick(now) {
    const s = this.session, expression = s.expression?.name || 'neutral';
    const intensity = Math.max(0, Math.min(1, s.expression?.intensity || 0));
    const time = now / 1000;
    const target = POSES[expression] || POSES.neutral;
    const blend = this.reduced ? 1 : 1 - Math.exp(-Math.min(100, now - (this.lastFrame || now)) / 180);
    this.lastFrame = now;
    this.pose = this.pose.map((value, i) => {
      const wanted = POSES.neutral[i] + (target[i] - POSES.neutral[i]) * intensity;
      return value + (wanted - value) * blend;
    });
    let shape = 'sil';
    if (s.phase === 'speaking' && s.analyser && s.audioContext?.state === 'running') {
      s.analyser.getFloatTimeDomainData(this.samples);
      s.analyser.getFloatFrequencyData(this.spectrum);
      shape = estimateViseme(this.samples, this.spectrum, s.audioContext.sampleRate, 2048);
      s.playbackTime = s.audioContext.currentTime - s.playbackStarted;
    }
    if (shape === 'sil' || now - this.lastChange > 85) {
      this.lastShape = shape; this.lastChange = now;
      const restingMouth = expression === 'sad' || expression === 'concerned'
        ? 'M240 301Q250 294 260 301Q250 297 240 301Z'
        : expression === 'surprised' ? MOUTHS.O : MOUTHS.sil;
      this.mouth.setAttribute('d', shape === 'sil' && s.phase !== 'speaking' ? restingMouth : MOUTHS[shape]);
    }
    const blink = !this.reduced && time % 4.3 < .14;
    const eyeScale = blink ? .08 : this.pose[1];
    this.eyes.forEach(eye => eye.style.transform = `translateX(${this.pose[5]}px) scaleY(${eyeScale})`);
    this.blush.setAttribute('opacity', this.pose[3]);
    const tilt = this.pose[0];
    this.head.setAttribute('transform', `rotate(${tilt + (this.reduced ? 0 : Math.sin(time * .9) * 1.1)} 250 350)`);
    this.body.setAttribute('transform', `translate(0 ${this.reduced ? 0 : Math.sin(time * 1.7) * 1.1})`);
    this.brows.setAttribute('transform', `translate(0 ${this.pose[2]})`);
    this.ears[0].setAttribute('transform', `rotate(${-this.pose[4]} 165 150)`);
    this.ears[1].setAttribute('transform', `rotate(${this.pose[4]} 335 150)`);
    s.viseme = this.lastShape;
    this.frame = requestAnimationFrame(this.tick);
  }
  destroy() { cancelAnimationFrame(this.frame); }
}
