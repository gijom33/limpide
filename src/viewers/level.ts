/**
 * Under this every sample is a millionth of full scale: a millionth of a Scope's height, and over 100 dB under full
 * scale, under every Spectrum's floor. A Tap this quiet draws as silence (issue 214).
 */
const SILENT = 1e-6;

/**
 * A Tap's RMS level in dBFS (−Infinity when silent), and whether it is silent as the Viewers draw it (every sample under
 * SILENT). While `frozen()`, it keeps the last reading.
 */
export function createLevelMeter(analyser: AnalyserNode, frozen: () => boolean = () => false) {
  const samples = new Float32Array(analyser.fftSize);
  return () => {
    if (!frozen()) analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    let silent = true;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      sum += s * s;
      if (s >= SILENT || s <= -SILENT) silent = false;
    }
    return { db: 10 * Math.log10(sum / samples.length), silent };
  };
}
