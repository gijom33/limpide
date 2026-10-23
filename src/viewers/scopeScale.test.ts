import { describe, expect, it } from 'vitest';
import { scopeScale } from './scopeScale';

const HEIGHT = 200; // half-height 100
const { yOf } = scopeScale(HEIGHT);
const fromCentre = (v: number) => HEIGHT / 2 - yOf(v); // upwards, in pixels

describe('Scope scale', () => {
  it('puts zero in the middle, and is the same both ways', () => {
    expect(yOf(0)).toBe(100);
    for (const v of [0.3, 1, 1.6, 5]) expect(fromCentre(-v)).toBeCloseTo(-fromCentre(v));
  });

  it('is linear up to ±1, which sits at 80 % of the half-height, so everyday signals keep their true shape', () => {
    expect(fromCentre(1)).toBeCloseTo(80);
    expect(fromCentre(0.5)).toBeCloseTo(40);
    expect(fromCentre(0.25)).toBeCloseTo(20);
  });

  it('shows peaks beyond ±1 in the margin, still in order (a bigger peak draws higher), never past the edge', () => {
    const ys = [1, 1.2, 1.5, 1.8, 2.5, 4, 100].map(fromCentre);
    for (let i = 1; i < ys.length; i++) expect(ys[i], `step ${i}`).toBeGreaterThan(ys[i - 1]);
    expect(ys.at(-1)).toBeLessThanOrEqual(100);
    // A typical resonant peak (±1.8) is plainly above ±1, not squashed against it.
    expect(fromCentre(1.8) - fromCentre(1)).toBeGreaterThan(10);
  });

  it('joins the two parts smoothly at ±1 (no kink: the slope carries on)', () => {
    const slopeBelow = fromCentre(1) - fromCentre(0.99);
    const slopeAbove = fromCentre(1.01) - fromCentre(1);
    expect(slopeAbove / slopeBelow).toBeCloseTo(1, 1);
  });
});
