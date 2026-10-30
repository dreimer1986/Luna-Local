// Raw signed 16-bit mono PCM at the AudioContext's actual sample rate.
class LunaCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Int16Array(2048);
    this.offset = 0;
    this.finished = false;
    this.windowSamples = Math.round(sampleRate * .02);
    this.energy = this.windowCount = this.voicedSamples = this.quietSamples = 0;
    this.heardSpeech = false;
    this.port.onmessage = event => {
      if (event.data !== 'finish' || this.finished) return;
      this.finish();
    };
  }
  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.offset) {
      const tail = this.samples.slice(0, this.offset);
      this.port.postMessage(tail, [tail.buffer]);
      this.offset = 0;
    }
    this.port.postMessage('finished');
  }
  process(inputs) {
    if (this.finished) return false;
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (const sample of input) {
      const value = Math.max(-1, Math.min(1, sample));
      this.energy += value * value;
      this.windowCount++;
      this.samples[this.offset++] = value < 0 ? value * 32768 : value * 32767;
      if (this.offset === this.samples.length) {
        this.port.postMessage(this.samples, [this.samples.buffer]);
        this.samples = new Int16Array(2048);
        this.offset = 0;
      }
      if (this.windowCount >= this.windowSamples) {
        // Conservative level gate after browser noise suppression. Noise can
        // prolong capture; a short thinking pause must never terminate it.
        const audible = Math.sqrt(this.energy / this.windowCount) >= .006;
        if (audible) {
          this.voicedSamples += this.windowCount;
          this.quietSamples = 0;
          if (this.voicedSamples >= sampleRate * .2) this.heardSpeech = true;
        } else {
          this.voicedSamples = 0;
          if (this.heardSpeech) this.quietSamples += this.windowCount;
        }
        this.energy = this.windowCount = 0;
        if (this.heardSpeech && this.quietSamples >= sampleRate * 3) {
          this.finish();
          return false;
        }
      }
    }
    return true;
  }
}
registerProcessor('luna-capture', LunaCapture);
