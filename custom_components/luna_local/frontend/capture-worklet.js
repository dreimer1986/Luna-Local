// Raw signed 16-bit mono PCM at the AudioContext's actual sample rate.
class LunaCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Int16Array(2048);
    this.offset = 0;
    this.finished = false;
    this.port.onmessage = event => {
      if (event.data !== 'finish' || this.finished) return;
      this.finished = true;
      if (this.offset) {
        const tail = this.samples.slice(0, this.offset);
        this.port.postMessage(tail, [tail.buffer]);
      }
      this.port.postMessage('finished');
    };
  }
  process(inputs) {
    if (this.finished) return false;
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (const sample of input) {
      const value = Math.max(-1, Math.min(1, sample));
      this.samples[this.offset++] = value < 0 ? value * 32768 : value * 32767;
      if (this.offset === this.samples.length) {
        this.port.postMessage(this.samples, [this.samples.buffer]);
        this.samples = new Int16Array(2048);
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('luna-capture', LunaCapture);
