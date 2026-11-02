import { describe, expect, it } from 'vitest';
import { type ClockTempo, createClockFollower, TICKS_PER_BEAT } from './clock';

/** A little jitter, the same on every run: up to ±2 ms on each tick, as a USB keyboard's or a DAW's clock arrives. */
function jitter() {
  let seed = 7;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647 - 0.5) * 0.004;
  };
}

/** Ticks at `bpm` for `beats` beats from `from` (seconds), each jittered; what the follower handed back, and when. */
function play(follower: ReturnType<typeof createClockFollower>, bpm: number, beats: number, from: number, wobble = jitter()) {
  const handed: (ClockTempo & { at: number; tick: number })[] = [];
  const tick = 60 / bpm / TICKS_PER_BEAT;
  for (let i = 0; i < beats * TICKS_PER_BEAT; i++) {
    const at = from + i * tick + wobble();
    const tempo = follower.tick(at);
    if (tempo) handed.push({ ...tempo, at, tick: i });
  }
  return { handed, end: from + beats * TICKS_PER_BEAT * tick };
}

describe('following a MIDI clock (issue 136)', () => {
  it('gives a steady 120 from ticks at 120 BPM with a little jitter, from its first beat on, once a beat', () => {
    const { handed } = play(createClockFollower(), 120, 16, 10);
    expect(handed.length).toBeGreaterThanOrEqual(15);
    expect(handed[0].tick).toBe(TICKS_PER_BEAT); // a beat of ticks is needed first
    for (const h of handed) expect(h.bpm).toBe(120);
    // Once a beat, on the clock's beats.
    for (const h of handed) expect(h.tick % TICKS_PER_BEAT).toBe(0);
  });

  it('counts the beats from the first tick heard, its beat where that tick fell, to a millisecond', () => {
    const { handed } = play(createClockFollower(), 120, 16, 10);
    for (const h of handed) expect(Math.abs(h.origin - 10)).toBeLessThan(0.001);
  });

  it('follows a change to 90 within a few beats, the readout passing straight from one to the other, and holds it', () => {
    const follower = createClockFollower();
    const { end } = play(follower, 120, 8, 10);
    const { handed } = play(follower, 90, 12, end);
    const settled = handed.findIndex((h) => h.bpm === 90);
    expect(settled).toBeGreaterThanOrEqual(0);
    expect(handed[settled].tick).toBeLessThanOrEqual(4 * TICKS_PER_BEAT);
    for (const h of handed.slice(settled)) expect(h.bpm).toBe(90);
    // On the way, it only falls: no flicker back up.
    const way = handed.slice(0, settled).map((h) => h.bpm);
    expect([...way].sort((a, b) => b - a)).toEqual(way);
  });

  it('does not flicker between two whole BPMs on a clock half way between them', () => {
    const { handed } = play(createClockFollower(), 120.5, 24, 0);
    expect(new Set(handed.map((h) => h.bpm)).size).toBe(1);
  });

  it('keeps the clock’s beats when it runs a little off a whole BPM: each beat it hands, the clock’s beat is on it', () => {
    // At 120.3 BPM the readout is 120: the beats are counted again on each of the clock's own.
    const { handed } = play(createClockFollower(), 120.3, 32, 0);
    for (const h of handed) {
      const beats = h.tick / TICKS_PER_BEAT;
      expect(Math.abs(h.origin + (beats * 60) / h.bpm - (beats * 60) / 120.3)).toBeLessThan(0.001);
    }
  });

  it('starts the beat count again at a Start, on the tick after it; a Continue goes on counting', () => {
    const follower = createClockFollower();
    const { end } = play(follower, 120, 8, 10, () => 0);
    follower.start();
    const started = play(follower, 120, 4, end + 0.01, () => 0);
    // The tick after the Start is the first beat, handed at once.
    expect(started.handed[0]).toMatchObject({ tick: 0, bpm: 120 });
    expect(started.handed[0].origin).toBeCloseTo(end + 0.01, 6);
    // Stopped for three seconds, then a Continue: the beats go on from where they were.
    follower.lost();
    const resumed = play(follower, 120, 4, started.end + 3, () => 0);
    expect(resumed.handed[0].bpm).toBe(120);
    expect(resumed.handed[0].origin).toBeCloseTo(end + 0.01 + 3, 6);
  });

  it('starts over after a pause in the ticks, rather than read the pause as a slower tempo', () => {
    const follower = createClockFollower();
    const { end } = play(follower, 120, 8, 0, () => 0);
    const { handed } = play(follower, 120, 4, end + 0.3, () => 0);
    for (const h of handed) expect(h.bpm).toBe(120);
  });

  it('keeps between 40 and 240 BPM, as the tempo does', () => {
    expect(play(createClockFollower(), 300, 4, 0).handed.at(-1)?.bpm).toBe(240);
    expect(play(createClockFollower(), 30, 4, 0).handed.at(-1)?.bpm).toBe(40);
  });
});
