import { ToneGenerator } from "./toneGenerator";
import { generateLogFrequencies } from "./frequencies";

export class HearingTestController {
    generator: ToneGenerator;
    frequencies: number[];
    rampDuration: number;
    maxGain: number;
    stepTimeout: number;
    index: number;
    results: { frequency: number; heard: boolean; gain: number | null }[];
    timeoutId: number | null;
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
    }

    async start() {
        await this.generator.init();
        this.index = 0;
        this.results = [];
        this.next();
    }

    next() {
        if (this.index >= this.frequencies.length) {
            this.finish();
            return;
        }

        const freq = this.frequencies[this.index];

        this.generator.start({
            frequency: freq,
            rampDuration: this.rampDuration,
            maxGain: this.maxGain,
        });

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
}
