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
