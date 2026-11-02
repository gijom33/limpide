import { describe, expect, it } from 'vitest';
import { fitPiano, pianoNotes, whiteKeys } from './pianoKeys';

describe('the piano grows by whole keys into the room the header leaves it (issue 154)', () => {
  it('keeps its 10 white keys while they are under 44 px, sharing the room', () => {
    expect(fitPiano(331)).toEqual({ whites: 10, keyWidth: 33.1 });
    expect(fitPiano(425)).toEqual({ whites: 10, keyWidth: 42.5 });
  });

  it('never makes a key wider than 44 px: what is left over, under one key, stays empty', () => {
    expect(fitPiano(455)).toEqual({ whites: 10, keyWidth: 44 });
    expect(fitPiano(629)).toEqual({ whites: 14, keyWidth: 44 });
    expect(fitPiano(1109)).toEqual({ whites: 25, keyWidth: 44 });
  });

  it('adds a key once the room holds more than half of one, its keys then never under 42 px', () => {
    expect(fitPiano(461).whites).toBe(10);
    expect(fitPiano(462)).toEqual({ whites: 11, keyWidth: 42 });
    for (let room = 440; room < 1400; room++) {
      const { whites, keyWidth } = fitPiano(room);
      expect(whites * keyWidth).toBeLessThanOrEqual(room);
      if (whites > 10) expect(keyWidth).toBeGreaterThanOrEqual(42);
    }
  });
});

describe('the keys beyond the letter keys (issue 154)', () => {
  it('are the 17 letter keys, C to the E above, with 10 white keys', () => {
    expect(pianoNotes(4, 10)).toEqual(Array.from({ length: 17 }, (_, i) => 60 + i));
  });

  it('go on upward a white key at a time, with the black keys between', () => {
    expect(pianoNotes(4, 11)).toEqual([...pianoNotes(4, 10), 77]); // F5
    expect(pianoNotes(4, 12)).toEqual([...pianoNotes(4, 10), 77, 78, 79]); // F5, F♯5, G5
    expect(pianoNotes(4, 14).at(-1)).toBe(83); // B5
    expect(pianoNotes(4, 25)).toHaveLength(42);
  });

  it('follow the octave buttons', () => {
    expect(pianoNotes(2, 11)).toEqual(pianoNotes(4, 11).map((n) => n - 24));
  });

  it('stop at the highest MIDI Note, on a white key', () => {
    const top = pianoNotes(7, 25);
    expect(top.at(-1)).toBe(127); // G9
    expect(Math.max(...top)).toBe(127);
  });

  it('are counted as they are drawn: fewer white keys near the top than the room holds', () => {
    expect(whiteKeys(4, 25)).toBe(25);
    expect(whiteKeys(7, 25)).toBe(19); // C7 to G9
    expect(whiteKeys(7, 10)).toBe(10);
  });
});
