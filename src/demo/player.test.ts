import { describe, expect, it, vi } from 'vitest';
import { defaultPatch } from '../patch/patch';
import { octaveShowing, startDemo, type DemoHost } from './player';
import type { TourStop } from './tour';

const tour: TourStop[] = [
  { group: 'Start', preset: 'Mono', bpm: 120, phrase: 'C3:1 E3:1' },
  { group: 'Chords', preset: 'Poly', bpm: 120, phrase: 'C3+E3:1' },
];

function fakeHost(voicesOf: Record<string, number>) {
  let clock = 0;
  let voices = 1;
  const calls: string[] = [];
  const host: DemoHost = {
    now: () => clock,
    load: (stop) => {
      calls.push(`load ${stop.preset}`);
      voices = voicesOf[stop.preset];
      return { ...defaultPatch(), voices: voices as 1 | 4 };
    },
    voices: () => voices,
    setParam: (id, value) => calls.push(`${id}=${value.toFixed(0)}`),
    noteOn: (note, _v, at) => calls.push(`on ${note} @${at.toFixed(3)}`),
    noteOff: (at) => calls.push(`off @${at.toFixed(3)}`),
    release: (note, at) => calls.push(`release ${note} @${at.toFixed(3)}`),
    onStep: (i) => calls.push(`step ${i}`),
    onNotes: (notes) => calls.push(`keys ${notes.join('+') || '-'}`),
    showOctave: (o) => calls.push(`octave ${o}`),
    onEnd: () => calls.push('end'),
  };
  return { host, calls, advance: (s: number) => (clock += s), setVoices: (n: number) => (voices = n) };
}

describe('octaveShowing', () => {
  it('picks the octave whose 17 keys show the most of the phrase, the highest when tied', () => {
    expect(octaveShowing([48, 52, 55])).toBe(3); // C3 E3 G3: all on the C3 keyboard
    expect(octaveShowing([43, 48, 52, 55, 62])).toBe(3); // G2 C3 E3 G3 D4: four of five from C3; from C2 only three
    expect(octaveShowing([60])).toBe(4); // C4 alone: on the C4 keyboard, not at the top of the C3 one
  });
});

describe('the Demo player', () => {
  it('loads each Preset in turn, schedules its Notes ahead of the clock, and goes round', () => {
    vi.useFakeTimers();
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    const stop = startDemo(host, tour);
    expect(calls.slice(0, 2)).toEqual(['load Mono', 'step 0']);
    // Phrase at 120 BPM after a 0.3 s lead-in: C3 at 0.3 s for 0.425 s, E3 at 0.8 s. Nothing is handed over until it is near.
    expect(calls.filter((c) => c.startsWith('on'))).toEqual([]);
    advance(0.2);
    vi.advanceTimersByTime(40);
    expect(calls.filter((c) => c.startsWith('on') || c.startsWith('off'))).toEqual(['on 48 @0.300', 'off @0.725']);
    advance(1.8); // past the lead-in, the phrase (1 s) and the gap
    vi.advanceTimersByTime(40);
    expect(calls).toContain('on 52 @0.800');
    expect(calls.slice(-3)).toEqual(['load Poly', 'step 1', 'octave 3']);
    // A chord on a several-Voice Preset: both Notes start before either is released, by note.
    advance(0.4);
    vi.advanceTimersByTime(40);
    const chord = calls.slice(calls.indexOf('step 1') + 1).filter((c) => /^(on|release) /.test(c));
    expect(chord.map((c) => c.split(' ')[0])).toEqual(['on', 'on', 'release', 'release']);
    stop();
    expect(calls.at(-2)).toMatch(/^off @/);
    vi.useRealTimers();
  });

  it('releases each Note the way the Voices set now call for, even when they change while the phrase plays', () => {
    vi.useFakeTimers();
    const { host, calls, advance, setVoices } = fakeHost({ Mono: 1, Poly: 4 });
    startDemo(host, tour);
    advance(0.2);
    vi.advanceTimersByTime(40);
    expect(calls).toContain('off @0.725'); // C3, on one Voice
    setVoices(4); // the person picks 4 Voices
    advance(0.5);
    vi.advanceTimersByTime(40);
    expect(calls).toContain('release 52 @1.225'); // E3, by note
    vi.useRealTimers();
  });

  it('plays the tour once, then ends by itself and hands nothing more to the engine', () => {
    vi.useFakeTimers();
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    startDemo(host, tour);
    for (let i = 0; i < 20; i++) {
      advance(0.5);
      vi.advanceTimersByTime(40);
    }
    expect(calls).toContain('end');
    const before = calls.length;
    advance(5);
    vi.advanceTimersByTime(500);
    expect(calls.length).toBe(before);
    expect(calls.filter((c) => c.startsWith('load'))).toEqual(['load Mono', 'load Poly']);
    vi.useRealTimers();
  });

  it('turns a knob through its move while the phrase plays, then leaves it at the end value', () => {
    vi.useFakeTimers();
    const { host, calls, advance } = fakeHost({ Sweep: 1 });
    startDemo(host, [{ group: 'Filter', preset: 'Sweep', bpm: 120, phrase: 'C3:2', moves: [{ id: 'cutoff', from: 200, to: 3200 }] }]);
    const cutoffs = () => calls.filter((c) => c.startsWith('cutoff=')).map((c) => Number(c.slice(7)));
    advance(0.3); // the phrase starts: the Cutoff starts where the move says
    vi.advanceTimersByTime(40);
    expect(cutoffs().at(-1)).toBe(200);
    advance(0.5); // halfway through the one-second phrase: halfway up in knob travel, two octaves of four
    vi.advanceTimersByTime(40);
    expect(cutoffs().at(-1)).toBe(800);
    advance(1);
    vi.advanceTimersByTime(40);
    expect(cutoffs().at(-1)).toBe(3200);
    const after = cutoffs().length;
    advance(0.1);
    vi.advanceTimersByTime(40);
    expect(cutoffs().length).toBe(after); // done: no more moves
    vi.useRealTimers();
  });

  it('lights the keys of the Notes sounding now, and shows the octave the phrase lives in', () => {
    vi.useFakeTimers();
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    const stop = startDemo(host, tour);
    expect(calls).toContain('octave 3'); // C3 is MIDI 48: the piano's C is C3
    const keys = () => calls.filter((c) => c.startsWith('keys')).at(-1);
    advance(0.35); // C3 has started (at 0.3 s)
    vi.advanceTimersByTime(40);
    expect(keys()).toBe('keys 48');
    advance(0.4); // C3 has ended (0.725 s), E3 not yet (0.8 s)
    vi.advanceTimersByTime(40);
    expect(keys()).toBe('keys -');
    stop();
    expect(calls.at(-1)).toBe('keys -');
    vi.useRealTimers();
  });

  it('stops: no more Notes are handed over after stop', () => {
    vi.useFakeTimers();
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    const stop = startDemo(host, tour);
    stop();
    const before = calls.length;
    advance(5);
    vi.advanceTimersByTime(500);
    expect(calls.length).toBe(before);
    vi.useRealTimers();
  });
});
