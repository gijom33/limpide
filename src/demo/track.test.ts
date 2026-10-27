import { describe, expect, it } from 'vitest';
import { PARAMS } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { SECTION_OF } from '../ui/sections';
import { parsePhrase, phraseLength } from './phrase';
import { SHARED_RIFF, TRACK } from './track';

const bars = (phrase: string, bpm = TRACK.bpm) => phraseLength(phrase, bpm) / ((60 / bpm) * 4);
const preset = (name: string) => PRESETS.find((p) => p.name === name);

/** No two Notes sound at once: what a one-Voice Patch can play as written. */
function oneAtATime(phrase: string) {
  const events = parsePhrase(phrase, TRACK.bpm);
  const times = events.map((e) => e.time);
  if (new Set(times).size !== times.length) return false;
  return events.every((e, i) => i === 0 || e.time >= events[i - 1].time + events[i - 1].duration);
}

describe('the Demo track', () => {
  it('is about two minutes of music (issue 60), every part whole bars, so each Preset lands on a bar line', () => {
    const seconds = TRACK.parts.reduce((s, part) => s + phraseLength(part.phrase, TRACK.bpm), 0);
    expect(seconds).toBeGreaterThanOrEqual(110);
    expect(seconds).toBeLessThanOrEqual(130);
    for (const part of TRACK.parts) expect(Number.isInteger(bars(part.phrase)), `${part.preset}: ${bars(part.phrase)} bars`).toBe(true);
  });

  it('plays a different Preset in every part, chords on several Voices and never on one', () => {
    // The hook, Poly Pluck, comes back once, brighter (issue 60); every other part has its own Preset.
    const names = TRACK.parts.map((p) => p.preset);
    expect(names.filter((n) => n === 'Poly Pluck')).toHaveLength(2);
    expect(new Set(names).size).toBe(names.length - 1);
    for (const part of TRACK.parts) {
      expect(preset(part.preset), part.preset).toBeDefined();
      if (preset(part.preset)!.patch.voices === 1) expect(oneAtATime(part.phrase), `${part.preset}: chords need Voices`).toBe(true);
    }
    expect(TRACK.parts.filter((p) => preset(p.preset)!.patch.voices > 1).length).toBeGreaterThanOrEqual(2);
  });

  it('turns knobs in every part, on the knob and within the part, through every section', () => {
    for (const part of TRACK.parts) {
      expect(part.moves?.length, part.preset).toBeGreaterThan(0);
      const beats = bars(part.phrase) * 4;
      for (const m of part.moves!) {
        const { min, max } = PARAMS[m.id];
        for (const v of [m.from, m.to]) if (v !== undefined) expect(v >= min && v <= max, `${part.preset}: ${m.id} ${v} is off the knob`).toBe(true);
        expect((m.start ?? 0) <= (m.end ?? beats) && (m.end ?? beats) <= beats, `${part.preset}: ${m.id} runs outside the part`).toBe(true);
      }
    }
    const sections = new Set(TRACK.parts.flatMap((p) => p.moves!.map((m) => SECTION_OF[m.id])));
    expect([...sections].sort()).toEqual(['Amp', 'Filter', 'LFO & Envelopes', 'Oscillators']);
  });

  it('says what each part shows, in plain words', () => {
    for (const part of TRACK.parts) expect(part.caption?.length, part.preset).toBeGreaterThan(30);
  });

  it('starts with a Kick a phone can play: its first hit’s Filter peaks well above a phone speaker’s lowest Note', () => {
    const [intro] = TRACK.parts;
    const kick = preset(intro.preset)!.patch;
    const amount = intro.moves!.find((m) => m.id === 'filterEnvAmount')!.from!;
    expect(kick.cutoff * 2 ** amount).toBeGreaterThanOrEqual(400);
  });

  it('has a riff for a shared sound: whole bars, one Note at a time, so it plays on any Patch', () => {
    expect(Number.isInteger(bars(SHARED_RIFF))).toBe(true);
    expect(oneAtATime(SHARED_RIFF)).toBe(true);
  });
});

describe('issue 60', () => {
  it('plays Tremolo Keys, an LFO on Volume, between the Strings and the riser; a Sweep Pad break and the hook again before the end', () => {
    expect(TRACK.parts.map((p) => p.preset)).toEqual([
      'Kick', 'Acid', 'Poly Pluck', 'Strings', 'Tremolo Keys', 'Self-Oscillation', 'Wobble', 'Sweep Pad', 'Poly Pluck', 'Brass Section',
    ]);
    expect(preset('Tremolo Keys')!.patch.lfoDestination).toBe('volume');
  });
});

