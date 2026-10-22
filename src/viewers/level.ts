/** RMS level of a Tap in dBFS (−Infinity when silent). */
export function createLevelMeter(analyser: AnalyserNode) {
  const samples = new Float32Array(analyser.fftSize);
  return () => {
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const s of samples) sum += s * s;
    return 10 * Math.log10(sum / samples.length);
  };
}
