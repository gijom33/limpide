import { describe, expect, it } from 'vitest';
import { createSynthEngine, type SynthEngine } from '../engine/synthEngine';
import { defaultPatch } from '../patch/patch';
import { WAKES } from './pauseInSilence';

// The paused engine wakes from every one of its methods that makes sound (issues 216 and 238): each of a real engine's
// methods is called in turn, and those that schedule anything in the sound must be the ones that wake it, and only
// they. What it counts is scheduling: a method changing the sound only by setting a value, a curve or a connection
// would pass unseen (the engine's do so only for what is never heard: the Response Curve's twins, the Taps).

/** The AudioParam and node methods that schedule what is heard, wrapped to count their calls. */
function countSchedules() {
  let count = 0;
  const restore: (() => void)[] = [];
  const wrap = <T extends object>(proto: T, names: (keyof T)[]) => {
    for (const name of names) {
      const original = proto[name] as (...args: unknown[]) => unknown;
      if (typeof original !== 'function') continue;
      restore.push(() => {
        proto[name] = original as T[keyof T];
      });
      proto[name] = function (this: unknown, ...args: unknown[]) {
        count++;
        return original.apply(this, args);
      } as T[keyof T];
    }
  };
  wrap(AudioParam.prototype, ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'setValueCurveAtTime', 'cancelScheduledValues', 'cancelAndHoldAtTime']);
  wrap(AudioScheduledSourceNode.prototype, ['start', 'stop']);
  wrap(OscillatorNode.prototype, ['setPeriodicWave']);
  return { count: () => count, restore: () => restore.forEach((undo) => undo()) };
}

describe("the engine's methods that wake it (issues 216 and 238)", () => {
  it('are every one that schedules something heard, and none other: a new method that makes sound must wake it', () => {
    const ctx = new OfflineAudioContext(1, 48000, 48000);
    const engine = createSynthEngine(ctx);
    const synced = { ...defaultPatch(), lfoSync: 'on' as const, lfoAmount: 0.5 };
    engine.applyPatch(synced);
    const scheduled = countSchedules();
    // Every member, in an order where each has something to change (a Note to bend, release or silence). A member the
    // engine gains fails to compile here until it is called.
    const calls: { [K in keyof SynthEngine]: (e: SynthEngine) => unknown } = {
      applyPatch: (e) => e.applyPatch({ ...synced, cutoff: 1000 }),
      setTempo: (e) => e.setTempo(140),
      noteOn: (e) => e.noteOn(60, 1),
      pitchChange: (e) => e.pitchChange(62),
      setBend: (e) => e.setBend(100),
      setPressure: (e) => e.setPressure({ destination: 'cutoff', amount: 0.5 }),
      noteOff: (e) => {
        e.noteOff();
        e.noteOn(64, 1);
      },
      release: (e) => {
        e.release(64);
        e.noteOn(67, 1);
      },
      silence: (e) => e.silence(),
      fundamental: (e) => e.fundamental(),
      fundamentalAt: (e) => e.fundamentalAt(0),
      newestNote: (e) => e.newestNote(),
      onNewestNote: (e) => e.onNewestNote(() => {})(),
      modulationAt: (e) => e.modulationAt(),
      lfoSwingAt: (e) => e.lfoSwingAt(0),
      patchAt: (e) => e.patchAt(0),
      settledFrom: (e) => e.settledFrom(),
      tempo: (e) => e.tempo(),
      now: (e) => e.now(),
      quietFrom: (e) => e.quietFrom(),
      paused: (e) => e.paused(),
      shownNow: (e) => e.shownNow(),
      heardAt: (e) => e.heardAt(0),
      filterResponse: (e) => e.filterResponse(new Float32Array([100, 1000])),
      limiting: (e) => e.limiting(),
      setTapSource: (e) => e.setTapSource('all'),
      taps: (e) => e.taps,
      // The pause itself: what it wakes from, and the waking.
      pause: (e) => e.pause(),
      wake: (e) => e.wake(),
    };
    const schedulers: string[] = [];
    try {
      for (const [name, call] of Object.entries(calls)) {
        const before = scheduled.count();
        call(engine);
        if (scheduled.count() > before && name !== 'pause' && name !== 'wake') schedulers.push(name);
      }
    } finally {
      scheduled.restore();
    }
    expect(schedulers.sort().join(" ")).toBe([...WAKES].sort().join(" "));
    expect(Object.keys(engine).sort()).toEqual(Object.keys(calls).sort());
  });
});
