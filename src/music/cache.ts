/**
 * A small cache of what is costly to make, by key: the `limit` most recently asked for are kept, the one asked for
 * longest ago let go first. The Oscillators' and the LFOs' waves, the Harmonic series and the Ideal's all keep theirs
 * in one (the 1.16.1 review).
 */
export function createCache<K, V>(limit: number) {
  const kept = new Map<K, V>();
  return {
    /** The value kept for `key`, else `make`'s, kept from now on. */
    get(key: K, make: () => V): V {
      const value = kept.has(key) ? (kept.get(key) as V) : make();
      kept.delete(key);
      kept.set(key, value);
      if (kept.size > limit) kept.delete(kept.keys().next().value as K);
      return value;
    },
  };
}
