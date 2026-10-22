interface Options {
  /** Available full-scale ranges, ascending (e.g. ±1, ±2, ±4, ±8). */
  ranges: number[];
  /** How long the signal must stay smaller before the range steps down. */
  holdMs: number;
}

/** A Scope's vertical range, stepped like a scope's V/div switch: grows at once, shrinks after a hold. */
export function createAutoRange({ ranges, holdMs }: Options) {
  const fitting = (peak: number) => ranges.find((r) => peak <= r) ?? ranges[ranges.length - 1];
  let current = ranges[0];
  let smallerSince: number | undefined;

  return {
    update(peak: number, nowMs: number): number {
      const wanted = fitting(peak);
      if (wanted >= current) {
        current = wanted;
        smallerSince = undefined;
      } else if (smallerSince === undefined) {
        smallerSince = nowMs;
      } else if (nowMs - smallerSince >= holdMs) {
        current = wanted;
        smallerSince = undefined;
      }
      return current;
    },
  };
}
