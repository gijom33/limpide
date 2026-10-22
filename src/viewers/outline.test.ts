import { describe, expect, it } from 'vitest';
import { closeGaps } from './outline';

const FLOOR = -100;
/** A spectrum with spikes (dB) at the given columns, floor elsewhere. */
const spikes = (length: number, at: Record<number, number>) => Float32Array.from({ length }, (_, i) => at[i] ?? FLOOR);

describe('closeGaps: a smooth outline over crowded Harmonics', () => {
  it('fills the narrow valleys between crowded Harmonics, at the lower neighbour’s level', () => {
    const outline = closeGaps(spikes(12, { 3: -40, 6: -44, 9: -48 }), 3);
    expect(outline[4]).toBeCloseTo(-44); // between −40 and −44
    expect(outline[5]).toBeCloseTo(-44);
    expect(outline[7]).toBeCloseTo(-48);
  });

  it('keeps Harmonics that sit far apart as separate spikes, with the floor between them', () => {
    const outline = closeGaps(spikes(30, { 5: -30, 20: -36 }), 3);
    expect(outline[12]).toBe(FLOOR);
    expect(outline[5]).toBe(-30);
    expect(outline[20]).toBe(-36);
  });

  it('never rises above the strongest real value nearby, so it can’t invent energy', () => {
    const input = spikes(40, { 2: -50, 4: -42, 7: -47, 9: -41, 25: -60 });
    const outline = closeGaps(input, 3);
    for (let i = 0; i < input.length; i++) {
      const nearby = Math.max(...input.slice(Math.max(0, i - 6), i + 7)); // within twice the radius
      expect(outline[i]).toBeGreaterThanOrEqual(input[i]);
      expect(outline[i]).toBeLessThanOrEqual(nearby);
    }
  });

  it('keeps each locally strongest Harmonic at exactly its height (a weaker one squeezed between is a dip, and is covered)', () => {
    const input = spikes(20, { 4: -40, 6: -52, 8: -45 });
    const outline = closeGaps(input, 3);
    expect(outline[4]).toBe(-40);
    expect(outline[8]).toBe(-45);
    expect(outline[6]).toBe(-45);
  });

  it('handles the edges without inventing a wall', () => {
    const outline = closeGaps(spikes(6, { 0: -30 }), 3);
    expect(outline[5]).toBe(FLOOR);
  });
});
