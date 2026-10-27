import { describe, expect, it } from 'vitest';
import { positionToValue, valueToPosition } from './taper';

const cutoff = { min: 20, max: 20000, taper: 'log' } as const;
const level = { min: 0, max: 100, taper: 'linear' } as const;

describe('log Taper', () => {
  it('spans the range end to end', () => {
    expect(positionToValue(cutoff, 0)).toBeCloseTo(20);
    expect(positionToValue(cutoff, 1)).toBeCloseTo(20000);
  });

  it('puts the geometric mean at the middle, so every octave gets equal travel', () => {
    expect(positionToValue(cutoff, 0.5)).toBeCloseTo(632.456, 2);
    expect(positionToValue(cutoff, 1 / 3)).toBeCloseTo(200, 6);
  });

  it('inverts back to the knob position', () => {
    expect(valueToPosition(cutoff, 200)).toBeCloseTo(1 / 3, 9);
  });
});

describe('linear Taper', () => {
  it('maps proportionally and inverts', () => {
    expect(positionToValue(level, 0.25)).toBe(25);
    expect(valueToPosition(level, 75)).toBe(0.75);
  });
});

describe('out-of-range input', () => {
  it('clamps positions and values to the range', () => {
    expect(positionToValue(level, 1.5)).toBe(100);
    expect(valueToPosition(cutoff, 5)).toBe(0);
  });
});

describe('the square taper (Glide)', () => {
  const glide = { min: 0.001, max: 2, taper: 'square' as const };
  it('starts slowly: a fifth of the travel is about 80 ms, half is about half a second', () => {
    expect(positionToValue(glide, 0)).toBe(0.001);
    expect(positionToValue(glide, 0.2)).toBeCloseTo(0.081, 3);
    expect(positionToValue(glide, 0.5)).toBeCloseTo(0.501, 3);
    expect(positionToValue(glide, 1)).toBe(2);
  });
  it('turns back into the same position', () => {
    for (const p of [0, 0.1, 0.37, 0.8, 1]) expect(valueToPosition(glide, positionToValue(glide, p))).toBeCloseTo(p, 9);
  });
});
