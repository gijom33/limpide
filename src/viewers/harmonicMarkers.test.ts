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

  it('names an in-tune Harmonic without a cents offset', () => {
    const [first] = harmonicMarkers(440, { maxFrequency: 20000, xOf: logX, minLabelGap: 30 });
    expect(first.note).toBe('A4');
  });

  it('has nothing to mark before any Note has played', () => {
    expect(harmonicMarkers(0, { maxFrequency: 20000, xOf: logX, minLabelGap: 30 })).toEqual([]);
  });
});
