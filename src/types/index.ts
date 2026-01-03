export type Ear = "left" | "right";

export type HearingTestControllerProps = {
    frequencies?: number[];
    rampDuration?: number;
    maxGain?: number, 
    stepTimeout?: number; 
    mode?: "fixed" | "staircase";
}