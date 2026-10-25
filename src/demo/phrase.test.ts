import { describe, expect, it } from 'vitest';
import { noteNumber, parsePhrase, phraseLength } from './phrase';

describe('noteNumber', () => {
  it('reads Note names with C4 at 60 and A4 at 69', () => {
    expect(noteNumber('C4')).toBe(60);
    expect(noteNumber('A4')).toBe(69);
    expect(noteNumber('F#2')).toBe(42);
    expect(noteNumber('Bb3')).toBe(58);
    expect(() => noteNumber('H2')).toThrow(/Note name/);
  });
});

describe('parsePhrase', () => {
  it('places Notes on beats at the tempo, held a little short of their step', () => {
    const events = parsePhrase('C3:1 -:1 E3+G3:2', 120);
    expect(events.map((e) => [e.note, e.time, +e.duration.toFixed(3)])).toEqual([
      [48, 0, 0.425],
      [52, 1, 0.85],
      [55, 1, 0.85],
    ]);
    expect(phraseLength('C3:1 -:1 E3+G3:2', 120)).toBe(2);
  });

  it('refuses a step without a length', () => {
    expect(() => parsePhrase('C3', 120)).toThrow(/length in beats/);
  });

  it('reads an accent or a soft touch after @, and keeps the phrase length', () => {
    const events = parsePhrase('C3:1@0.5 E3:1', 120);
    expect(events.map((e) => e.velocity)).toEqual([0.5, 0.9]);
    expect(phraseLength('C3:1@0.5 E3:1', 120)).toBe(1);
    expect(() => parsePhrase('C3:1@2', 120)).toThrow(/between 0 and 1/);
  });
});
