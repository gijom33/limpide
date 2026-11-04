import { describe, expect, it } from 'vitest';
import { createLevelMeter } from './level';

/** An analyser stand-in whose buffer is `samples`. */
const tap = (samples: Float32Array) =>
  ({ fftSize: samples.length, getFloatTimeDomainData: (into: Float32Array) => into.set(samples) }) as unknown as AnalyserNode;

describe('a Tap’s level meter', () => {
  it('reads the level in dBFS, and silence as −Infinity', () => {
    expect(createLevelMeter(tap(new Float32Array(4).fill(0.5)))().db).toBeCloseTo(-6.02, 2);
    expect(createLevelMeter(tap(new Float32Array(4)))().db).toBe(-Infinity);
  });

  it('calls a Tap silent while every sample is under a millionth of full scale: too small for any Viewer to draw (issue 214)', () => {
    expect(createLevelMeter(tap(Float32Array.of(0, 9e-7, -9e-7, 0)))().silent).toBe(true);
    expect(createLevelMeter(tap(Float32Array.of(0, 9e-7, -2e-6, 0)))().silent).toBe(false);
    expect(createLevelMeter(tap(new Float32Array(4).fill(0.5)))().silent).toBe(false);
  });
});
