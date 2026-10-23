import { describe, expect, it } from 'vitest';
import { defaultPatch } from '../patch/patch';
import { harmonicSeries } from './harmonics';
import { idealReference } from './idealReference';

const saw = harmonicSeries('saw', 0.5, 64).magnitudes;
const square = harmonicSeries('square', 0.5, 64).magnitudes;

describe('Ideal Reference: the Harmonic levels the Oscillator Tap should show', () => {
  it('is Osc 1’s Fourier series at its Mixer level, while the Sub is off', () => {
    const ideal = idealReference({ ...defaultPatch(), mixOsc1: 0.5 }, 64);
    for (const n of [1, 2, 3, 10]) expect(ideal[n]).toBeCloseTo(saw[n] * 0.5);
  });

  it('with the Sub on, counts Harmonics from the Sub’s pitch: the Sub’s square on the odd ones, Osc 1 on the even ones', () => {
    const ideal = idealReference({ ...defaultPatch(), mixOsc1: 1, mixSub: 0.5 }, 64);
    expect(ideal[1]).toBeCloseTo(square[1] * 0.5); // the Sub's fundamental, an octave below Osc 1
    expect(ideal[2]).toBeCloseTo(saw[1]); // Osc 1's fundamental
    expect(ideal[3]).toBeCloseTo(square[3] * 0.5);
    expect(ideal[4]).toBeCloseTo(saw[2]);
    expect(ideal[10]).toBeCloseTo(saw[5]);
  });
});
