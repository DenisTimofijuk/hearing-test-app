export function generateLogFrequencies({
  minHz = 20,
  maxHz = 20000,
  stepsPerOctave = 12 // 12 = semitone resolution, 6 = coarser
}) {
  const frequencies = [];
  const octaves = Math.log2(maxHz / minHz);
  const totalSteps = Math.round(octaves * stepsPerOctave);

  for (let i = 0; i <= totalSteps; i++) {
    const freq = minHz * Math.pow(2, i / stepsPerOctave);
    frequencies.push(Math.round(freq));
  }

  return frequencies;
}

// Standard, compact audiometric frequency sets (suitable for quick tests)
export const DEFAULT_TEST_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];

// Extended compact set (finer but still small)
export const EXTENDED_TEST_FREQUENCIES = [250, 315, 500, 630, 1000, 1250, 2000, 2500, 4000, 5000, 8000, 12000, 13000];
