import { describe, expect, it } from 'vitest';
import { harmonicMarkers } from './harmonicMarkers';

const WIDTH = 600;
const logX = (f: number) => (Math.log(f / 20) / Math.log(1000)) * WIDTH;

describe('harmonicMarkers', () => {
  it('places a marker on every Harmonic below the top of the axis', () => {
    const markers = harmonicMarkers(1000, { maxFrequency: 20000, xOf: logX, minLabelGap: 30 });
    expect(markers.map((m) => m.n)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(markers[2]).toMatchObject({ n: 3, frequency: 3000, note: 'F#7 +23¢' });
  });

  it('labels the fundamental and low Harmonics, but not ones crowded together at the top of a log axis', () => {
    const markers = harmonicMarkers(110, { maxFrequency: 20000, xOf: logX, minLabelGap: 30 });
    const labelled = markers.filter((m) => m.labelled).map((m) => m.n);
    expect(labelled.slice(0, 3)).toEqual([1, 2, 3]);
    expect(labelled).not.toContain(50);
    for (let i = 1; i < labelled.length; i++) {
      expect(logX(110 * labelled[i]) - logX(110 * labelled[i - 1])).toBeGreaterThanOrEqual(30);
    }
  });

  it('leaves room on the right for the dB scale: no labels past it, though every Harmonic keeps its tick', () => {
    const all = harmonicMarkers(110, { maxFrequency: 20000, xOf: logX, minLabelGap: 30 });
    const kept = harmonicMarkers(110, { maxFrequency: 20000, xOf: logX, minLabelGap: 30, labelsEndAt: WIDTH - 50 });
    expect(kept.map((m) => m.n)).toEqual(all.map((m) => m.n));
    expect(kept.filter((m) => m.labelled && logX(m.frequency) > WIDTH - 50)).toEqual([]);
    expect(kept.filter((m) => m.labelled).length).toBeGreaterThan(3);
  });

  it('names an in-tune Harmonic without a cents offset', () => {
    const [first] = harmonicMarkers(440, { maxFrequency: 20000, xOf: logX, minLabelGap: 30 });
    expect(first.note).toBe('A4');
  });

  it('has nothing to mark before any Note has played', () => {
    expect(harmonicMarkers(0, { maxFrequency: 20000, xOf: logX, minLabelGap: 30 })).toEqual([]);
  });
});

describe('harmonicMarkers beside the Viewer’s name', () => {
  // Issue 49: SPECTRUM is printed in the top-left corner, where a low Note's first labels fell.
  const logX = (f: number) => (Math.log10(f / 20) / 3) * 600;
  const markers = harmonicMarkers(30, { maxFrequency: 20000, xOf: logX, minLabelGap: 22, labelsStartAt: 74, halfLabel: 8 }); // 30 Hz at x 35
  it('keeps the fundamental’s label, moved just past the name', () => {
    expect(markers[0].labelled).toBe(true);
    expect(markers[0].labelX).toBe(82);
  });
  it('labels no other Harmonic under the name, and none closer than the gap to the moved one', () => {
    for (const m of markers.slice(1).filter((m) => m.labelled)) {
      expect(logX(m.frequency) - 8).toBeGreaterThanOrEqual(74);
      expect(m.labelX - 82).toBeGreaterThanOrEqual(22);
    }
  });
});

describe('harmonicMarkers on the Spectrum: the first eight, every one labelled', () => {
  // The owner, 2026-10-26: past the 8th the ticks crowded into a comb, and 5 and 7 went unlabelled.
  it('marks only the first eight Harmonics and labels each, a crowded label nudged clear of the one before', () => {
    const narrow = (f: number) => (Math.log10(f / 20) / 3) * 245; // the narrowest Spectrum, about 245 px
    const markers = harmonicMarkers(440, { maxFrequency: 20000, xOf: narrow, minLabelGap: 6.5, count: 8, labelAll: true }); // a digit and 1 px
    expect(markers.map((m) => m.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(markers.every((m) => m.labelled)).toBe(true);
    for (let i = 1; i < markers.length; i++) expect(markers[i].labelX - markers[i - 1].labelX).toBeGreaterThanOrEqual(6.5);
    expect(markers[7].labelX - narrow(440 * 8)).toBeLessThan(4); // nudged by a few pixels at most
  });
});
