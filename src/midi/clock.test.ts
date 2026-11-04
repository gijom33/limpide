import { describe, expect, it } from 'vitest';
import { type ClockTempo, createClockFollower, TICKS_PER_BEAT } from './clock';

/** A little jitter, the same on every run: up to ±2 ms on each tick, as a USB keyboard's or a DAW's clock arrives. */
function jitter(seed = 7) {
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

  it('follows a jump to 90 within a few beats, the readout passing straight from one to the other, and holds it', () => {
    const follower = createClockFollower();
    const { end } = play(follower, 120, 8, 10);
    const { handed } = play(follower, 90, 12, end);
    const settled = handed.findIndex((h) => h.bpm === 90);
    expect(settled).toBeGreaterThanOrEqual(0);
    expect(handed[settled].tick).toBeLessThanOrEqual(4 * TICKS_PER_BEAT);
    for (const h of handed.slice(settled)) expect(h.bpm).toBe(90);
    // On the way, nothing in between (issue 185): 120 until it reads 90.
    expect(new Set(handed.slice(0, settled).map((h) => h.bpm))).toEqual(new Set([120]));
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
    // A Stop, the clock silent for half a second, then a Continue: the beats go on from where they were.
    follower.stop();
    follower.resume();
    const resumed = play(follower, 120, 4, started.end + 0.5, () => 0);
    expect(resumed.handed[0].bpm).toBe(120);
    expect(resumed.handed[0].origin).toBeCloseTo(end + 0.01 + 0.5, 6);
  });

  it('counts no beats between a Stop and a Continue while the clock goes on ticking, as many keep theirs running', () => {
    const follower = createClockFollower();
    const { end } = play(follower, 120, 4, 10, () => 0);
    follower.stop();
    // Stopped for a beat and a quarter, the ticks coming on: nothing handed, the place in the track standing still.
    const stopped = play(follower, 120, 1.25, end, () => 0);
    expect(stopped.handed).toEqual([]);
    follower.resume();
    const resumed = play(follower, 120, 2, stopped.end, () => 0);
    // Four beats played, then 0.625 s stopped: the beats come later by that.
    expect(resumed.handed[0].origin).toBeCloseTo(10.625, 6);
  });

  it('reads a clock heard after one that stopped afresh: its first ticks do not bring back the old BPM', () => {
    const follower = createClockFollower();
    const { end } = play(follower, 140, 4, 0, () => 0);
    follower.lost();
    follower.start();
    const { handed } = play(follower, 90, 4, end + 5, () => 0);
    expect(handed.map((h) => h.bpm)).not.toContain(140);
    expect(handed[0].bpm).toBe(90);
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

/** Ticks at `bpm` from `from` (10 s), jittered by `wobble`, played through `fault` (which may drop a tick or play it twice). */
function playWith(
  follower: ReturnType<typeof createClockFollower>,
  { bpm, beats, fault = () => undefined, from = 10, wobble = jitter() }: {
    bpm: number;
    beats: number;
    fault?: (i: number) => 'lost' | 'doubled' | undefined;
    from?: number;
    wobble?: () => number;
  },
) {
  const handed: ClockTempo[] = [];
  const tick = 60 / bpm / TICKS_PER_BEAT;
  for (let i = 0; i < beats * TICKS_PER_BEAT; i++) {
    const at = from + i * tick + wobble();
    const what = fault(i);
    if (what === 'lost') continue;
    for (const t of what === 'doubled' ? [at, at + 0.0005] : [at]) {
      const tempo = follower.tick(t);
      if (tempo) handed.push(tempo);
    }
  }
  return handed;
}

describe('a MIDI clock with a fault (issue 185)', () => {
  it('reads a lost tick as one missed, not a slower tempo: the BPM holds and the beats stay on the clock’s', () => {
    const handed = playWith(createClockFollower(), { bpm: 120, beats: 40, fault: (i) => (i % 300 === 150 ? 'lost' : undefined) });
    for (const h of handed) expect(h.bpm).toBe(120);
    // Every beat it hands is counted from the clock's first, to a couple of milliseconds: the count is not a tick late.
    for (const h of handed.slice(-10)) expect(Math.abs(h.origin - 10)).toBeLessThan(0.002);
  });

  it('reads a doubled tick as one too many: the BPM holds and the beats stay on the clock’s', () => {
    const handed = playWith(createClockFollower(), { bpm: 128, beats: 40, fault: (i) => (i % 300 === 150 ? 'doubled' : undefined) });
    for (const h of handed) expect(h.bpm).toBe(128);
    for (const h of handed.slice(-10)) expect(Math.abs(h.origin - 10)).toBeLessThan(0.002);
  });

  it('still settles on a Bluetooth clock delivered in 15 ms bunches, each tick stamped when its bunch came, and holds it', () => {
    const bunched = (bpm: number) => {
      const tick = 60 / bpm / TICKS_PER_BEAT;
      return (i: number) => Math.ceil((i * tick) / 0.015) * 0.015 - i * tick;
    };
    for (const bpm of [120, 174]) {
      let i = 0;
      const late = bunched(bpm);
      const handed = playWith(createClockFollower(), { bpm, beats: 30, from: 0, wobble: () => late(i++) });
      // Its first few beats are read over less than the four beats fitted: they may be a little off.
      expect(new Set(handed.slice(4).map((h) => h.bpm)), `${bpm} BPM`).toEqual(new Set([bpm]));
    }
  });

  it('keeps the beats on the clock’s through a jump mid-beat, either way: its first ticks are not mended as a lost or doubled one', () => {
    // The jump anywhere in a beat, on many runs of jitter: the beat count after it is a clean clock's.
    for (const [from, to] of [[120, 90], [90, 120]]) {
      for (let seed = 1; seed <= 48; seed++) {
        const follower = createClockFollower();
        const wobble = jitter(seed);
        const jumpAt = 8 * TICKS_PER_BEAT + (seed % TICKS_PER_BEAT);
        const beats: number[] = [];
        let t = 10;
        for (let i = 0; i < 20 * TICKS_PER_BEAT; i++) {
          if (follower.tick(t + wobble())) beats.push(i);
          t += 60 / (i < jumpAt ? from : to) / TICKS_PER_BEAT;
        }
        const after = beats.filter((i) => i > jumpAt);
        expect(after.length, `${from} → ${to}, seed ${seed}`).toBeGreaterThan(8);
        for (const i of after) expect(i % TICKS_PER_BEAT, `${from} → ${to}, seed ${seed}, tick ${i}`).toBe(0);
      }
    }
  });

  it('follows a ramp from 100 to 140 over 12 s a BPM or two at a time, ending at 140', () => {
    const follower = createClockFollower();
    const wobble = jitter();
    const readings: number[] = [];
    let t = 0;
    while (t < 12) {
      const bpm = 100 + (40 * t) / 12;
      t += 60 / bpm / TICKS_PER_BEAT;
      const tempo = follower.tick(t + wobble());
      if (tempo) readings.push(tempo.bpm);
    }
    for (let i = 0; i < 4 * TICKS_PER_BEAT; i++) {
      t += 60 / 140 / TICKS_PER_BEAT;
      const tempo = follower.tick(t + wobble());
      if (tempo) readings.push(tempo.bpm);
    }
    readings.slice(1).forEach((r, i) => expect(Math.abs(r - readings[i])).toBeLessThanOrEqual(2));
    expect(readings.at(-1)).toBe(140);
  });
});
