import { describe, expect, it } from 'vitest';
import { effectiveCutoff } from '../modulation/modulationModel';
import { defaultPatch } from '../patch/patch';
import { CUTOFF_CLAMP, CUTOFF_SPAN, centsOverFloor, filterLevel, filterStages, filterStagesAt, LEVEL_DIP, qSwing, RESONANCE_DIP, resonanceToQdB, topFade } from './filterDesign';

/** What a WaveShaperNode makes of `x` through `curve`: the curve read between its points, held at its ends past ±1. */
function shaped(curve: Float32Array, x: number) {
  const v = ((curve.length - 1) / 2) * (Math.max(-1, Math.min(1, x)) + 1);
  const k = Math.min(curve.length - 2, Math.floor(v));
  return curve[k] + (curve[k + 1] - curve[k]) * (v - k);
}

describe('filterStages', () => {
  it('uses one stage at 12 dB, the second left transparent (a 0 dB shelf)', () => {
    const [first, second] = filterStages('lowpass', 12, 0.5);
    expect(first).toEqual({ type: 'lowpass', Q: resonanceToQdB(0.5), gain: 0 });
    expect(second).toMatchObject({ type: 'lowshelf', gain: 0 });
  });

  it('splits Resonance across two stages at 24 dB, so the peak is as tall as at 12 dB', () => {
    for (const r of [0, 0.4, 0.8]) {
      const stages = filterStages('lowpass', 24, r);
      expect(stages.map((s) => s.type)).toEqual(['lowpass', 'lowpass']);
      expect(stages[0].Q + stages[1].Q).toBeCloseTo(resonanceToQdB(r), 9); // dB add when stages cascade
    }
  });

  it('does the same for high-pass', () => {
    expect(filterStages('highpass', 24, 0.6).map((s) => s.type)).toEqual(['highpass', 'highpass']);
  });

  it('makes Resonance narrow the band for band-pass and notch (Q as a ratio, 0.5 to 20)', () => {
    for (const mode of ['bandpass', 'notch'] as const) {
      const q = (r: number) => filterStages(mode, 12, r)[0].Q;
      expect(q(0)).toBeCloseTo(0.5);
      expect(q(1)).toBeCloseTo(20);
      expect(q(0.6)).toBeGreaterThan(q(0.3));
      expect(filterStages(mode, 24, 0.5).map((s) => s.type)).toEqual([mode, mode]);
    }
  });
});

describe('resonanceToQdB', () => {
  it('starts flat (Butterworth, −3 dB at the Cutoff) and rises to a 24 dB peak', () => {
    expect(resonanceToQdB(0)).toBeCloseTo(-3.01, 2);
    expect(resonanceToQdB(1)).toBeCloseTo(24, 0);
  });
});

describe('the Filter under modulation, as the model has it (issue 166)', () => {
  const MODES = ['lowpass', 'highpass', 'bandpass', 'notch'] as const;

  it('moves each stage’s Q as the model moves the Resonance, so it never passes its floor: a band-pass’s and notch’s by ratios', () => {
    for (const mode of MODES)
      for (const slope of [12, 24] as const)
        for (const resonance of [0, 0.2, 0.5, 0.8, 1])
          // The LFOs' widest swing together, as far as the knob leaves room either way (LFO_LAWS), or less.
          for (const span of [0, 0.5, 1].map((share) => share * Math.min(resonance, 1 - resonance))) {
            const { curve, stages } = qSwing(mode, slope, resonance, span);
            const rest = filterStages(mode, slope, resonance);
            for (let i = 0; i <= 40; i++) {
              const x = i / 20 - 1;
              const moved = filterStages(mode, slope, resonance + span * x);
              for (const k of [0, 1] as const) {
                const q = rest[k].Q + stages[k] * shaped(curve, x);
                expect(q, `${mode} ${slope} dB, Resonance ${resonance} swung ${(span * x).toFixed(2)}, stage ${k + 1}`).toBeCloseTo(moved[k].Q, 4);
                expect(q).toBeGreaterThanOrEqual(filterStages(mode, slope, 0)[k].Q - 1e-4);
              }
            }
          }
  });

  it('holds the Cutoff within 20 Hz to 20 kHz, however far its modulation takes it, as the model does', () => {
    const patch = defaultPatch();
    for (const hz of [0.1, 5, 19.9, 20, 440, 5000, 20000, 20001, 80000, 1e6]) {
      const held = 20 * 2 ** (shaped(CUTOFF_CLAMP, centsOverFloor(hz) / CUTOFF_SPAN) / 1200);
      // The model's Cutoff for `hz`: the knob at 20 Hz, its Filter Envelope opened by as many octaves as `hz` is above it.
      const model = effectiveCutoff({ ...patch, cutoff: 20, filterEnvAmount: Math.log2(hz / 20) }, 1);
      expect(held / model, `${hz} Hz`).toBeCloseTo(1, 5);
    }
  });
});

