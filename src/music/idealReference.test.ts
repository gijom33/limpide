import { describe, expect, it } from 'vitest';
import { defaultPatch, type Patch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { harmonicSeries } from './harmonics';
import { besselJ, fmDepthKept, idealPartials, idealReference } from './idealReference';

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

describe('Ring Modulation in the Ideal (issue 88)', () => {
  const sines = { ...defaultPatch(), waveform: 'sine', osc2Waveform: 'sine', mixOsc1: 0, mixOsc2: 0 } as const;
  const sine = harmonicSeries('sine', 0.5, 4).magnitudes[1];

  it('marks two sines’ sum and difference, at half the product of their levels, and nothing else', () => {
    const partials = idealPartials({ ...sines, mixRing: 0.8, osc2Semitone: 7 }, 64);
    const fifth = 2 ** (7 / 12);
    expect(partials.map((p) => p.source)).toEqual(['ring', 'ring']);
    expect(partials[0].ratio).toBeCloseTo(fifth - 1);
    expect(partials[1].ratio).toBeCloseTo(fifth + 1);
    for (const p of partials) expect(p.level).toBeCloseTo((sine * sine * 0.8) / 2);
  });

  // Both start their cycles together on each Note (issue 94): in tune, their product is one known wave.
  const ring = (patch: Partial<Patch>) => idealPartials({ ...sines, mixRing: 1, ...patch }, 64).filter((p) => p.source === 'ring');
  const engineScale = (w: 'saw' | 'square', firstHarmonic: number) => harmonicSeries(w, 0.5, 1024).magnitudes[1] / firstHarmonic;

  it('marks nothing for two in-tune Squares: their product is a constant', () => {
    expect(ring({ waveform: 'square', osc2Waveform: 'square' })).toEqual([]);
  });

  it('marks two in-tune Saws as their product, a parabola: every Harmonic, at 1/n²', () => {
    const s = engineScale('saw', 2 / Math.PI);
    const partials = ring({ waveform: 'saw', osc2Waveform: 'saw' });
    expect(partials.slice(0, 4).map((p) => p.ratio)).toEqual([1, 2, 3, 4]);
    for (const p of partials.slice(0, 8)) expect(p.level).toBeCloseTo((s * s * 4) / (Math.PI * p.ratio) ** 2, 3);
  });

  it('marks a Square times a Square an octave up as a Square at the lower pitch', () => {
    const s = engineScale('square', 4 / Math.PI);
    const partials = ring({ waveform: 'square', osc2Waveform: 'square', osc2Octave: 1 });
    expect(partials.slice(0, 4).map((p) => p.ratio)).toEqual([1, 3, 5, 7]);
    for (const p of partials.slice(0, 4)) expect(p.level).toBeCloseTo((s * s * 4) / (Math.PI * p.ratio), 3);
  });

  it('marks two in-tune Sines at twice their pitch alone', () => {
    const partials = ring({ mixRing: 0.8 });
    expect(partials.map((p) => p.ratio)).toEqual([2]);
    expect(partials[0].level).toBeCloseTo((sine * sine * 0.8) / 2);
  });

  it('marks nothing while Ring is down', () => {
    expect(idealPartials({ ...sines, osc2Semitone: 7 }, 64)).toEqual([]);
  });
});

describe('FM in the Ideal (issue 96)', () => {
  it('works out the Bessel functions FM’s sidebands follow', () => {
    const one = besselJ(1, 3);
    expect(one[0]).toBeCloseTo(0.7651976866, 8);
    expect(one[1]).toBeCloseTo(0.4400505857, 8);
    expect(one[2]).toBeCloseTo(0.1149034849, 8);
    expect(besselJ(10, 0)[0]).toBeCloseTo(-0.2459357645, 8);
    expect(besselJ(100, 100)[100]).toBeCloseTo(0.09636667330, 7);
  });

  const sines = { ...defaultPatch(), waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 7 } as const;
  const osc1 = (patch: Partial<Patch>) => idealPartials({ ...sines, ...patch }, 64).filter((p) => p.source === 'osc1');

  it('draws plain Osc 1 while FM is down', () => {
    expect(osc1({ crossMod: 0 }).map((p) => p.ratio)).toEqual([1]);
  });

  it('draws a Sine swung by a Sine at the carrier and its sidebands, at |J_k| of the index', () => {
    const fifth = 2 ** (7 / 12);
    const marks = osc1({ crossMod: 0.25 }); // an index of 1
    const j = besselJ(1, 3);
    const at = (ratio: number) => marks.find((p) => Math.abs(p.ratio - ratio) < 1e-6)?.level;
    expect(at(1)).toBeCloseTo(j[0], 6);
    expect(at(1 + fifth)).toBeCloseTo(j[1], 6);
    expect(at(fifth - 1)).toBeCloseTo(j[1], 6); // 1 − a fifth, folded back
    expect(at(1 + 2 * fifth)).toBeCloseTo(j[2], 6);
  });

  it('keeps plain Osc 1 where nothing simple says what FM does: a Square Osc 2 a fifth up', () => {
    expect(osc1({ osc2Waveform: 'square', crossMod: 0.25 }).map((p) => p.ratio)).toEqual([1]);
  });
});

describe('FM’s depth at the top (issue 103)', () => {
  const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
  const preset = (name: string) => PRESETS.find((p) => p.name === name)!.patch;
  const kept = (patch: Patch, note: number, rate = 48000) => fmDepthKept(patch, hz(note) * 2 ** patch.osc1Octave, rate);
  const C6 = 84;
  const C7 = 96;

  it('keeps every FM Preset’s whole depth below F♯5, and below C6 all but the three widest', () => {
    const widest = ['Clang Alarm', 'Breathing Bell', 'Glass Shimmer'];
    for (const { name, patch } of PRESETS.filter((p) => p.patch.crossMod > 0))
      for (let note = 0; note < (widest.includes(name) ? 78 : C6); note++) expect(kept(patch, note), `${name} on ${note}`).toBe(1);
  });

  it('shrinks Clang Alarm’s depth on C7 just enough that under −65 dB of it lies past 24 kHz', () => {
    const alarm = preset('Clang Alarm');
    // Osc 2 is 3.56 times Osc 1; on C7 (2093 Hz) the sidebands from k = 3 up, and from k = −4 down, lie past 24 kHz.
    const past = (index: number) => {
      const j = besselJ(index, 30);
      let share = 0;
      for (let k = 3; k <= 30; k++) share += j[k] ** 2 + (k >= 4 ? j[k] ** 2 : 0);
      return 10 * Math.log10(share);
    };
    // Its square LFO takes FM from 0 to 100 %: an index of 4 at the peak.
    const index = 4 * kept(alarm, C7);
    expect(index).toBeLessThan(1);
    expect(past(index)).toBeLessThanOrEqual(-65);
    expect(past(index * 1.01)).toBeGreaterThan(-65);
  });

  it('counts FM’s LFO swing: without it Clang Alarm’s knob alone (50 %) keeps twice the share', () => {
    const alarm = preset('Clang Alarm');
    expect(kept({ ...alarm, lfoAmount: 0 }, C7)).toBeCloseTo(2 * kept(alarm, C7), 3);
  });

  it('plays the same on a 192 kHz device as on a 48 kHz one, and keeps less on a 44.1 kHz one', () => {
    const bell = preset('FM Bell');
    expect(kept(bell, C7, 192000)).toBe(kept(bell, C7));
    expect(kept(bell, C7, 44100)).toBeLessThanOrEqual(kept(bell, C7));
    expect(kept(preset('FM Sidebands'), C7, 44100)).toBeLessThan(1);
  });

  it('draws FM’s sidebands at the depth kept: half of 50 % is drawn as 25 %', () => {
    const sines = { ...defaultPatch(), waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 7 } as const;
    expect(idealPartials({ ...sines, crossMod: 0.5 }, 64, 0.5)).toEqual(idealPartials({ ...sines, crossMod: 0.25 }, 64));
  });
});
