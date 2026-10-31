import { describe, expect, it } from 'vitest';
import { CALLING_SECONDS, createCallingPhrase } from './callingPhrase';

// B, E, A, D around the fourth octave (C4 = 60).
const B = 59;
const E = 64;
const A = 69;
const D = 62;

const play = (notes: number[], start = 0, gap = 0.4) => {
  const phrase = createCallingPhrase();
  return notes.map((note, i) => phrase.press(note, start + i * gap));
};

describe('the Notes that call the mascot (issue 115)', () => {
  it('B, E, A, D in that order, as in a bead of water, complete it on the D', () => {
    expect(play([B, E, A, D])).toEqual([false, false, false, true]);
  });

  it('counts the Notes in any octave', () => {
    expect(play([B + 12, E - 12, A + 12, D - 24])).toEqual([false, false, false, true]);
  });

  it('B, E, D, A does nothing, nor does the old C, A, D, E', () => {
    expect(play([B, E, D, A])).toEqual([false, false, false, false]);
    expect(play([60, A, D, E])).toEqual([false, false, false, false]);
  });

  it('a wrong Note in between starts it over, and a B there starts it again', () => {
    expect(play([B, E, 65, A, D])).toEqual([false, false, false, false, false]);
    expect(play([B, E, B, E, A, D]).at(-1)).toBe(true);
  });

  it('too slow from the first Note to the last does nothing', () => {
    expect(play([B, E, A, D], 0, CALLING_SECONDS / 3 + 0.01)).toEqual([false, false, false, false]);
    expect(play([B, E, A, D], 0, CALLING_SECONDS / 3 - 0.01).at(-1)).toBe(true);
  });

  it('completes again the next time, and not on a Note that only ends one', () => {
    const phrase = createCallingPhrase();
    const times = [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1];
    const done = [B, E, A, D, B, E, A, D].map((note, i) => phrase.press(note, times[i]));
    expect(done).toEqual([false, false, false, true, false, false, false, true]);
  });
});
