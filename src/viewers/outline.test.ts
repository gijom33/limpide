import { describe, expect, it } from 'vitest';
import { aboveFloor, ringsToDraw, spectrumOutline } from './outline';

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

describe('aboveFloor: the Response Curve stops at the floor instead of lying along it', () => {
  it('draws down to the floor and lifts until the curve comes back', () => {
    // 100 is the floor; columns 3 to 5 lie on it.
    expect(aboveFloor([10, 20, 60, 100, 100, 100, 50, 30], 100)).toEqual([[0, 3], [5, 7]]);
  });
  it('draws a curve that never reaches the floor whole, and none of one that lies on it', () => {
    expect(aboveFloor([10, 20, 30], 100)).toEqual([[0, 2]]);
    expect(aboveFloor([100, 100, 100], 100)).toEqual([]);
  });
  it('starts a curve that rises from the floor at its last floor point', () => {
    expect(aboveFloor([100, 100, 40, 20], 100)).toEqual([[1, 3]]);
  });
});

describe('ringsToDraw: the Ideal Reference rings', () => {
  it('leaves out the rings theory puts below the floor, rather than lining them up along it', () => {
    expect(ringsToDraw([{ x: 10, y: 20 }, { x: 30, y: 60 }, { x: 50, y: 100 }, { x: 70, y: 100 }], 100, 6)).toEqual([0, 1]);
  });
  it('leaves out a ring closer than the gap to the last one drawn; one on the floor does not count', () => {
    expect(ringsToDraw([{ x: 10, y: 20 }, { x: 13, y: 30 }, { x: 18, y: 40 }], 100, 6)).toEqual([0, 2]);
    expect(ringsToDraw([{ x: 10, y: 100 }, { x: 13, y: 30 }], 100, 6)).toEqual([1]);
  });
});
