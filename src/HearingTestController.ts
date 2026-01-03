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
    constructor({
        frequencies,
        rampDuration = 2,
        maxGain = 0.7,
        stepTimeout = 3500,
        mode = "fixed",
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
        console.log("Unhandled event.");
    }

    testFinishedCustomHandler() {
        console.log("Test finished.");
    }

    // Interpolate results (log-frequency / linear dB interpolation)
    interpolateResults(targetFreqs: number[]) {
        // build map of measured freq -> dB (from gain)
        const measured = this.results
            .filter((r) => r.gain !== null)
            .map((r) => ({
                f: r.frequency,
                db: 20 * Math.log10(r.gain as number),
            }))
            .sort((a, b) => a.f - b.f);

        if (measured.length === 0) return [];

        const interp = (f: number) => {
            if (measured.some((m) => m.f === f)) {
                return measured.find((m) => m.f === f)!.db;
            }
            // find neighbours in log space
            const logF = Math.log(f);
            let left = measured[0];
            let right = measured[measured.length - 1];
            for (let i = 0; i < measured.length - 1; i++) {
                const a = measured[i];
                const b = measured[i + 1];
                if (Math.log(a.f) <= logF && logF <= Math.log(b.f)) {
                    left = a;
                    right = b;
                    break;
                }
            }
            const t =
                (Math.log(f) - Math.log(left.f)) /
                (Math.log(right.f) - Math.log(left.f));
            return left.db + t * (right.db - left.db);
        };

        return targetFreqs.map((f) => ({ frequency: f, db: interp(f) }));
    }
}
