import { describe, expect, it } from 'vitest';
import { spectrumOutline } from './outline';

const FLOOR = -100;

describe('spectrumOutline: the Spectrum trace at the screen’s own resolution', () => {
  // 1 Hz bins; a linear axis of 10 Hz per CSS pixel, 100 pixels wide.
  const axis = { xOf: (f: number) => f / 10, contains: (f: number) => f > 0 && f < 1000 };
  const bins = (at: Record<number, number>) => Float32Array.from({ length: 1000 }, (_, f) => at[f] ?? FLOOR);

  it('has a column per device pixel, so a Retina screen gets twice the detail', () => {
    expect(spectrumOutline(bins({}), 1, axis, 100, 2)).toHaveLength(200);
    expect(spectrumOutline(bins({}), 1, axis, 100, 1)).toHaveLength(100);
  });

  it('keeps Harmonics 4 px apart as separate spikes, with the floor showing between them', () => {
    const outline = spectrumOutline(bins({ 100: -30, 140: -32, 180: -34 }), 1, axis, 100, 2);
    expect(outline[20]).toBe(-30); // 100 Hz → 10 px → column 20
    expect(outline[24]).toBe(FLOOR); // half way to the next
    expect(outline[28]).toBe(-32);
  });

  it('keeps Harmonics only 2 px apart separate too, as a Retina screen can show them', () => {
    const outline = spectrumOutline(bins({ 300: -30, 320: -32, 340: -34 }), 1, axis, 100, 2);
    expect(outline[62]).toBe(FLOOR); // between 300 and 320 Hz
    expect(outline[66]).toBe(FLOOR);
  });

  it('keeps Harmonics separate down to a single device pixel apart: as far as the screen can show', () => {
    const outline = spectrumOutline(bins({ 500: -30, 510: -32, 520: -34 }), 1, axis, 100, 2);
    expect(outline[100]).toBe(-30); // 500 Hz → column 100
    expect(outline[101]).toBe(FLOOR); // the one device pixel between 500 and 510 Hz
    expect(outline[102]).toBe(-32);
    expect(outline[103]).toBe(FLOOR);
  });
});
