import { describe, expect, it } from 'vitest';
import type { Played } from '../play/transport';
import { loopPhrase, noteNumber, parsePhrase, phraseLength } from './phrase';

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

describe('loopPhrase (issue 75)', () => {
  // At 120 BPM a beat is half a second: C4 for a beat (held 0.425 s), E4 for a sixteenth (held 0.106 s); a pass is 0.625 s.
  const due = (source: ReturnType<typeof loopPhrase>, horizon: number) => {
    const notes: Played[] = [];
    source(horizon, 0, (n) => notes.push(...n));
    return notes;
  };

  it('loops the phrase without a gap, each pass one phrase after the last, handing only what is due', () => {
    const source = loopPhrase('C4:1 E4:.25', 120, 1);
    expect(due(source, 1.4).map((n) => [n.note, n.on])).toEqual([[60, 1]]);
    expect(due(source, 2.2).map((n) => [n.note, n.on])).toEqual([[64, 1.5], [60, 1.625], [64, 2.125]]);
  });

  it('lets go of a Note still sounding a breath before each pass ends', () => {
    const source = loopPhrase('C4:1 E4:.25', 120, 0, { breath: 1 / 8 });
    // E4 would end at 0.606 s; the pass ends at 0.625 s, so it is let go at 0.5625 s. C4 ends as written.
    expect(due(source, 0.6).map((n) => n.off)).toEqual([0.425, 0.5625]);
  });

  it('transposes each Note as it falls due', () => {
    let shift = 0;
    const source = loopPhrase('C4:1 E4:1', 120, 0, { transpose: () => shift });
    expect(due(source, 0.1)[0].note).toBe(60);
    shift = 12;
    expect(due(source, 0.6)[0].note).toBe(76);
  });
});
