/**
 * The Scope's trace: `length` samples starting at the (fractional) Cycle Lock offset, resampled with linear
 * interpolation to `points` values, one per drawn point. Returns a copy, so it can be kept as a Snapshot, unless
 * given `into` to fill: Cycle Lock weighs its candidates in one array.
 */
export function scopeTrace(samples: Float32Array, start: number, length: number, points: number, into = new Float32Array(points)): Float32Array {
  const trace = into;
  const last = samples.length - 1;
  for (let p = 0; p < points; p++) {
    const t = Math.min(last, start + (points > 1 ? (p * length) / (points - 1) : 0));
    const i = Math.floor(t);
    trace[p] = i >= last ? samples[last] : samples[i] + (samples[i + 1] - samples[i]) * (t - i);
  }
  return trace;
}
