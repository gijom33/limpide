/**
 * Morphological closing (a running max, then a running min, over ±radius columns): fills valleys narrower than
 * the window and keeps everything else. Crowded Harmonics merge into one smooth outline across their tops, while
 * Harmonics far apart stay separate spikes; no point ever ends up above the real peaks around it.
 */
export function closeGaps(values: Float32Array, radius: number): Float32Array {
  const n = values.length;
  const sweep = (input: Float32Array, pick: (a: number, b: number) => number, pad: number) => {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let v = input[i];
      for (let d = 1; d <= radius; d++) {
        v = pick(v, i - d >= 0 ? input[i - d] : pad);
        v = pick(v, i + d < n ? input[i + d] : pad);
      }
      out[i] = v;
    }
    return out;
  };
  // Outside the spectrum counts as silence for the max, and as "no limit" for the min, so the edges stay honest.
  const dilated = sweep(values, Math.max, -Infinity);
  return sweep(dilated, Math.min, Infinity);
}

/**
 * The merging window (CSS pixels): only valleys a device pixel or so wide are filled, where neighbouring
 * Harmonics would touch anyway. Everything the screen can separate stays a separate spike.
 */
const MERGE_BELOW_PX = 1;

/**
 * The Spectrum trace: the peak level (dB) in each device-pixel column (so a Retina screen gets twice the detail),
 * with valleys too narrow to see closed into one outline. Column c sits at x = c / pixelRatio CSS pixels.
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
  return closeGaps(peak, Math.round((MERGE_BELOW_PX / 2) * pixelRatio));
}
