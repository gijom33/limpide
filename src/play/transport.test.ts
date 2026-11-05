import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loopPhrase } from '../demo/phrase';
import { BACKGROUND_LOOKAHEAD, type Played, type Source, startTransport, type Timers, type TransportHost } from './transport';

function fakeHost({ keys = true } = {}) {
  let clock = 0;
  const calls: string[] = [];
  const host: TransportHost = {
    now: () => clock,
    noteOn: (note, _v, at) => calls.push(`on ${note} @${at.toFixed(2)}`),
    release: (note, at) => calls.push(`release ${note} @${at.toFixed(2)}`),
    noteOff: (at) => calls.push(`off @${at.toFixed(2)}`),
    onEnd: () => calls.push('end'),
    ...(keys ? { onNotes: (notes: number[]) => calls.push(`keys ${notes.join('+') || '-'}`) } : {}),
  };
  /** Moves the clock on by ticks of 40 ms. */
  const run = (seconds: number) => {
    for (let t = 0; t < seconds - 1e-9; t += 0.04) {
      clock += 0.04;
      vi.advanceTimersByTime(40);
    }
  };
  return { host, calls, run };
}

const note = (n: number, on: number, off: number): Played => ({ note: n, velocity: 0.9, on, off });

/** A source playing these Notes once, each when it falls before the horizon; over once all are played and done. */
function once(notes: Played[]): Source {
  let next = 0;
  return (horizon, now, play) => {
    if (next === notes.length && now >= Math.max(...notes.map((n) => n.off))) return 'end';
    const due: Played[] = [];
    while (next < notes.length && notes[next].on < horizon) due.push(notes[next++]);
    play(due);
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the Transport (issue 75)', () => {
  it('hands each Note over once it is within the look-ahead, and not before', () => {
    const { host, calls, run } = fakeHost();
    startTransport(host, once([note(60, 0.5, 0.8)]), { lookahead: 0.15, tick: 40 });
    run(0.32);
    expect(calls.filter((c) => c.startsWith('on'))).toEqual([]);
    run(0.04); // 0.36 s: 0.5 is within 0.15 s
    expect(calls.filter((c) => !c.startsWith('keys'))).toEqual(['on 60 @0.50', 'release 60 @0.80']);
  });

  it("starts a chord's Notes before ending any of them, and hands starts and ends in time order", () => {
    const { host, calls, run } = fakeHost();
    startTransport(host, once([note(60, 0.1, 0.4), note(64, 0.1, 0.4), note(67, 0.5, 0.9)]), { lookahead: 0.15, tick: 40 });
    run(1);
    const handed = calls.filter((c) => !c.startsWith('keys') && c !== 'end');
    expect(handed).toEqual(['on 60 @0.10', 'on 64 @0.10', 'release 60 @0.40', 'release 64 @0.40', 'on 67 @0.50', 'release 67 @0.90']);
    const times = handed.map((c) => Number(c.split('@')[1]));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('lights the keys of the Notes sounding now, once each time they change', () => {
    const { host, calls, run } = fakeHost();
    startTransport(host, once([note(60, 0.1, 0.4), note(64, 0.1, 0.4), note(67, 0.5, 0.9)]), { lookahead: 0.15, tick: 40 });
    run(0.2);
    expect(calls.filter((c) => c.startsWith('keys'))).toEqual(['keys 60+64']);
    run(0.24); // 0.44 s: the chord has ended
    expect(calls.filter((c) => c.startsWith('keys')).at(-1)).toBe('keys -');
    run(0.08); // 0.52 s
    expect(calls.filter((c) => c.startsWith('keys')).at(-1)).toBe('keys 67');
  });

  it('lights nothing where the player shows no keys of its own', () => {
    const { host, calls, run } = fakeHost({ keys: false });
    const stop = startTransport(host, once([note(60, 0.1, 0.4)]), { lookahead: 0.1, tick: 25 });
    run(0.3);
    stop();
    expect(calls.some((c) => c.startsWith('keys'))).toBe(false);
  });

  it('asks again as soon as the source says, rather than on the next tick', () => {
    const { host } = fakeHost();
    const asked: number[] = [];
    startTransport(host, (_horizon, now) => {
      asked.push(now);
      return 10;
    }, { lookahead: 0.15, tick: 40 });
    vi.advanceTimersByTime(30);
    expect(asked.length).toBe(4); // at 0, 10, 20 and 30 ms
  });

  it('when the source is over, clears the keys, says so, and asks no more', () => {
    const { host, calls, run } = fakeHost();
    startTransport(host, once([note(60, 0.1, 0.4)]), { lookahead: 0.15, tick: 40 });
    run(0.6);
    expect(calls.slice(-2)).toEqual(['keys -', 'end']);
    const before = calls.length;
    run(1);
    expect(calls.length).toBe(before);
  });

  it('stops: the Gate closed now, which ends what was handed over too (issue 101), the keys cleared, nothing more', () => {
    const { host, calls, run } = fakeHost();
    const stop = startTransport(host, once([note(60, 0.1, 0.4), note(62, 1, 1.3)]), { lookahead: 0.15, tick: 40 });
    run(0.2);
    stop();
    expect(calls.slice(-2)).toEqual(['off @0.20', 'keys -']);
    const before = calls.length;
    run(2);
    expect(calls.length).toBe(before);
  });
});

/** Timers the test fires by hand: a background page's, which the browser wakes when it likes (issue 198). */
function handTimers() {
  let due: (() => void) | null = null;
  const timers: Timers = {
    after(_ms, fn) {
      due = fn;
      return () => (due = null);
    },
  };
  return {
    timers,
    fire() {
      const fn = due;
      due = null;
      fn?.();
    },
  };
}

describe('the Transport in the background (issue 198)', () => {
  // A phrase of eighths at 120 BPM: a Note every quarter of a second, 32 of them over 8 s.
  const phrase = Array(32).fill('C4:.5').join(' ');

  it('with its ticks slowed to once a second while the page is hidden, hands every Note over before its start, once', () => {
    let clock = 0;
    const handed: { on: number; at: number }[] = [];
    const host: TransportHost = {
      now: () => clock,
      noteOn: (_n, _v, on) => handed.push({ on, at: clock }),
      release: () => {},
      noteOff: () => {},
    };
    const { timers, fire } = handTimers();
    startTransport(host, loopPhrase(phrase, 120, 0.2), { lookahead: 0.15, tick: 40, background: BACKGROUND_LOOKAHEAD, timers, hidden: () => true });
    for (let s = 0; s < 8; s++) {
      clock += 1;
      fire();
    }
    const starts = handed.map((h) => h.on).filter((on) => on < 8);
    expect(starts).toEqual(Array.from({ length: starts.length }, (_, i) => 0.2 + i * 0.25)); // every one, none twice
    expect(starts.length).toBe(32);
    expect(handed.every((h) => h.at <= h.on)).toBe(true); // none after its start
  });

  it('in front, keeps the look-ahead as short as ever, and narrows it again once the page is back', () => {
    let clock = 0;
    let hidden = true;
    const handed: number[] = [];
    const host: TransportHost = { now: () => clock, noteOn: (_n, _v, on) => handed.push(on), release: () => {}, noteOff: () => {} };
    const { timers, fire } = handTimers();
    startTransport(host, loopPhrase(phrase, 120, 0.2), { lookahead: 0.15, tick: 40, background: BACKGROUND_LOOKAHEAD, timers, hidden: () => hidden });
    expect(Math.max(...handed)).toBeGreaterThan(1.5); // hidden: about two seconds ahead
    hidden = false;
    clock = 3;
    fire();
    expect(Math.max(...handed)).toBeLessThan(3.15); // back in front: no further than the short look-ahead
    expect(new Set(handed).size).toBe(handed.length);
  });

  it('back in front, takes back the Notes handed ahead and makes them again as they fall due, on the Preset and octave of then (issue 227)', () => {
    let clock = 0;
    let hidden = true;
    let octave = 0;
    // The Preset loaded: a Note takes the engine's Patch when it is handed over.
    let preset = 'Init';
    const calls: { call: string; at: number; preset: string }[] = [];
    const host: TransportHost = {
      now: () => clock,
      noteOn: (note, _v, on) => calls.push({ call: `on ${note} @${on.toFixed(2)}`, at: clock, preset }),
      release: () => {},
      noteOff: (at) => calls.push({ call: `off @${at.toFixed(2)}`, at: clock, preset }),
    };
    const { timers, fire } = handTimers();
    startTransport(host, loopPhrase(phrase, 120, 0.2, { transpose: () => octave }), { lookahead: 0.15, tick: 40, background: BACKGROUND_LOOKAHEAD, timers, hidden: () => hidden });
    expect(calls.map((c) => c.call)).toContain('on 60 @1.95'); // hidden: about two seconds ahead
    // Back in front at 0.5 s, the Preset and the octave changed at once: the Notes from 0.7 s on are taken back.
    hidden = false;
    octave = 12;
    preset = 'Acid';
    clock = 0.5;
    fire();
    expect(calls.at(-1)?.call).toBe('off @0.70');
    const takenBack = calls.length;
    while (clock < 2) {
      clock += 0.04;
      fire();
    }
    const remade = calls.slice(takenBack);
    // Made again one by one, on the short look-ahead, in the octave of now.
    expect(remade.map((c) => c.call)).toEqual(['on 72 @0.70', 'on 72 @0.95', 'on 72 @1.20', 'on 72 @1.45', 'on 72 @1.70', 'on 72 @1.95']);
    expect(remade.every((c) => Number(c.call.split('@')[1]) - c.at <= 0.15 + 1e-9)).toBe(true);
    expect(remade.every((c) => c.preset === 'Acid')).toBe(true);
  });

  it('drops a Note whose start has passed by the time it is handed over, rather than playing it late', () => {
    let clock = 0;
    const calls: string[] = [];
    const host: TransportHost = {
      now: () => clock,
      noteOn: (note, _v, on) => calls.push(`on ${note} @${on.toFixed(2)}`),
      release: (note, at) => calls.push(`release ${note} @${at.toFixed(2)}`),
      noteOff: () => {},
      onNotes: (notes) => calls.push(`keys ${notes.join('+') || '-'}`),
    };
    const { timers, fire } = handTimers();
    startTransport(host, once([note(60, 0.1, 0.3), note(62, 0.4, 0.9), note(64, 1.2, 1.5)]), { lookahead: 0.15, tick: 40, timers, hidden: () => false });
    clock = 1.1; // the page stalled: C4 and D4 are past their start
    fire();
    expect(calls).toEqual(['on 60 @0.10', 'release 60 @0.30', 'on 64 @1.20', 'release 64 @1.50']);
  });
});

