import type { Ear } from "./types";

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export class ToneGenerator {
    audioCtx: AudioContext | null;
    oscillator: OscillatorNode | null;
    gainNode: GainNode | null;
    merger: ChannelMergerNode | null;
    constructor() {
        this.audioCtx = null;
        this.oscillator = null;
        this.gainNode = null;
        this.merger = null;
    }

    async init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext ||
                window.webkitAudioContext)();
        }
        if (this.audioCtx.state === "suspended") {
            await this.audioCtx.resume();
        }
    }

    start({
        frequency,
        rampIn = 3.0,
        maxGain = 0.7,
        ear = "left", // 'left' | 'right'
    }:{
        frequency: number;
        rampIn?: number;
        maxGain?: number;
        ear?: Ear;
    }) {
        this.stopImmediate();

        const ctx = this.audioCtx;
        if(!ctx){
            throw Error('Audio Context is not available.')
        }
        const now = ctx.currentTime;

        this.oscillator = ctx.createOscillator();
        this.gainNode = ctx.createGain();
        this.merger = ctx.createChannelMerger(2);

        this.oscillator.type = "sine";
        this.oscillator.frequency.setValueAtTime(frequency, now);

        // Fade in (no click)
        this.gainNode.gain.setValueAtTime(0.0001, now);
        this.gainNode.gain.exponentialRampToValueAtTime(maxGain, now + rampIn);

        this.oscillator.connect(this.gainNode);

        // Route to only one channel
        if (ear === "left") {
            this.gainNode.connect(this.merger, 0, 0);
        } else {
            this.gainNode.connect(this.merger, 0, 1);
        }

        this.merger.connect(ctx.destination);
        this.oscillator.start(now);
    }

    stop(rampOut = 0.05) {
        if (!this.oscillator) return;

        const ctx = this.audioCtx;
        if(!ctx){
            throw Error('Audio Context is not available.')
        }
        const now = ctx.currentTime;

        if(!this.gainNode){
            throw Error('Audio Gain Node is not available.')
        }

        // Fade out BEFORE stopping
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(
            Math.max(this.gainNode.gain.value, 0.0001),
            now
        );
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + rampOut);

        this.oscillator.stop(now + rampOut + 0.01);
        this.oscillator.onended = () => this.stopImmediate();
    }

    stopImmediate() {
        try {
            this.oscillator?.disconnect();
            this.gainNode?.disconnect();
            this.merger?.disconnect();
        } catch {}

        this.oscillator = null;
        this.gainNode = null;
        this.merger = null;
    }

    getCurrentGain() {
        return this.gainNode?.gain.value ?? 0;
    }
}
