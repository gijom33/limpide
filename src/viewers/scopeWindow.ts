/**
 * How much of a Tap's buffer the Scope shows: the requested number of Note cycles, reduced for very
 * low Notes so that one extra cycle always remains for Cycle Lock to find its starting point in.
 */
export function scopeWindow(bufferLength: number, sampleRate: number, frequency: number, cycles: number) {
  if (!(frequency > 0)) return { length: bufferLength / 4, cycles: 0 };
  const period = sampleRate / frequency;
  const fitting = Math.max(1, Math.min(cycles, Math.floor(bufferLength / period) - 1));
  return { length: Math.min(fitting * period, bufferLength - period), cycles: fitting };
}
