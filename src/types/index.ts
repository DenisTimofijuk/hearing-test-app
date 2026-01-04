export type Ear = "left" | "right";

export type HearingTestControllerProps = {
    rampDuration?: number;
    maxGain?: number, 
    stepTimeout?: number;
    rampPower?: number;
}

export type MeasuredPoint = { frequency: number; gain: number };

export type HearingResult = {
  frequency: number;
  ear: Ear;
  thresholdDb: number;
};