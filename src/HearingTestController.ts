import { ToneGenerator } from "./toneGenerator";
import { DEFAULT_TEST_FREQUENCIES } from "./frequencies";
import Staircase from "./staircase";
import type { Ear, HearingTestControllerProps } from "./types";

export class HearingTestController {
    generator: ToneGenerator;
    frequencies: number[];
    rampDuration: number;
    maxGain: number;
    stepTimeout: number;
    index: number;
    results: {
        frequency: number;
        ear: Ear;
        heard: boolean;
        gain: number | null;
    }[];
    timeoutId: number | null;
    ear: Ear;
    mode: "fixed" | "staircase";
    activeStaircase: Staircase | null;
    rampPower: number;
    constructor({
        frequencies,
        rampDuration = 2,
        maxGain = 0.7,
        stepTimeout = 3500,
        mode = "fixed",
        rampPower = 3.0,
    }: HearingTestControllerProps) {
        this.generator = new ToneGenerator();
        this.frequencies =
            frequencies && frequencies.length > 0
                ? frequencies
                : DEFAULT_TEST_FREQUENCIES;

        this.rampDuration = rampDuration;
        this.maxGain = maxGain;
        this.stepTimeout = stepTimeout;

        this.mode = mode;
        this.activeStaircase = null;

        this.index = 0;
        this.results = [];
        this.timeoutId = null;
        this.ear = "left";
        this.rampPower = rampPower;
    }

    setEar(ear: Ear) {
        this.ear = ear;
    }

    async start() {
        await this.generator.init();
        this.index = 0;
        this.results = [];
        this.activeStaircase = null;
        this.next();
    }

    isFinished() {
        return this.index >= this.frequencies.length;
    }

    next() {
        if (this.isFinished()) {
            this.finish();
            return;
        }

        const freq = this.frequencies[this.index];

        let trialGain = this.maxGain;
        if (this.mode === "staircase") {
            if (!this.activeStaircase) {
                this.activeStaircase = new Staircase();
            }
            trialGain = this.activeStaircase.getCurrentGain();
        }

        this.generator.start({
            frequency: freq,
            rampIn: this.rampDuration,
            maxGain: trialGain,
            ear: this.ear,
            rampPower: this.rampPower,
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

        const freq = this.frequencies[this.index];

        if (this.mode === "staircase") {
            if (!this.activeStaircase) this.activeStaircase = new Staircase();

            const { finished } = this.activeStaircase.recordResponse(heard);

            if (finished) {
                const estGain = this.activeStaircase.getCurrentGain();

                this.results.push({
                    frequency: freq,
                    ear: this.ear,
                    heard,
                    gain: estGain,
                });

                this.generator.stop();
                this.activeStaircase = null;
                this.index++;
                this.next();
                return;
            } else {
                // not finished, record interim trial (but do not advance frequency)
                this.results.push({
                    frequency: freq,
                    ear: this.ear,
                    heard,
                    gain: heard ? this.generator.getCurrentGain() : null,
                });

                this.generator.stop();
                // replay same frequency with updated gain
                this.next();
                return;
            }
        }

        // Fixed-mode (single trial per frequency)
        this.results.push({
            frequency: freq,
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
        this.testFinishedCustomHandler();
    }

    getCurrentFrequency() {
        return this.frequencies[this.index] ?? null;
    }

    nextEventCustomHandler() {
        console.error("Unhandled event.");
    }

    testFinishedCustomHandler() {
        console.error("Unhandled event.");
    }
}
