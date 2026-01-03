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

        // Fade in (no click) — use linear ramp from 0 to avoid exponential edge cases
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(maxGain, now + rampIn);

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

        // Fade out BEFORE stopping — schedule a smooth linear ramp to 0
        try {
            this.gainNode.gain.cancelScheduledValues(now);
        } catch {}

        // Ensure the AudioParam has the current value as the starting point
        const current = this.gainNode.gain.value ?? 0;
        this.gainNode.gain.setValueAtTime(current, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + rampOut);

        const stoppingOsc = this.oscillator;
        if (stoppingOsc) {
            stoppingOsc.stop(now + rampOut + 0.02);
            stoppingOsc.onended = () => {
                // Only perform immediate cleanup if this oscillator is still the active one
                if (this.oscillator === stoppingOsc) {
                    this.stopImmediate();
                }
            };
        }
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
