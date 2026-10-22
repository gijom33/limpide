/** RMS level of a Tap in dBFS (−Infinity when silent). While `frozen()`, it keeps the last reading. */
export function createLevelMeter(analyser: AnalyserNode, frozen: () => boolean = () => false) {
  const samples = new Float32Array(analyser.fftSize);
  return () => {
    if (!frozen()) analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const s of samples) sum += s * s;
    return 10 * Math.log10(sum / samples.length);
  };
}
