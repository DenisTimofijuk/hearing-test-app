import { ToneGenerator } from "./toneGenerator";
import { generateLogFrequencies } from "./frequencies";
import type { Ear } from "./types";

export class HearingTestController {
    generator: ToneGenerator;
    frequencies: number[];
    rampDuration: number;
    maxGain: number;
    stepTimeout: number;
    index: number;
    results: { frequency: number; ear: Ear; heard: boolean; gain: number | null }[];
    timeoutId: number | null;
    ear: Ear;
    constructor({
        minHz = 20,
        maxHz = 20000,
        stepsPerOctave = 6,
        rampDuration = 4,
        maxGain = 0.7,
        stepTimeout = 7000,
    }) {
        this.generator = new ToneGenerator();
        this.frequencies = generateLogFrequencies({
            minHz,
            maxHz,
            stepsPerOctave,
        });

        this.rampDuration = rampDuration;
        this.maxGain = maxGain;
        this.stepTimeout = stepTimeout;

        this.index = 0;
        this.results = [];
        this.timeoutId = null;
        this.ear = "left";
    }

    async start() {
        await this.generator.init();
        this.index = 0;
        this.results = [];
        this.next();
    }

    isFinished(){
        return this.index >= this.frequencies.length;
    }

    next() {
        if (this.isFinished()) {
            this.finish();
            return;
        }

        const freq = this.frequencies[this.index];

        this.generator.start({
            frequency: freq,
            rampIn: this.rampDuration,
            maxGain: this.maxGain,
            ear: this.ear,
        });

        this.nextEventCustomHandler();

        this.timeoutId = setTimeout(() => {
            this.record(false);
        }, this.stepTimeout);
    }

    heard() {
        this.record(true);
    }

    record(heard: boolean) {
        !!this.timeoutId && clearTimeout(this.timeoutId);

        this.results.push({
            frequency: this.frequencies[this.index],
            ear: this.ear,
            heard,
            gain: heard ? this.generator.getCurrentGain() : null,
        });

        this.generator.stop();
        this.index++;
        this.next();
    }

    finish() {
        console.log("Test complete", this.results);
    }

    getCurrentFrequence(){
        return this.frequencies[this.index];
    }

    nextEventCustomHandler(){
        console.log('Unhandled event.');
    }
}
