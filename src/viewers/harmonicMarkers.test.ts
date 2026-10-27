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

describe('harmonicMarkers on the Spectrum: a tick on every Harmonic, a label on each of the first seven', () => {
  // The owner, 2026-10-26: 5 and 7 went unlabelled while 15, 20, 27, 36 were; ticks stay on every Harmonic.
  it('labels the first seven Harmonics, each, a crowded label nudged clear of the one before, and no other', () => {
    const narrow = (f: number) => (Math.log10(f / 20) / 3) * 245; // the narrowest Spectrum, about 245 px
    const all = harmonicMarkers(440, { maxFrequency: 20000, xOf: narrow, minLabelGap: 6.5, labelUpTo: 7, labelAll: true }); // a digit and 1 px
    expect(all).toHaveLength(45); // every Harmonic up to 20 kHz keeps its tick
    expect(all.filter((m) => m.labelled).map((m) => m.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const markers = all.slice(0, 7);
    for (let i = 1; i < markers.length; i++) expect(markers[i].labelX - markers[i - 1].labelX).toBeGreaterThanOrEqual(6.5);
    expect(markers[6].labelX - narrow(440 * 7)).toBeLessThan(4); // nudged by a few pixels at most
  });
});
