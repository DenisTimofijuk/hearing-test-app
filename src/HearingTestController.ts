import { ToneGenerator } from "./toneGenerator";
import { DEFAULT_TEST_FREQUENCIES } from "./frequencies";
import type { Ear, HearingResult, HearingTestControllerProps } from "./types";

export class HearingTestController {
    private generator = new ToneGenerator();
    private frequencies: number[];
    private rampDuration: number;
    private maxGain: number;
    private stepTimeout: number;
    private rampPower: number;
    private index = 0;
    private timeoutId: number | null = null;

    ear: Ear = "left";
    mode: "fixed" | "staircase";
    results: HearingResult[] = [];

    constructor({
        frequencies,
        rampDuration = 2,
        maxGain = 0.7,
        stepTimeout = 3500,
        mode = "staircase",
        rampPower = 3.0,
    }: HearingTestControllerProps) {
        this.frequencies =
            frequencies && frequencies.length > 0
                ? frequencies
                : DEFAULT_TEST_FREQUENCIES;

        this.rampDuration = rampDuration;
        this.maxGain = maxGain;
        this.stepTimeout = stepTimeout;
        this.mode = mode;
        this.rampPower = rampPower;
    }

    setEar(ear: Ear) {
        this.ear = ear;
    }

    async start() {
        await this.generator.init();
        this.index = 0;
        this.results = [];
        this.next();
    }

    isFinished() {
        return this.index >= this.frequencies.length;
    }

    private next() {
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

    private finish() {
        this.testFinishedCustomHandler();
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
