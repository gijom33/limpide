import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Played, type Source, startTransport, type TransportHost } from './transport';

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
