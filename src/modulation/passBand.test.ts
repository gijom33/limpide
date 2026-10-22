import { describe, expect, it } from 'vitest';
import { passBand } from './passBand';

const LIMITS = { min: 20, max: 20000 };

describe('passBand: the frequencies a Filter Mode lets through, for the Timeline', () => {
  it('is everything below the Cutoff for low-pass', () => {
    expect(passBand('lowpass', 1000, 1, LIMITS)).toEqual([[20, 1000]]);
  });

  it('is everything above the Cutoff for high-pass', () => {
    expect(passBand('highpass', 1000, 1, LIMITS)).toEqual([[1000, 20000]]);
  });

  it('is a band centred on the Cutoff for band-pass, as wide as its bandwidth in octaves', () => {
    const [[lo, hi]] = passBand('bandpass', 1000, 2, LIMITS);
    expect(lo).toBeCloseTo(500);
    expect(hi).toBeCloseTo(2000);
  });

  it('is everything except that band for notch', () => {
    const ranges = passBand('notch', 1000, 2, LIMITS);
    expect(ranges).toHaveLength(2);
    expect(ranges[0][0]).toBe(20);
    expect(ranges[0][1]).toBeCloseTo(500);
    expect(ranges[1][0]).toBeCloseTo(2000);
    expect(ranges[1][1]).toBe(20000);
  });

  it('stays within the audible range', () => {
    const [[lo, hi]] = passBand('bandpass', 15000, 2, LIMITS);
    expect(lo).toBeCloseTo(7500);
    expect(hi).toBe(20000);
  });
});
