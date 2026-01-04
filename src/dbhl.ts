// dbhl.ts

export type FrequencyHz = number;

/**
 * Reference thresholds calibrated for slow-ramp hearing test.
 * These values represent expected thresholds when using:
 * - rampPower: 10.0
 * - rampDuration: 5.0
 * - maxGain: 0.7
 *
 * Adjust these based on actual measurements from known-good hearing.
 */
export const NORMAL_THRESHOLD_DB: Record<FrequencyHz, number> = {
  125: -30,
  250: -30,
  500: -34,
  1000: -34,
  2000: -34,
  4000: -33,
  8000: -31,
};