describe('the Filter at the top of its range (issue 195)', () => {
  it('keeps all its Resonance up to half an octave under 20 kHz, then fades it smoothly to none at 20 kHz', () => {
    expect(topFade(1000)).toBe(1);
    expect(topFade(20000 / Math.SQRT2)).toBe(1);
    expect(topFade(20000 / 2 ** 0.25)).toBeCloseTo(0.5, 9);
    expect(topFade(20000)).toBe(0);
    for (let hz = 14000; hz < 20000; hz += 250) expect(topFade(hz + 250)).toBeLessThanOrEqual(topFade(hz));
  });

  it('takes a low- or high-pass’s Q toward its flat one as the Resonance fades, and leaves a band-pass’s or notch’s', () => {
    for (const slope of [12, 24] as const)
      for (const resonance of [0, 0.5, 1]) {
        for (const mode of ['lowpass', 'highpass'] as const) {
          const [flat, full] = [filterStages(mode, slope, 0), filterStages(mode, slope, resonance)];
          expect(filterStagesAt(mode, slope, resonance, 5000)).toEqual(full);
          const top = filterStagesAt(mode, slope, resonance, 20000);
          const between = filterStagesAt(mode, slope, resonance, 20000 / 2 ** 0.25);
          for (const k of [0, 1]) {
            expect(top[k].Q).toBeCloseTo(flat[k].Q, 9);
            expect(between[k].Q).toBeCloseTo((flat[k].Q + full[k].Q) / 2, 9);
          }
        }
        for (const mode of ['bandpass', 'notch'] as const) expect(filterStagesAt(mode, slope, resonance, 20000)).toEqual(filterStages(mode, slope, resonance));
      }
  });

  it('lets a high-pass fall silent over the last semitone under 20 kHz, and every other Mode through', () => {
    expect(filterLevel('highpass', 20000)).toBe(0);
    expect(filterLevel('highpass', 20000 / 2 ** (1 / 24))).toBeCloseTo(0.5, 9);
    expect(filterLevel('highpass', 20000 / 2 ** (1 / 12))).toBe(1);
    expect(filterLevel('highpass', 10000)).toBe(1);
    for (const mode of ['lowpass', 'bandpass', 'notch'] as const) expect(filterLevel(mode, 20000)).toBe(1);
  });

  it('gives the sound the fades the model has, read from the clamped Cutoff in cents over the span', () => {
    for (const hz of [20, 1000, 14000, 14142, 15000, 16818, 18000, 18877, 19200, 19500, 19800, 20000]) {
      expect(1 - shaped(RESONANCE_DIP, centsOverFloor(hz) / CUTOFF_SPAN), `${hz} Hz`).toBeCloseTo(topFade(hz), 4);
      expect(1 - shaped(LEVEL_DIP, centsOverFloor(hz) / CUTOFF_SPAN), `${hz} Hz`).toBeCloseTo(filterLevel('highpass', hz), 3);
    }
  });
});
