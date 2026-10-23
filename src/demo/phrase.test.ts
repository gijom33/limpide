import { describe, expect, it } from 'vitest';
import { PRESET_GROUPS, PRESETS } from '../patch/presets';
import { noteNumber, parsePhrase, phraseLength } from './phrase';
import { TOUR } from './tour';

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
});

describe('the Demo tour', () => {
  it('visits every group once, in order, with a Preset from that group', () => {
    expect(TOUR.map((s) => s.group)).toEqual([...PRESET_GROUPS]);
    for (const stop of TOUR) {
      const preset = PRESETS.find((p) => p.name === stop.preset);
      expect(preset, stop.preset).toBeDefined();
      expect(preset!.group, stop.preset).toBe(stop.group);
    }
  });

  it('plays phrases that parse, last a few seconds, and never stack Notes on a one-Voice Preset', () => {
    for (const stop of TOUR) {
      const preset = PRESETS.find((p) => p.name === stop.preset)!;
      const events = parsePhrase(stop.phrase, stop.bpm);
      expect(events.length, stop.preset).toBeGreaterThan(0);
      const seconds = phraseLength(stop.phrase, stop.bpm);
      expect(seconds, stop.preset).toBeGreaterThanOrEqual(6); // four bars or so
      expect(seconds, stop.preset).toBeLessThanOrEqual(10);
      if (preset.patch.voices === 1) {
        const times = events.map((e) => e.time);
        expect(new Set(times).size, `${stop.preset}: chords need Voices`).toBe(times.length);
        for (let i = 1; i < events.length; i++) expect(events[i].time, `${stop.preset}: overlapping Notes`).toBeGreaterThanOrEqual(events[i - 1].time + events[i - 1].duration);
      }
    }
  });
});
