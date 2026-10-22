export interface GhostSpan {
  column: number;
  /** Oscillator Tap level (dB). */
  from: number;
  /** Filter Tap level (dB), clamped to the floor. */
  to: number;
}

interface Options {
  /** Below this the Oscillator Tap had no real energy in the column (between Harmonics, noise floor). */
  floorDb: number;
  /** Differences smaller than this are frame-to-frame jitter, not filtering. */
  thresholdDb: number;
  /** Only these columns (the ones holding a Harmonic); all columns when omitted. */
  columns?: Iterable<number>;
}

/**
 * Compares the Oscillator Tap's spectrum with the Filter Tap's, column by column. `removed` is the Ghost:
 * energy that was present before the Filter and is gone after it. `boosted` is energy Resonance added.
 */
export function ghostRegions(oscillatorDb: Float32Array, filterDb: Float32Array, { floorDb, thresholdDb, columns }: Options) {
  const removed: GhostSpan[] = [];
  const boosted: GhostSpan[] = [];
  for (const column of columns ?? oscillatorDb.keys()) {
    const from = oscillatorDb[column];
    if (!(from > floorDb)) continue;
    const to = Math.max(floorDb, filterDb[column]);
    if (from - to > thresholdDb) removed.push({ column, from, to });
    else if (to - from > thresholdDb) boosted.push({ column, from, to });
  }
  return { removed, boosted };
}
