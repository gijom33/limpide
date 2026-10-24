import { describe, expect, it, vi } from 'vitest';
import { createHoldTaps, startRhythm, TAP_GAP, type RhythmHost } from './holdRhythm';

describe('the Hold button’s taps', () => {
  it('one click switches Hold on with no rhythm, as before', () => {
    const taps = createHoldTaps();
    expect(taps.press(10)).toBe(true);
    expect(taps.rhythm()).toBeNull();
  });

  it('clicks soon after keep Hold on and tap a rhythm: every tap plays, then a pause, back on the beat', () => {
    const taps = createHoldTaps();
    taps.press(10);
    expect(taps.press(10.5)).toBe(true);
    expect(taps.press(11)).toBe(true);
    expect(taps.press(12)).toBe(true);
    // The beat is the typical time between taps (0.5 s); the last tap's beat, a beat of rest, and on to the next beat.
    expect(taps.rhythm()).toEqual({ gaps: [0.5, 0.5, 1, 1], beat: 0.5 });
  });

  it('three steady taps play three beats and rest on the fourth', () => {
    const taps = createHoldTaps();
    taps.press(10);
    taps.press(10.5);
    taps.press(11.02); // a little late, as people tap
    const { gaps, beat } = taps.rhythm()!;
    expect(gaps).toHaveLength(3);
    expect(gaps.reduce((a, b) => a + b, 0) / beat).toBeCloseTo(4, 1);
  });

  it('a click after a longer pause switches Hold off and forgets the rhythm', () => {
    const taps = createHoldTaps();
    taps.press(10);
    taps.press(10.5);
    expect(taps.press(10.5 + TAP_GAP + 0.1)).toBe(false);
    expect(taps.rhythm()).toBeNull();
  });

  it('once a Note is held, the rhythm is set: the next click switches Hold off, however soon', () => {
    const taps = createHoldTaps();
    taps.press(10);
    taps.press(10.4);
    taps.noteArrived();
    expect(taps.rhythm()!.gaps).toHaveLength(2); // two taps, then a beat of rest
    expect(taps.rhythm()!.beat).toBeCloseTo(0.4);
    expect(taps.press(10.6)).toBe(false);
  });

  it('with a Note already held when Hold goes on, clicks only switch it, as before', () => {
    const taps = createHoldTaps();
    taps.press(10, true);
    expect(taps.press(10.3)).toBe(false);
    expect(taps.rhythm()).toBeNull();
  });

  it('switching Hold on again starts a new rhythm', () => {
    const taps = createHoldTaps();
    taps.press(10);
    taps.press(10.4);
    taps.press(20); // off
    taps.press(30); // on
    expect(taps.rhythm()).toBeNull();
    taps.press(30.25);
    expect(taps.rhythm()).toEqual({ gaps: [0.25, 0.5], beat: 0.25 });
  });
});

function fakeHost(voices: number) {
  let clock = 0;
  let notes: number[] = [];
  const calls: string[] = [];
  const host: RhythmHost = {
    now: () => clock,
    notes: () => notes,
    voices: () => voices,
    noteOn: (note, _v, at) => calls.push(`on ${note} @${at.toFixed(2)}`),
    release: (note, at) => calls.push(`release ${note} @${at.toFixed(2)}`),
    noteOff: (at) => calls.push(`off @${at.toFixed(2)}`),
  };
  const run = (seconds: number) => {
    for (let t = 0; t < seconds - 1e-9; t += 0.01) {
      clock += 0.01;
      vi.advanceTimersByTime(10);
    }
  };
  return { host, calls, run, hold: (n: number[]) => (notes = n) };
}

const starts = (calls: string[]) => calls.filter((c) => c.startsWith('on'));

describe('the rhythm player', () => {
  it('waits for a Note, then on one Voice plays the newest held Note on every tap, looping', () => {
    vi.useFakeTimers();
    const { host, calls, run, hold } = fakeHost(1);
    const stop = startRhythm(host, { gaps: [0.5, 1], beat: 0.5 });
    run(1);
    expect(calls).toEqual([]);
    hold([60, 64]);
    run(3);
    const ons = starts(calls);
    expect(ons.map((c) => c.split(' ')[1])).toEqual(['64', '64', '64', '64', '64']);
    const times = ons.map((c) => Number(c.split('@')[1]));
    expect(times.slice(1).map((t, i) => +(t - times[i]).toFixed(2))).toEqual([0.5, 1, 0.5, 1]);
    // Each Note ends before the next tap.
    expect(calls.filter((c) => c.startsWith('off')).length).toBeGreaterThanOrEqual(4);
    // A Note sounds for at most a beat, so the long gap is a rest.
    const firstOff = Number(calls.filter((c) => c.startsWith('off'))[1].split('@')[1]);
    expect(firstOff - times[1]).toBeCloseTo(0.5 * 0.85, 2);
    stop();
    vi.useRealTimers();
  });

  it('on several Voices alternates one Note, in turn, and the whole chord', () => {
    vi.useFakeTimers();
    const { host, calls, run, hold } = fakeHost(4);
    hold([60, 64, 67]);
    const stop = startRhythm(host, { gaps: [0.5], beat: 0.5 });
    run(2.6);
    const steps: string[] = [];
    let current = '';
    let at = '';
    for (const c of starts(calls)) {
      const [, note, time] = c.split(/ @?/);
      if (time !== at && current) steps.push(current);
      current = time === at ? `${current}+${note}` : note;
      at = time;
    }
    steps.push(current);
    expect(steps.slice(0, 6)).toEqual(['60', '60+64+67', '64', '60+64+67', '67', '60+64+67']);
    expect(calls.some((c) => c.startsWith('release'))).toBe(true);
    stop();
    vi.useRealTimers();
  });

  it('stops: silence, and nothing more is handed over', () => {
    vi.useFakeTimers();
    const { host, calls, run, hold } = fakeHost(1);
    hold([60]);
    const stop = startRhythm(host, { gaps: [0.25], beat: 0.25 });
    run(0.5);
    stop();
    expect(calls.at(-1)).toMatch(/^off/);
    const before = calls.length;
    run(1);
    expect(calls.length).toBe(before);
    vi.useRealTimers();
  });
});
