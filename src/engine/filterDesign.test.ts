import { describe, expect, it } from 'vitest';
import { filterStages, resonanceToQdB } from './filterDesign';

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
