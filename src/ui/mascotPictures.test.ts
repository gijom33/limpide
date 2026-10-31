import { describe, expect, it } from 'vitest';
import { TAILS } from './mascotPictures';

describe("the mascot's tails (issue 127)", () => {
  it('each Waveform and the straight tail: one unbroken line of pixels from the drop to the tip, in its rows', () => {
    for (const [shape, stages] of Object.entries(TAILS)) {
      const columns = Object.values(stages).flat().sort((a, b) => a[0] - b[0]);
      expect(columns.map(([x]) => x), shape).toEqual(Array.from({ length: 13 }, (_, i) => 9 + i));
      for (let i = 1; i < columns.length; i++) {
        const [, top, , height] = columns[i];
        const [, beforeTop, , beforeHeight] = columns[i - 1];
        // Each column touches the one before.
        expect(top <= beforeTop + beforeHeight && top + height >= beforeTop, `${shape} at column ${columns[i][0]}`).toBe(true);
      }
      expect(columns.every(([, y, , h]) => y >= 1 && y + h <= 11), shape).toBe(true);
    }
  });

  it('the square swings between two rows only; the sine through many', () => {
    const rows = (shape: keyof typeof TAILS) => new Set(Object.values(TAILS[shape]).flat().filter(([, , , h]) => h === 1).map(([, y]) => y));
    expect(rows('square').size).toBe(2);
    expect(rows('sine').size).toBeGreaterThan(4);
  });
});
