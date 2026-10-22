import { describe, expect, it } from 'vitest';
import { ghostRegions } from './ghost';

const OPTIONS = { floorDb: -90, thresholdDb: 1 };
const spectrum = (...db: number[]) => Float32Array.from(db);

describe('Ghost: what the Filter took away', () => {
  it('is empty when the Filter changed nothing', () => {
    const s = spectrum(-20, -30, -40);
    expect(ghostRegions(s, s, OPTIONS)).toEqual({ removed: [], boosted: [] });
  });

  it('spans from the Oscillator level down to the Filter level wherever energy was removed', () => {
    const { removed } = ghostRegions(spectrum(-20, -26, -30), spectrum(-20, -40, -54), OPTIONS);
    expect(removed).toEqual([
      { column: 1, from: -26, to: -40 },
      { column: 2, from: -30, to: -54 },
    ]);
  });

  it('shows Resonance adding energy as a boost, not as a Ghost', () => {
    const { removed, boosted } = ghostRegions(spectrum(-30), spectrum(-22), OPTIONS);
    expect(removed).toEqual([]);
    expect(boosted).toEqual([{ column: 0, from: -30, to: -22 }]);
  });

  it('ignores columns where the Oscillator had nothing to remove (gaps between Harmonics)', () => {
    expect(ghostRegions(spectrum(-95), spectrum(-120), OPTIONS).removed).toEqual([]);
  });

  it('ignores differences smaller than the threshold (frame-to-frame jitter)', () => {
    expect(ghostRegions(spectrum(-30), spectrum(-30.6), OPTIONS).removed).toEqual([]);
  });

  it('only compares the columns that hold a Harmonic, so leakage in the valleys between them never shades', () => {
    // Column 1 is a valley: the Filter Tap's floor sits higher there from a resonant peak's window leakage.
    const oscillator = spectrum(-30, -85, -36);
    const filter = spectrum(-30, -70, -50);
    expect(ghostRegions(oscillator, filter, { ...OPTIONS, columns: [0, 2] })).toEqual({
      removed: [{ column: 2, from: -36, to: -50 }],
      boosted: [],
    });
  });

  it('stops a fully removed Harmonic at the floor instead of running to −∞', () => {
    expect(ghostRegions(spectrum(-40), spectrum(-Infinity), OPTIONS).removed).toEqual([{ column: 0, from: -40, to: -90 }]);
  });
});
