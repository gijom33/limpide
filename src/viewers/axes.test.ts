import { describe, expect, it } from 'vitest';
import { frequencyAxis, levelAxis } from './axes';

const W = 600;
const H = 200;

describe('frequency axis', () => {
  it('log: spans 20 Hz–20 kHz with equal width per decade', () => {
    const axis = frequencyAxis('log', W);
    expect(axis.xOf(20)).toBeCloseTo(0);
    expect(axis.xOf(20000)).toBeCloseTo(W);
    expect(axis.xOf(200)).toBeCloseTo(W / 3);
    expect(axis.xOf(2000)).toBeCloseTo((2 * W) / 3);
  });

  it('linear: spans 0–5 kHz so Harmonics sit evenly spaced, like a ladder', () => {
    const axis = frequencyAxis('linear', W);
    expect(axis.xOf(0)).toBe(0);
    expect(axis.xOf(2500)).toBe(W / 2);
    expect(axis.xOf(440 * 3) - axis.xOf(440 * 2)).toBeCloseTo(axis.xOf(440 * 2) - axis.xOf(440));
  });

  it('inverts x back to a frequency, for the hover readout', () => {
    for (const kind of ['log', 'linear'] as const) {
      const axis = frequencyAxis(kind, W);
      expect(axis.frequencyAt(axis.xOf(1234))).toBeCloseTo(1234, 6);
    }
  });

  it('tells which frequencies it shows', () => {
    expect(frequencyAxis('log', W).contains(15)).toBe(false);
    expect(frequencyAxis('linear', W).contains(6000)).toBe(false);
    expect(frequencyAxis('linear', W).contains(4000)).toBe(true);
  });
});

describe('level axis', () => {
  it('dB: 0 dB at the top, −100 dB at the bottom', () => {
    const axis = levelAxis('db', H, { topDb: 0 });
    expect(axis.yOf(0)).toBe(0);
    expect(axis.yOf(-50)).toBe(H / 2);
    expect(axis.yOf(-100)).toBe(H);
    expect(axis.yOf(-130)).toBe(H); // clamped
  });

  it('linear: amplitude, with the given level at the top', () => {
    const axis = levelAxis('linear', H, { topDb: -20 });
    expect(axis.yOf(-20)).toBeCloseTo(0);
    expect(axis.yOf(-20 - 6.0206)).toBeCloseTo(H / 2, 3); // half the amplitude, half the height
    expect(axis.yOf(-Infinity)).toBe(H);
  });

  it('inverts y back to a level, for the hover readout', () => {
    for (const kind of ['db', 'linear'] as const) {
      const axis = levelAxis(kind, H, { topDb: -20 });
      expect(axis.levelAt(axis.yOf(-35))).toBeCloseTo(-35, 6);
    }
  });
});
