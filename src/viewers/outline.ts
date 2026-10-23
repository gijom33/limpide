/**
 * The Spectrum trace: the peak level (dB) in each device-pixel column, so a Retina screen gets twice the detail
 * and Harmonics stay separate spikes for as long as there is a pixel between them. Column c sits at
 * x = c / pixelRatio CSS pixels.
 */
export function spectrumOutline(
  bins: Float32Array,
  binHz: number,
  axis: { xOf(f: number): number; contains(f: number): boolean },
  width: number,
  pixelRatio: number,
): Float32Array {
  const columns = Math.ceil(width * pixelRatio);
  const peak = new Float32Array(columns).fill(-Infinity);
  for (let i = 1; i < bins.length; i++) {
    const f = i * binHz;
    if (!axis.contains(f)) continue;
    const col = Math.min(columns - 1, Math.floor(axis.xOf(f) * pixelRatio));
    peak[col] = Math.max(peak[col], bins[i]);
  }
  return peak;
}
