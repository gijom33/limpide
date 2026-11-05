/** The parts of an audio context that tell when its sound is heard. */
export interface OutputClockContext {
  readonly state: AudioContextState;
  readonly currentTime: number;
  readonly baseLatency?: number;
  readonly outputLatency?: number;
  getOutputTimestamp?(): AudioTimestamp;
}

/**
 * The context's time whose sound is heard at `pageTime` (seconds on the page's clock, `performance.now()`'s), the page
 * clock reading `pageNow` (issue 185). A MIDI clock's beat or a Tap Tempo tap is heard where it happened, so a beat placed there
 * on the context's clock lands on it, not later by the output's latency (10–40 ms built in, far more over Bluetooth).
 * Read from the output timestamp while the sound runs; else from the latencies the context gives, none if it gives none.
 * A stamp it cannot place is left out the same way: a time of 0 on either clock, or a context time ahead of the context's.
 */
export function heardAt(ctx: OutputClockContext, pageTime: number, pageNow: number): number {
  const stamp = ctx.state === 'running' ? ctx.getOutputTimestamp?.() : undefined;
  if (placeable(stamp, ctx.currentTime))
    return stamp.contextTime + pageTime - stamp.performanceTime / 1000;
  return ctx.currentTime - (ctx.baseLatency ?? 0) - (ctx.outputLatency ?? 0) + pageTime - pageNow;
}

function placeable(stamp: AudioTimestamp | undefined, contextNow: number): stamp is Required<AudioTimestamp> {
  const { contextTime, performanceTime } = stamp ?? {};
  return !!contextTime && !!performanceTime && contextTime <= contextNow;
}
