import { describe, expect, it } from 'vitest';
import { PRESET_GROUPS, PRESETS } from '../patch/presets';
import { PARAMS } from '../patch/patch';
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

  it('reads an accent or a soft touch after @, and keeps the phrase length', () => {
    const events = parsePhrase('C3:1@0.5 E3:1', 120);
    expect(events.map((e) => e.velocity)).toEqual([0.5, 0.9]);
    expect(phraseLength('C3:1@0.5 E3:1', 120)).toBe(1);
    expect(() => parsePhrase('C3:1@2', 120)).toThrow(/between 0 and 1/);
  });
});

describe('the Demo tour', () => {
  it('visits every group in order, with Presets from that group, and several of the polyphonic ones', () => {
    const groups = TOUR.map((s) => s.group);
    expect([...new Set(groups)]).toEqual([...PRESET_GROUPS]); // every group, in order, contiguous
    expect(groups).toEqual([...groups].sort((a, b) => PRESET_GROUPS.indexOf(a) - PRESET_GROUPS.indexOf(b)));
    expect(TOUR.filter((s) => PRESETS.find((p) => p.name === s.preset)!.patch.voices > 1).length).toBeGreaterThanOrEqual(6);
    for (const stop of TOUR) {
      const preset = PRESETS.find((p) => p.name === stop.preset);
      expect(preset, stop.preset).toBeDefined();
      expect(preset!.group, stop.preset).toBe(stop.group);
    }
  });

  it('moves at least a few knobs along the way, so the tour is seen as well as heard', () => {
    expect(TOUR.filter((s) => s.moves?.length).length).toBeGreaterThanOrEqual(6);
  });

  it('plays phrases that parse, last a few seconds, and never stack Notes on a one-Voice Preset', () => {
    for (const stop of TOUR) {
      const preset = PRESETS.find((p) => p.name === stop.preset)!;
      const events = parsePhrase(stop.phrase, stop.bpm);
      expect(events.length, stop.preset).toBeGreaterThan(0);
      const seconds = phraseLength(stop.phrase, stop.bpm);
      expect(seconds, stop.preset).toBeGreaterThanOrEqual(3); // two bars or so
      expect(seconds, stop.preset).toBeLessThanOrEqual(6);
      for (const m of stop.moves ?? []) {
        const { min, max } = PARAMS[m.id];
        for (const v of [m.from, m.to]) if (v !== undefined) expect(v >= min && v <= max, `${stop.preset}: ${m.id} ${v} is off the knob`).toBe(true);
        if (m.end !== undefined) expect(m.end * (60 / stop.bpm), `${stop.preset}: ${m.id} ends after the phrase`).toBeLessThanOrEqual(seconds + 1e-9);
      }
      if (preset.patch.voices === 1) {
        const times = events.map((e) => e.time);
        expect(new Set(times).size, `${stop.preset}: chords need Voices`).toBe(times.length);
        for (let i = 1; i < events.length; i++) expect(events[i].time, `${stop.preset}: overlapping Notes`).toBeGreaterThanOrEqual(events[i - 1].time + events[i - 1].duration);
      }
    }
  });
});
