/**
 * Under this every sample is a millionth of full scale: a millionth of a Scope's height, and over 100 dB under full
 * scale, under every Spectrum's floor. A Tap this quiet draws as silence (issue 214).
 */
const SILENT_SAMPLE = 1e-6;

/** Whether one sample is over SILENT_SAMPLE, either way. */
const heard = (sample: number) => sample >= SILENT_SAMPLE || sample <= -SILENT_SAMPLE;

/**
 * Whether a Tap's `samples` are silent as the Viewers draw them: every one under SILENT_SAMPLE. The one definition, for
 * the Viewers' rest (issue 214) and Cycle Lock's skipped search (issue 213). Indexed, as `for…of` costs more.
 */
export function silent(samples: Float32Array): boolean {
  for (let i = 0; i < samples.length; i++) if (heard(samples[i])) return false;
  return true;
}

/**
 * A Tap's RMS level in dBFS (−Infinity when silent), and whether it is silent as the Viewers draw it (as `silent`
 * says). While `frozen()`, it keeps the last reading.
 */
export function createLevelMeter(analyser: AnalyserNode, frozen: () => boolean = () => false) {
  const samples = new Float32Array(analyser.fftSize);
  return () => {
    if (!frozen()) analyser.getFloatTimeDomainData(samples);
    // One pass over the samples a frame (issue 250): their sum of squares, and whether any is heard.
    let sum = 0;
    let anyHeard = false;
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      sum += sample * sample;
      if (!anyHeard && heard(sample)) anyHeard = true;
    }
    return { db: 10 * Math.log10(sum / samples.length), silent: !anyHeard };
  };
}
