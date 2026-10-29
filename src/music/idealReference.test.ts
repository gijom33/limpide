import { describe, expect, it } from 'vitest';
import { defaultPatch } from '../patch/patch';
import { harmonicSeries } from './harmonics';
import { idealPartials, idealReference } from './idealReference';

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

describe('the Ideal from every Oscillator (the owner, 2026-10-27): each source’s marks at its own Mixer level', () => {
  const sine = { waveform: 'sine', osc2Waveform: 'sine' } as const;
  const of = (partials: ReturnType<typeof idealPartials>, source: string, ratio: number) =>
    partials.find((p) => p.source === source && Math.abs(p.ratio - ratio) < 1e-3);

  it('is Osc 1’s series alone while the others are silent', () => {
    const partials = idealPartials({ ...defaultPatch(), mixOsc1: 0.5 }, 64);
    expect(new Set(partials.map((p) => p.source))).toEqual(new Set(['osc1']));
    for (const n of [1, 2, 3, 10]) expect(of(partials, 'osc1', n)!.level).toBeCloseTo(saw[n] * 0.5);
  });

  it('puts Osc 2’s Harmonics where they fall: a fifth up, between Osc 1’s; with Detune, a few cents off', () => {
    const fifth = idealPartials({ ...defaultPatch(), ...sine, mixOsc2: 0.5, osc2Semitone: 7 }, 64);
    expect(of(fifth, 'osc2', 2 ** (7 / 12))!.level).toBeCloseTo(0.5 * harmonicSeries('sine', 0.5, 4).magnitudes[1]);
    const detuned = idealPartials({ ...defaultPatch(), ...sine, mixOsc2: 1, osc2Detune: 10 }, 64);
    expect(of(detuned, 'osc2', 2 ** (10 / 1200))).toBeDefined();
  });

  it('shows every source on a Harmonic they share, each at its own level', () => {
    // Osc 2 a saw an octave up: its fundamental on Osc 1’s second Harmonic.
    const partials = idealPartials({ ...defaultPatch(), mixOsc1: 1, mixOsc2: 0.8, osc2Octave: 1 }, 64);
    expect(of(partials, 'osc1', 2)!.level).toBeCloseTo(saw[2]);
    expect(of(partials, 'osc2', 2)!.level).toBeCloseTo(saw[1] * 0.8);
  });

  it('with the Sub on, counts from the Sub’s pitch: the Sub’s marks on every Harmonic it has, Osc 1’s on the even ones', () => {
    const partials = idealPartials({ ...defaultPatch(), mixOsc1: 1, mixSub: 0.5 }, 64);
    expect(of(partials, 'sub', 1)!.level).toBeCloseTo(square[1] * 0.5);
    expect(of(partials, 'osc1', 2)!.level).toBeCloseTo(saw[1]);
    expect(of(partials, 'osc1', 3)).toBeUndefined();
  });

  it('counts from Osc 1 at its Octave; Osc 2 stays on the Note played (issue 90)', () => {
    // Osc 1 an octave down, Osc 2 on the Note: Osc 2 lands on Osc 1's second Harmonic.
    const partials = idealPartials({ ...defaultPatch(), ...sine, mixOsc2: 1, osc1Octave: -1 }, 64);
    expect(of(partials, 'osc1', 1)).toBeDefined();
    expect(of(partials, 'osc2', 2)).toBeDefined();
    // Osc 1 up an octave with the Sub: the Sub an octave below Osc 1 is still the fundamental, Osc 2 under both.
    const up = idealPartials({ ...defaultPatch(), ...sine, mixOsc2: 1, mixSub: 1, osc1Octave: 1 }, 64);
    expect(of(up, 'sub', 1)).toBeDefined();
    expect(of(up, 'osc1', 2)).toBeDefined();
    expect(of(up, 'osc2', 1)).toBeDefined();
  });

  it('comes in order, low to high', () => {
    const partials = idealPartials({ ...defaultPatch(), mixOsc2: 1, osc2Semitone: 7, mixSub: 1 }, 32);
    expect(partials.map((p) => p.ratio)).toEqual([...partials.map((p) => p.ratio)].sort((a, b) => a - b));
  });
});

describe('the Sub’s Octave and Waveform in the Ideal (issue 91)', () => {
  const at = (partials: ReturnType<typeof idealPartials>, source: string, ratio: number) =>
    partials.find((p) => p.source === source && Math.abs(p.ratio - ratio) < 1e-3);

  it('counts from the Sub two octaves down: Osc 1 on every fourth Harmonic', () => {
    const partials = idealPartials({ ...defaultPatch(), mixSub: 1, subOctave: -2 }, 64);
    expect(at(partials, 'osc1', 4)).toBeDefined();
    expect(at(partials, 'osc1', 2)).toBeUndefined();
    expect(at(partials, 'sub', 3)!.level).toBeCloseTo(square[3]);
    expect(idealReference({ ...defaultPatch(), mixSub: 1, subOctave: -2 }, 64)[4]).toBeCloseTo(saw[1]);
  });

  it('draws a sine Sub as its one Harmonic', () => {
    const partials = idealPartials({ ...defaultPatch(), mixSub: 1, subWaveform: 'sine' }, 64);
    expect(partials.filter((p) => p.source === 'sub').map((p) => p.ratio)).toEqual([1]);
  });
});
