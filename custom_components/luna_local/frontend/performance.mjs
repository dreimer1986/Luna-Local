// Bounded performance controls driven by the existing Assist/TTS session.
// The spectral fallback is an approximation; timed visemes take precedence.
import {estimateViseme} from './rig.mjs?v=0.4.0b5';

const clamp = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));
const POSES = {
  neutral: [0, 0, 1, 0], joyful: [2, .45, .9, .4], amused: [-2, .6, .8, .5],
  shy: [-4, -.15, .9, 1], curious: [4, .25, 1, .15], thoughtful: [-3, -.1, .92, .1],
  surprised: [0, .7, 1, .2], concerned: [2, -.45, .92, .1], sad: [-2, -.65, .85, 0],
  laughing: [2, .7, .5, .6], angry: [-2, -.7, .85, .25],
};
const SHAPES = {
  sil: {open: 0, form: 0}, PP: {open: .12, form: 0}, aa: {open: .85, form: .25},
  E: {open: .45, form: 1}, O: {open: .65, form: -1}, FF: {open: .18, form: .65},
  A: {open: .85, form: .25}, I: {open: .35, form: 1}, U: {open: .35, form: -1},
};

export class LunaPerformance {
  constructor() {
    this.samples = new Float32Array(2048);
    this.spectrum = new Float32Array(1024);
    this.generation = -1;
    this.mouth = 0;
    this.form = 0;
    this.pose = [0, 0, 1, 0];
  }
  sample(session, time, dt, reducedMotion = false) {
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .05);
    const remote = session.phase === 'idle' ? session.roomPlayback?.sample() : null;
    const generation = remote ? `room:${remote.id}` : session.generation;
    const newTurn = this.generation !== generation;
    if (newTurn) {
      this.generation = generation;
      this.mouth = this.form = 0;
    }
    const expression = POSES[session.expression?.name] || POSES.neutral;
    const intensity = clamp(Number.isFinite(session.expression?.intensity) ? session.expression.intensity : 0);
    const blend = 1 - Math.exp(-dt / .22);
    const target = expression.map((n, i) => POSES.neutral[i] + (n - POSES.neutral[i]) * intensity);
    this.pose = this.pose.map((n, i) => n + (target[i] - n) * blend);

    let shape = 'sil', openness = 0;
    const speaking = remote?.speaking || (session.phase === 'speaking' && session.source && session.audioContext?.state === 'running');
    if (speaking) {
      const clock = remote ? 0 : Math.max(0, session.audioContext.currentTime - session.playbackStarted);
      session.playbackTime = clock;
      // Cues must explicitly belong to this turn; late analysis cannot animate a newer reply.
      const cues = session.mouthCues?.generation === session.generation ? session.mouthCues.cues : null;
      if (remote) {
        shape = remote.mouth > .01 ? 'aa' : 'sil'; openness = remote.mouth;
      } else if (cues) {
        const cue = cues.find(c => clock >= c.start && clock < c.end);
        shape = cue?.shape in SHAPES ? cue.shape : 'sil';
        openness = SHAPES[shape].open;
      } else if (session.analyser) {
        if (this.samples.length !== session.analyser.fftSize) {
          this.samples = new Float32Array(session.analyser.fftSize);
          this.spectrum = new Float32Array(session.analyser.frequencyBinCount);
        }
        session.analyser.getFloatTimeDomainData(this.samples);
        session.analyser.getFloatFrequencyData(this.spectrum);
        shape = estimateViseme(this.samples, this.spectrum, session.audioContext.sampleRate, this.samples.length);
        let energy = 0;
        for (const value of this.samples) energy += value * value;
        const rms = Math.sqrt(energy / this.samples.length);
        openness = shape === 'sil' ? 0 : SHAPES[shape].open * clamp((rms - .008) * 15, .12, 1);
      }
      const ease = 1 - Math.exp(-dt / (openness > this.mouth ? .025 : .055));
      this.mouth += (openness - this.mouth) * ease;
      this.form += (SHAPES[shape].form - this.form) * (1 - Math.exp(-dt / .045));
    } else {
      // Interruptions, silence between turns and suspended playback close immediately.
      this.mouth = this.form = 0;
      session.playbackTime = 0;
    }
    session.viseme = shape;
    const blinkPhase = ((time % 5.1) + 5.1) % 5.1;
    const blink = blinkPhase > 4.8 ? Math.sin(Math.PI * (blinkPhase - 4.8) / .3) ** 2 : 0;
    const idle = reducedMotion ? 0 : 1;
    const eyes = clamp(this.pose[2] * (1 - blink));
    const parameters = {
      ParamAngleX: idle * Math.sin(time * .43) * 2.5,
      ParamAngleY: idle * Math.sin(time * .67) * 1.5,
      ParamAngleZ: this.pose[0] + idle * Math.sin(time * .37) * .8,
      ParamBodyAngleX: idle * Math.sin(time * .31) * .8,
      ParamBodyAngleY: 0, ParamBodyAngleZ: idle * Math.sin(time * .37) * .35,
      ParamBreath: reducedMotion ? 0 : .5 + .5 * Math.sin(time * 1.35),
      ParamEyeLOpen: eyes, ParamEyeROpen: eyes,
      ParamEyeBallX: idle * Math.sin(time * .29) * .12,
      ParamEyeBallY: session.phase === 'thinking' ? .2 : 0,
      ParamBrowLY: this.pose[1], ParamBrowRY: this.pose[1],
      ParamMouthOpenY: clamp(this.mouth), ParamMouthForm: clamp(this.form, -1, 1),
      ParamLunaBlush: this.pose[3],
      ParamLunaJoy: ['joyful', 'amused'].includes(session.expression?.name) ? intensity : 0,
      ParamLunaLaugh: session.expression?.name === 'laughing' ? intensity : 0,
      ParamLunaAnger: session.expression?.name === 'angry' ? intensity : 0,
      ParamLunaShy: session.expression?.name === 'shy' ? intensity : 0,
      ParamLunaSad: session.expression?.name === 'sad' ? intensity : 0,
      ParamLunaSurprise: session.expression?.name === 'surprised' ? intensity : 0,
      ParamLunaConcern: session.expression?.name === 'concerned' ? intensity : 0,
    };
    const vowels = {A: ['aa', 'A'], I: ['I'], U: ['U'], E: ['E', 'FF'], O: ['O']};
    for (const [vowel, shapes] of Object.entries(vowels)) {
      parameters[`ParamLunaViseme${vowel}`] = speaking && shapes.includes(shape) ? clamp(this.mouth) : 0;
    }
    return {parameters, expression: session.expression?.name || 'neutral', reducedMotion,
      group: session.phase === 'speaking' ? 'Speaking' : session.phase === 'listening' ? 'Listening' :
        session.phase === 'thinking' || session.phase === 'preparing' ? 'Thinking' : 'Idle'};
  }
}
