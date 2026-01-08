import { ToneGenerator } from "./toneGenerator";
import type { Ear, HearingResult, HearingTestControllerProps } from "./types";

export class HearingTestController {
    private generator = new ToneGenerator();
    private frequencies!: number[];
    private rampDuration: number;
    private maxGain: number;
    private stepTimeout: number;
    private rampPower: number;
    private index = 0;
    private timeoutId: number | null = null;
    ear: Ear = "left";
    results: HearingResult[] = [];
    testEnded = false;

    constructor({
        rampDuration = 2,
        maxGain = 0.7,
        stepTimeout = 3500,
        rampPower = 3.0,
    }: HearingTestControllerProps) {
        this.rampDuration = rampDuration;
        this.maxGain = maxGain;
        this.stepTimeout = stepTimeout;
        this.rampPower = rampPower;
    }

    setFrequencies(frequencies: number[]) {
        this.frequencies = frequencies;
    }

    async start() {
        console.log(`Starting test for ear: ${this.ear}`);
        this.testEnded = false; 
        this.ear = "left";       
        await this.generator.init();
        this.index = 0;
        this.results = [];
        this.next();
    }

    private finish() {
        if (this.ear === "left"){
            this.ear = "right";
            this.index = 0;
            console.log("Switching to right ear.");
            this.next();
            return;
        }
        this.testFinishedCustomHandler();
        this.testEnded = true;
    }

    isFinished() {
        return this.testEnded;
    }

    private next() {
        if (this.index >= this.frequencies.length) {
            this.finish();
            return;
        }

        const freq = this.frequencies[this.index];

        this.generator.start({
            frequency: freq,
            rampIn: this.rampDuration,
            maxGain: this.maxGain,
            ear: this.ear,
            rampPower: this.rampPower,
        });

        this.nextEventCustomHandler();

        this.timeoutId = window.setTimeout(() => {
            this.record();
        }, this.stepTimeout);
    }

    heard() {
        this.record();
    }

    private record() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        const freq = this.frequencies[this.index];

        this.results.push({
            frequency: freq,
            ear: this.ear,
            thresholdDb: 20 * Math.log10(this.generator.getCurrentGain()),
        });

        this.generator.stop();
        this.index++;
        this.next();
    }

    getCurrentFrequency() {
        return this.frequencies[this.index] ?? null;
    }

    getFrequencyList() {
        return this.frequencies;
    }

    nextEventCustomHandler() {
        console.error("Unhandled event.");
    }

    testFinishedCustomHandler() {
        console.error("Unhandled event.");
    }

    getTotalSteps() {
        return this.frequencies.length;
    }

    getIndex() {
        return this.index;
    }
}
