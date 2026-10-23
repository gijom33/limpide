import { describe, expect, it, vi } from 'vitest';
import { startDemo, type DemoHost } from './player';
import type { TourStop } from './tour';

const tour: TourStop[] = [
  { group: 'Start', preset: 'Mono', bpm: 120, phrase: 'C3:1 E3:1' },
  { group: 'Chords', preset: 'Poly', bpm: 120, phrase: 'C3+E3:1' },
];

function fakeHost(voicesOf: Record<string, number>) {
  let clock = 0;
  const calls: string[] = [];
  const host: DemoHost = {
    now: () => clock,
    load: (stop) => {
      calls.push(`load ${stop.preset}`);
      return voicesOf[stop.preset];
    },
    noteOn: (note, _v, at) => calls.push(`on ${note} @${at.toFixed(3)}`),
    noteOff: (at) => calls.push(`off @${at.toFixed(3)}`),
    release: (note, at) => calls.push(`release ${note} @${at.toFixed(3)}`),
    onStep: (i) => calls.push(`step ${i}`),
    onEnd: () => calls.push('end'),
  };
  return { host, calls, advance: (s: number) => (clock += s) };
}

describe('the Demo player', () => {
  it('loads each Preset in turn, schedules its Notes ahead of the clock, and goes round', () => {
    vi.useFakeTimers();
    const { host, calls, advance } = fakeHost({ Mono: 1, Poly: 4 });
    const stop = startDemo(host, tour);
    expect(calls.slice(0, 2)).toEqual(['load Mono', 'step 0']);
    // Phrase at 120 BPM: C3 at 0.4 s for 0.425 s, E3 at 0.9 s. Nothing is handed over until it is near.
    expect(calls.filter((c) => c.startsWith('on'))).toEqual([]);
    advance(0.3);
    vi.advanceTimersByTime(40);
    expect(calls.filter((c) => c.startsWith('on') || c.startsWith('off'))).toEqual(['on 48 @0.400', 'off @0.825']);
    advance(1.8); // past the lead-in, the phrase (1 s) and the gap
    vi.advanceTimersByTime(40);
    expect(calls).toContain('on 52 @0.900');
    expect(calls.slice(-2)).toEqual(['load Poly', 'step 1']);
    // A chord on a several-Voice Preset: both Notes start before either is released, by note.
    advance(0.4);
    vi.advanceTimersByTime(40);
    const chord = calls.slice(calls.indexOf('step 1') + 1);
    expect(chord.map((c) => c.split(' ')[0])).toEqual(['on', 'on', 'release', 'release']);
    stop();
    expect(calls.at(-2)).toMatch(/^off @/);
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
