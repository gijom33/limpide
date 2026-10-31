import { describe, expect, it } from 'vitest';
import { CALLING_SECONDS, createCallingPhrase } from './callingPhrase';

// C4 = 60: C, A, D, E in the fourth octave.
const C = 60;
const A = 69;
const D = 62;
const E = 64;

const play = (notes: number[], start = 0, gap = 0.4) => {
  const phrase = createCallingPhrase();
  return notes.map((note, i) => phrase.press(note, start + i * gap));
};

describe('the Notes that call the mascot (issue 115)', () => {
  it('C, A, D, E in that order complete it on the E', () => {
    expect(play([C, A, D, E])).toEqual([false, false, false, true]);
  });

  it('counts the Notes in any octave', () => {
    expect(play([C - 12, A + 12, D, E - 24])).toEqual([false, false, false, true]);
  });

  it('C, A, E, D does nothing', () => {
    expect(play([C, A, E, D])).toEqual([false, false, false, false]);
  });

  it('a wrong Note in between starts it over, and a C there starts it again', () => {
    expect(play([C, A, 65, D, E])).toEqual([false, false, false, false, false]);
    expect(play([C, A, C, A, D, E]).at(-1)).toBe(true);
  });

  it('too slow from the first Note to the last does nothing', () => {
    expect(play([C, A, D, E], 0, CALLING_SECONDS / 3 + 0.01)).toEqual([false, false, false, false]);
    expect(play([C, A, D, E], 0, CALLING_SECONDS / 3 - 0.01).at(-1)).toBe(true);
  });

  it('completes again the next time, and not on a Note that only ends one', () => {
    const phrase = createCallingPhrase();
    const times = [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1];
    const done = [C, A, D, E, C, A, D, E].map((note, i) => phrase.press(note, times[i]));
    expect(done).toEqual([false, false, false, true, false, false, false, true]);
  });
});
