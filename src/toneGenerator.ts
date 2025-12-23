declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export class ToneGenerator {
  audioCtx: AudioContext| null;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
  }

  async init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  start({ frequency, rampDuration, maxGain }:{frequency:number, rampDuration:number, maxGain:number}) {
    this.stop();

    const ctx = this.audioCtx;
    if(!ctx){
        throw Error('Audio Context is not available.');
    }
    const now = ctx.currentTime;

    this.oscillator = ctx.createOscillator();
    this.gainNode = ctx.createGain();

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, now);

    this.gainNode.gain.setValueAtTime(0.0001, now);
    this.gainNode.gain.exponentialRampToValueAtTime(
      maxGain,
      now + rampDuration
    );

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);

    this.oscillator.start();
  }

  stop() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.gainNode?.disconnect();
      this.oscillator = null;
      this.gainNode = null;
    }
  }

  getCurrentGain() {
    return this.gainNode?.gain.value ?? 0;
  }
}
