import { describe, expect, it } from 'vitest';
import { SKY, skyLift, TAILS } from './mascotPictures';

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

describe('the sun and the cloud, farther above it (issue 237)', () => {
  /** How high a sky picture's middle is over Bead's foot (row 13), in grid squares. */
  const over = (prop: 'sun' | 'cloud') => {
    const rects = SKY[prop]![0][1];
    const top = Math.min(...rects.map(([, y]) => y));
    const bottom = Math.max(...rects.map(([, y, , h]) => y + h));
    return 13 - (top + bottom) / 2;
  };

  it('with room, about twice as far above its foot as SKY draws them (issue 237)', () => {
    for (const prop of ['sun', 'cloud'] as const) {
      const ratio = (over(prop) + skyLift(prop, 100)) / over(prop);
      expect(ratio, prop).toBeGreaterThan(1.8);
      expect(ratio, prop).toBeLessThan(2.2);
    }
  });

  it('near the top, as far as fits under it, in whole squares; with no room, where SKY draws them (issue 237)', () => {
    // The sun's top is 15 squares over its foot, the cloud's 17.
    expect(skyLift('sun', 20)).toBe(5);
    expect(skyLift('cloud', 20)).toBe(3);
    expect(skyLift('cloud', 20.7)).toBe(3);
    expect(skyLift('sun', 12)).toBe(0);
    expect(skyLift('cloud', 30)).toBe(skyLift('cloud', 100));
  });

  it('nothing else is lifted (issue 237)', () => {
    expect(skyLift('umbrella', 100)).toBe(0);
    expect(skyLift('none', 100)).toBe(0);
  });
});
