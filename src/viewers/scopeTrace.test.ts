import { describe, expect, it } from 'vitest';
import { scopeTrace } from './scopeTrace';

const ramp = Float32Array.from({ length: 100 }, (_, i) => i);

describe('scopeTrace', () => {
  it('resamples the shown window to as many points as the Scope draws', () => {
    const trace = scopeTrace(ramp, 10, 40, 5);
    expect([...trace]).toEqual([10, 20, 30, 40, 50]);
  });

  it('starts between samples when Cycle Lock asks for it, interpolating', () => {
    expect(scopeTrace(ramp, 10.25, 4, 3)[0]).toBeCloseTo(10.25);
  });

  it('is a copy: later changes to the samples do not alter a captured trace (a Snapshot)', () => {
    const samples = ramp.slice();
    const trace = scopeTrace(samples, 0, 10, 3);
    samples.fill(0);
    expect(trace[2]).toBe(10);
  });

  it('never reads past the end of the buffer', () => {
    const trace = scopeTrace(ramp, 98.5, 10, 4);
    expect([...trace].every(Number.isFinite)).toBe(true);
    expect(trace[3]).toBe(99);
  });
});
