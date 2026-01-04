import { NORMAL_THRESHOLD_DB, type FrequencyHz } from "./dbhl";
import type { HearingResult } from "./types";

/**
 * Convert threshold (dB) to relative Hearing Level.
 *
 * Lower threshold = better hearing sensitivity = lower value on chart.
 * Higher threshold = worse hearing sensitivity = higher value on chart.
 *
 * @param thresholdDb - measured threshold in dB (more negative = better hearing)
 * @param frequency - test frequency in Hz
 */
function thresholdDbToHL(
  thresholdDb: number,
  frequency: FrequencyHz,
  clamp = false
): number {
  const ref = NORMAL_THRESHOLD_DB[frequency];

  if (ref === undefined) {
    throw new Error(`No HL reference for frequency ${frequency} Hz`);
  }

  // Calculate relative hearing level
  // If thresholdDb is more negative than ref, HL will be negative (better than reference)
  // If thresholdDb is less negative than ref, HL will be positive (worse than reference)
  let hl = thresholdDb - ref;

  if (clamp) {
    hl = Math.max(-20, Math.min(60, hl));
  }

  return Math.round(hl);
}

export function resultsToHL(
  results: HearingResult[]
) {
  return results.map(r => ({
    ...r,
    dBHL: thresholdDbToHL(r.thresholdDb, r.frequency),
  }));
}
