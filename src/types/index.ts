export type Ear = "left" | "right";

export type HearingTestControllerProps = {
    frequencies?: number[];
    rampDuration?: number;
    maxGain?: number, 
    stepTimeout?: number; 
    mode?: "fixed" | "staircase";
    rampPower?: number;
}

export type MeasuredPoint = { frequency: number; gain: number };

export type HearingResult = {
  frequency: number;
  ear: Ear;
  thresholdDb: number;
};