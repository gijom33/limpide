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

/**
 * The stretches of a curve to draw, as [first, last] column pairs: the curve runs down to the floor where it falls
 * through it and starts again where it comes back, rather than lying along the bottom edge in between (the Response
 * Curve below the Spectrum's lowest dB).
 */
export function aboveFloor(ys: ArrayLike<number>, floorY: number): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  for (let i = 0; i < ys.length; i++) {
    const under = ys[i] >= floorY;
    if (start < 0) {
      // A stretch starts on its first column above the floor, from the floor point just before it if there is one.
      if (!under) start = Math.max(0, i - 1);
    } else if (under) {
      runs.push([start, i]); // down to the floor, then lift
      start = -1;
    }
  }
  if (start >= 0) runs.push([start, ys.length - 1]);
  return runs;
}

/**
 * The Ideal Reference rings to draw, from low to high: none on the floor (a Harmonic theory puts below the Spectrum's
 * lowest dB, which would sit along the bottom edge), and none closer than `gap` to the last one drawn, where
 * Harmonics crowd into a band.
 */
export function ringsToDraw(rings: readonly { x: number; y: number }[], floorY: number, gap: number): number[] {
  const drawn: number[] = [];
  let lastX = -Infinity;
  rings.forEach(({ x, y }, i) => {
    if (y >= floorY || x - lastX < gap) return;
    lastX = x;
    drawn.push(i);
  });
  return drawn;
}
