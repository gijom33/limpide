import { describe, expect, it } from 'vitest';
import { CHOICES, defaultPatch } from '../patch/patch';
import { harmonicSeries } from './harmonics';
import { filterQ, harmonicFormula, levelDb, mathsReadout, qText, responseFormula } from './maths';

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
