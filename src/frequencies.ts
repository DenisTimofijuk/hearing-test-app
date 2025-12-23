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
