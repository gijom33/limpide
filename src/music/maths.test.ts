import { describe, expect, it } from 'vitest';
import { CHOICES, defaultPatch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { harmonicSeries } from './harmonics';
import { filterQ, harmonicFormula, levelDb, mathsReadout, oscillatorFormulas, qText, responseFormula } from './maths';

describe('the Maths Layer: Resonance as Q', () => {
  it('is a flat Butterworth (0.71) at Resonance 0 for low- and high-pass, at either Slope', () => {
    expect(filterQ('lowpass', 12, 0).q).toBeCloseTo(Math.SQRT1_2, 2);
    expect(filterQ('highpass', 12, 0).q).toBeCloseTo(Math.SQRT1_2, 2);
    expect(qText('lowpass', 12, 0)).toBe('Q 0.71');
  });

  it('rises with Resonance, and at 24 dB is shared by two stages', () => {
    expect(filterQ('lowpass', 12, 1).q).toBeGreaterThan(filterQ('lowpass', 12, 0.5).q);
    expect(filterQ('lowpass', 24, 0.5)).toMatchObject({ stages: 2 });
    // Two stages each with half the peak in dB: each Q is the square root of the one-stage Q.
    expect(filterQ('lowpass', 24, 0.5).q).toBeCloseTo(Math.sqrt(filterQ('lowpass', 12, 0.5).q), 5);
    expect(qText('lowpass', 24, 0.5)).toMatch(/^Q \d+\.\d+ ×2$/);
  });

  it('for band-pass and notch is the centre over the bandwidth: 0.5 to 20', () => {
    expect(filterQ('bandpass', 12, 0).q).toBeCloseTo(0.5);
    expect(filterQ('notch', 12, 1).q).toBeCloseTo(20);
  });
});

describe('the Maths Layer: levels in dB', () => {
  it('reads a gain in dB, silence as −∞', () => {
    expect(levelDb(1)).toBe('0.0 dB');
    expect(levelDb(0.5)).toBe('−6.0 dB');
    expect(levelDb(0)).toBe('−∞ dB');
  });

  it('shows Q on Resonance and dB on the Mixer and the Amp’s Sustain, nothing elsewhere', () => {
    const patch = defaultPatch();
    expect(mathsReadout('resonance', 0, patch)).toBe('Q 0.71');
    expect(mathsReadout('mixOsc2', 0.5, patch)).toBe('−6.0 dB');
    expect(mathsReadout('ampSustain', 1, patch)).toBe('0.0 dB');
    expect(mathsReadout('cutoff', 1000, patch)).toBeUndefined();
  });
});

describe('the Maths Layer: formulas as data', () => {
  it('has a Harmonic formula for every Waveform, whose numbers match the Ideal Reference', () => {
    for (const w of CHOICES.waveform) expect(harmonicFormula(w, 0.3).formula.length, w).toBeGreaterThan(5);
    // The saw's 1/n and the triangle's 1/n², as the series the Viewers draw.
    const saw = harmonicSeries('saw', 0.5, 8).magnitudes;
    expect(saw[3] / saw[1]).toBeCloseTo(1 / 3);
    const triangle = harmonicSeries('triangle', 0.5, 8).magnitudes;
    expect(triangle[3] / triangle[1]).toBeCloseTo(1 / 9);
    expect(harmonicFormula('pulse', 0.25).where).toContain('25 %');
  });

  it('has a Response Curve formula for every Filter Mode, squared at 24 dB', () => {
    for (const mode of CHOICES.filterMode) {
      expect(responseFormula(mode, 12).formula, mode).toMatch(/^\|H\| = .*x/);
      expect(responseFormula(mode, 24).formula, mode).toMatch(/\)²$/);
    }
    expect(responseFormula('highpass', 12).formula).toContain('x² /');
  });
});

describe('the Maths Layer under FM and Ring (issue 109)', () => {
  const preset = (name: string) => PRESETS.find((p) => p.name === name)!.patch;
  const text = (lines: { formula: string; where: string }[]) => lines.map((l) => `${l.formula} | ${l.where}`).join('\n');

  it('gives Osc 1’s series alone while neither is up', () => {
    expect(oscillatorFormulas(defaultPatch())).toEqual([harmonicFormula('saw', 0.25)]);
  });

  it('with FM at 50 %: the sideband rule, β = 2 and its Bessel sizes, and the saw’s series no longer the sound’s', () => {
    const lines = oscillatorFormulas({ ...defaultPatch(), crossMod: 0.5 });
    expect(lines[0].formula).toBe('n f₁ + k f₂:  bₙ |Jₖ(n β)|,  β = 4 × FM = 2.00');
    // J₀ to J₃ of 2, and Osc 2 in tune: on the Harmonics.
    expect(lines[0].where).toBe('f₂ / f₁ = 1: on the Harmonics; |J₀…J₃(β)| 0.22 0.58 0.35 0.13; Osc 2 a Saw: its 1st Harmonic only');
    expect(lines[1]).toEqual({ formula: 'bₙ = 2 / (π n)', where: 'bₙ: Osc 1 before FM, not the sound now' });
    expect(text(lines)).not.toContain('every n: each Harmonic 1/n of the first');
  });

  it('with FM off the ladder: between the Harmonics; FM Ladder’s two Sines say nothing of Osc 2’s Waveform', () => {
    expect(oscillatorFormulas({ ...preset('FM Ladder'), osc2Semitone: 3 })[0].where).toMatch(/^f₂ \/ f₁ = 1\.19: between the Harmonics; /);
    expect(oscillatorFormulas(preset('FM Ladder'))[0].where).not.toContain('Osc 2');
  });

  it('with Ring at 100 %: the sum and the difference for the knobs, the series only as Osc 1’s own', () => {
    const both = oscillatorFormulas({ ...defaultPatch(), mixRing: 1, osc2Octave: 1, osc2Semitone: 3 });
    expect(both[0].where).toBe('every n: each Harmonic 1/n of the first; Osc 1’s own, Ring adds the rest');
    expect(both[1].where).toBe('sums and differences (cₘ: Osc 2’s series); the first pair 1.38 and 3.38 × f₁');
    // Ring Bell: Osc 1 heard through Ring alone, so no series of its own.
    expect(oscillatorFormulas(preset('Ring Bell')).map((l) => l.formula)).toEqual(['Ring, Osc 1 × Osc 2:  n f₁ ± m f₂,  ½ bₙ cₘ']);
    // In tune, the difference is 0 Hz: an offset the engine takes out.
    expect(oscillatorFormulas({ ...defaultPatch(), mixRing: 1 })[1].where).toContain('the first pair 0 (taken out) and 2 × f₁');
  });

  it('leaves FM out while Osc 1 is not heard: it moves nothing that sounds', () => {
    expect(text(oscillatorFormulas({ ...defaultPatch(), crossMod: 0.5, mixOsc1: 0 }))).not.toContain('β');
  });
});
