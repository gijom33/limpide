import { describe, expect, it } from 'vitest';
import { heardAt } from './outputClock';

// Issue 185: a MIDI clock's or a Tap's beat, timed on the page's clock, is placed where the context's sound is heard
// then, not where it is being made: the output's latency (10–40 ms built in, far more over Bluetooth) lies between.

describe('the context’s time heard at a moment of the page’s clock (issue 185)', () => {
  it('is read from the output timestamp: the context time being heard at a page time, and the time since', () => {
    // 10 s of the context's is heard at 5 s on the page's clock, while 10.04 s is being made (40 ms of latency).
    const ctx = { state: 'running' as const, currentTime: 10.04, getOutputTimestamp: () => ({ contextTime: 10, performanceTime: 5000 }) };
    expect(heardAt(ctx, 5.5, 5.01)).toBeCloseTo(10.5, 9);
    expect(heardAt(ctx, 4.9, 5.01)).toBeCloseTo(9.9, 9);
  });

  it('falls back on the latencies the context gives, without a timestamp, or before the sound runs', () => {
    const ctx = { state: 'running' as const, currentTime: 10, baseLatency: 0.01, outputLatency: 0.03 };
    // Heard now: what was made 40 ms ago.
    expect(heardAt(ctx, 7, 7)).toBeCloseTo(9.96, 9);
    expect(heardAt(ctx, 7.5, 7)).toBeCloseTo(10.46, 9);
    const suspended = { ...ctx, state: 'suspended' as const, getOutputTimestamp: () => ({ contextTime: 0, performanceTime: 0 }) };
    expect(heardAt(suspended, 7, 7)).toBeCloseTo(9.96, 9);
  });

  it('leaves out a stamp it cannot place, as a zero one: a time of 0, or a context time ahead of the context’s', () => {
    const latencies = { state: 'running' as const, currentTime: 10, baseLatency: 0.01, outputLatency: 0.03 };
    const stamped = (contextTime: number, performanceTime: number) => ({ ...latencies, getOutputTimestamp: () => ({ contextTime, performanceTime }) });
    // Each falls back on the latencies: 40 ms behind what is being made.
    expect(heardAt(stamped(0, 5000), 7, 7)).toBeCloseTo(9.96, 9);
    expect(heardAt(stamped(10.5, 5000), 7, 7)).toBeCloseTo(9.96, 9);
    expect(heardAt(stamped(9.96, 0), 7, 7)).toBeCloseTo(9.96, 9);
    // A stamp at now on both clocks is placed.
    expect(heardAt(stamped(10, 7000), 7.5, 7)).toBeCloseTo(10.5, 9);
  });

  it('takes no latency it is not told of (an offline context, a browser that gives none)', () => {
    expect(heardAt({ state: 'running', currentTime: 3 }, 1, 1)).toBe(3);
  });
});
