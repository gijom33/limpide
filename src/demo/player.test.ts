import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPatch } from '../patch/patch';
import { type DemoHost, octaveShowing, startDemo } from './player';
import type { Track } from './track';

// At 120 BPM a beat is half a second. After the 0.3 s lead-in: C3 at 0.3 s for 0.425 s, E3 at 0.8 s; the chord at 1.3 s.
const track: Track = {
  bpm: 120,
  parts: [
    { preset: 'Mono', phrase: 'C3:1 E3:1' },
    { preset: 'Poly', phrase: 'C3+E3:2' },
  ],
};

function fakeHost(voicesOf: Record<string, number>) {
  let clock = 0;
  let voices = 1;
  const calls: string[] = [];
  const host: DemoHost = {
    now: () => clock,
    load: (part) => {
      calls.push(`load ${part.preset}`);
      voices = voicesOf[part.preset];
      return { ...defaultPatch(), voices: voices as 1 | 4 };
    },
    voices: () => voices,
    setParam: (id, value) => calls.push(`${id}=${value.toFixed(0)}`),
    onMove: (id) => calls.push(`move ${id}`),
    noteOn: (note, _v, at) => calls.push(`on ${note} @${at.toFixed(3)}`),
    noteOff: (at) => calls.push(`off @${at.toFixed(3)}`),
    release: (note, at) => calls.push(`release ${note} @${at.toFixed(3)}`),
    onStep: (i) => calls.push(`step ${i}`),
    onNotes: (notes) => calls.push(`keys ${notes.join('+') || '-'}`),
    showOctave: (o) => calls.push(`octave ${o}`),
    onEnd: () => calls.push('end'),
  };
  /** Moves the clock on, then lets one tick run. */
  const advance = (s: number) => {
    clock += s;
    vi.advanceTimersByTime(40);
  };
  return { host, calls, advance, setVoices: (n: number) => (voices = n) };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('octaveShowing', () => {
  it('picks the octave whose 17 keys show the most of the phrase, the highest when tied', () => {
    expect(octaveShowing([48, 52, 55])).toBe(3); // C3 E3 G3: all on the C3 keyboard
    expect(octaveShowing([43, 48, 52, 55, 62])).toBe(3); // G2 C3 E3 G3 D4: four of five from C3; from C2 only three
    expect(octaveShowing([60])).toBe(4); // C4 alone: on the C4 keyboard, not at the top of the C3 one
  });
});

describe('the Demo player', () => {
  it('schedules Notes ahead of the clock, and loads the next Preset on the bar line, just before its first Note', () => {
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    const stop = startDemo(host, track);
    expect(calls.slice(0, 3)).toEqual(['load Mono', 'step 0', 'octave 3']);
    expect(calls.filter((c) => c.startsWith('on'))).toEqual([]); // nothing is handed over until it is near
    advance(0.2);
    expect(calls.filter((c) => c.startsWith('on') || c.startsWith('off'))).toEqual(['on 48 @0.300', 'off @0.725']);
    advance(0.9); // 1.1 s: the chord at 1.3 s is not near yet
    expect(calls).toContain('on 52 @0.800');
    expect(calls).not.toContain('load Poly');
    // 1.2 s: the chord is within the look-ahead, but its Preset waits for the bar line, so E3's Release still plays
    // on its own sound (issue 60): it loads 50 ms before, in time for the engine to have the chord.
    advance(0.1);
    expect(calls).not.toContain('load Poly');
    advance(0.08); // 1.28 s
    const next = calls.slice(calls.indexOf('load Poly'));
    expect(next.slice(0, 2)).toEqual(['load Poly', 'step 1']);
    // No gap: the chord starts where the first part ends. Both Notes start before either is released, by note.
    expect(next.filter((c) => /^(on|release) /.test(c))).toEqual(['on 48 @1.300', 'on 52 @1.300', 'release 48 @2.150', 'release 52 @2.150']);
    stop();
    expect(calls.at(-2)).toMatch(/^off @/);
  });

  it('takes a breath at the end of each part but the last: Notes still sounding then are released an eighth of a beat early', () => {
    const { host, calls, advance } = fakeHost({ A: 1, B: 1 });
    // C3, a sixteenth at 0.3 s, would end at 0.406 s; its part ends at 0.425 s, so it is let go at 0.3625 s.
    startDemo(host, { bpm: 120, parts: [{ preset: 'A', phrase: 'C3:.25' }, { preset: 'B', phrase: 'E3:.25' }] });
    for (let i = 0; i < 10; i++) advance(0.1);
    expect(calls).toContain('off @0.362'); // 0.3625, rounded down in binary
    expect(calls).toContain('off @0.531'); // the last part's Note keeps its length: 0.425 + 0.106
  });

  it('releases each Note the way the Voices set now call for, even when they change while it plays', () => {
    const { host, calls, advance, setVoices } = fakeHost({ Mono: 1, Poly: 4 });
    startDemo(host, track);
    advance(0.2);
    expect(calls).toContain('off @0.725'); // C3, on one Voice
    setVoices(4); // the person picks 4 Voices
    advance(0.5);
    expect(calls).toContain('release 52 @1.225'); // E3, by note
  });

  it('plays the track once, then ends by itself and hands nothing more to the engine', () => {
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    startDemo(host, track);
    for (let i = 0; i < 20; i++) advance(0.5);
    expect(calls).toContain('end');
    const before = calls.length;
    advance(5);
    vi.advanceTimersByTime(500);
    expect(calls.length).toBe(before);
    expect(calls.filter((c) => c.startsWith('load'))).toEqual(['load Mono', 'load Poly']);
  });

  it('turns a knob through its move on the look-ahead, then leaves it at the end value', () => {
    const { host, calls, advance } = fakeHost({ Sweep: 1 });
    startDemo(host, { bpm: 120, parts: [{ preset: 'Sweep', phrase: 'C3:2', moves: [{ id: 'cutoff', from: 200, to: 3200 }] }] });
    const cutoffs = () => calls.filter((c) => c.startsWith('cutoff=')).map((c) => Number(c.slice(7)));
    advance(0.15); // the part starts within the look-ahead: the Cutoff starts where the move says, before the Note
    expect(cutoffs().at(-1)).toBe(200);
    expect(calls).not.toContain('on 48 @0.300');
    advance(0.5); // 0.8 s on the look-ahead: halfway through the one-second part, two octaves of four in knob travel
    expect(cutoffs().at(-1)).toBe(800);
    advance(1);
    expect(cutoffs().at(-1)).toBe(3200);
    const after = cutoffs().length;
    advance(0.1);
    expect(cutoffs().length).toBe(after); // done: no more moves
  });

  it('jumps a knob on a bar line in time for that bar’s first Note', () => {
    const { host, calls, advance } = fakeHost({ Wobble: 1 });
    startDemo(host, { bpm: 120, parts: [{ preset: 'Wobble', phrase: 'A1:4 A1:4', moves: [{ id: 'lfoRate', to: 8, start: 4, end: 4 }] }] });
    for (let i = 0; i < 60 && !calls.includes('on 33 @2.300'); i++) advance(0.04);
    expect(calls.indexOf('lfoRate=8')).toBeGreaterThan(-1);
    expect(calls.indexOf('lfoRate=8')).toBeLessThan(calls.indexOf('on 33 @2.300'));
  });

  it('says which knob starts to move, once, the first listed when several start together', () => {
    const { host, calls, advance } = fakeHost({ Sweep: 1 });
    startDemo(host, {
      bpm: 120,
      parts: [{ preset: 'Sweep', phrase: 'C3:4', moves: [{ id: 'cutoff', to: 3000 }, { id: 'resonance', to: 1 }, { id: 'lfoRate', to: 5, start: 2 }] }],
    });
    for (let i = 0; i < 60; i++) advance(0.04);
    expect(calls.filter((c) => c.startsWith('move'))).toEqual(['move cutoff', 'move lfoRate']);
  });

  it('lights the keys of the Notes sounding now, and shows the octave the part lives in', () => {
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    const stop = startDemo(host, track);
    expect(calls).toContain('octave 3'); // C3 is MIDI 48: the piano's C is C3
    const keys = () => calls.filter((c) => c.startsWith('keys')).at(-1);
    advance(0.35); // C3 has started (at 0.3 s)
    expect(keys()).toBe('keys 48');
    advance(0.4); // C3 has ended (0.725 s), E3 not yet (0.8 s)
    expect(keys()).toBe('keys -');
    stop();
    expect(calls.at(-1)).toBe('keys -');
  });

  it('stops: no more Notes are handed over after stop', () => {
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    const stop = startDemo(host, track);
    stop();
    const before = calls.length;
    advance(5);
    vi.advanceTimersByTime(500);
    expect(calls.length).toBe(before);
  });
});
