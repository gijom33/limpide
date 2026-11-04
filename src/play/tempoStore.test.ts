import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TICKS_PER_BEAT } from '../midi/clock';
import { memoryStorage } from '../test/memoryStorage';
import { createTempoStore } from './tempoStore';

/**
 * An engine that only keeps the tempo it is handed, on a clock the test moves; the context's time heard at a moment of
 * the page's clock is that moment `ahead` (issue 185).
 */
const fakeEngine = () => {
  const engine = { time: 5, ahead: 0, handed: [] as { bpm: number; origin: number }[] };
  return {
    engine,
    host: {
      heardAt: (pageTime: number) => pageTime + engine.ahead,
      setTempo: (bpm: number, origin = engine.time) => void engine.handed.push({ bpm, origin }),
    },
  };
};

describe('the tempo (issue 112)', () => {
  it('starts at 120 BPM, hands it to the engine, and is the page’s: remembered between visits, never in a Patch', () => {
    const storage = memoryStorage();
    const { engine, host } = fakeEngine();
    const tempo = createTempoStore({ storage, engine: host });
    expect(tempo.get()).toEqual({ bpm: 120, player: false, midi: false });
    expect(engine.handed).toEqual([{ bpm: 120, origin: 5 }]);
    engine.time = 7;
    tempo.set(97.44); // kept to a tenth (issue 223)
    expect(tempo.get().bpm).toBe(97.4);
    expect(engine.handed.at(-1)).toEqual({ bpm: 97.4, origin: 7 });
    expect(createTempoStore({ storage, engine: fakeEngine().host }).get().bpm).toBe(97.4);
  });

  it('keeps between 40 and 240, and starts at 120 when what was kept is garbled', () => {
    const tempo = createTempoStore({ storage: memoryStorage(), engine: fakeEngine().host });
    tempo.set(10);
    expect(tempo.get().bpm).toBe(40);
    tempo.set(1000);
    expect(tempo.get().bpm).toBe(240);
    expect(createTempoStore({ storage: memoryStorage({ 'limpide.tempo': '{"bpm":"fast"}' }), engine: fakeEngine().host }).get().bpm).toBe(120);
  });

  it('follows four taps on the page’s clock, its beats counted from the last on the engine’s, Hold’s rhythm apart', () => {
    const { engine, host } = fakeEngine();
    let now = 0;
    const tempo = createTempoStore({ storage: memoryStorage(), engine: host, clock: () => now });
    engine.ahead = 100;
    for (const t of [10, 10.6, 11.2, 11.8]) {
      now = t;
      tempo.tapTempo();
    }
    expect(tempo.get().bpm).toBe(100);
    expect(engine.handed.at(-1)).toEqual({ bpm: 100, origin: 111.8 });
  });

  it('gives way to a player’s tempo while it plays, its beats counted from its first, then comes back', () => {
    const { engine, host } = fakeEngine();
    const tempo = createTempoStore({ storage: memoryStorage(), engine: host });
    tempo.set(100);
    const seen: number[] = [];
    tempo.subscribe(() => seen.push(tempo.get().bpm));
    tempo.take(128, 5.3);
    expect(tempo.get()).toEqual({ bpm: 128, player: true, midi: false });
    expect(engine.handed.at(-1)).toEqual({ bpm: 128, origin: 5.3 });
    // Set by hand meanwhile: nothing changes until the player stops.
    tempo.set(150);
    tempo.tapTempo();
    tempo.tapTempo();
    expect(tempo.get().bpm).toBe(128);
    engine.time = 9;
    tempo.giveBack();
    expect(tempo.get()).toEqual({ bpm: 100, player: false, midi: false });
    expect(engine.handed.at(-1)).toEqual({ bpm: 100, origin: 9 });
    expect(seen).toEqual([128, 100]);
    // Given back when nothing holds it: nothing happens.
    tempo.giveBack();
    expect(seen).toEqual([128, 100]);
  });
});

describe('the tempo follows a MIDI clock (issue 136)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /**
   * A store whose page clock the test moves, the engine's heard 100 s ahead of it, and a clock to tick it: `beats`
   * at `bpm`, each tick timed on the page's clock, the timers moved along with it.
   */
  const following = (storage = memoryStorage()) => {
    const { engine, host } = fakeEngine();
    let now = 50;
    const clock = () => now;
    engine.ahead = 100;
    const tempo = createTempoStore({ storage, engine: host, clock });
    const ticks = (bpm: number, beats: number, from = 'Stand-in DAW') => {
      for (let i = 0; i < beats * TICKS_PER_BEAT; i++) {
        tempo.midiClock('clock', now, from);
        now += 60 / bpm / TICKS_PER_BEAT;
        vi.advanceTimersByTime((60 / bpm / TICKS_PER_BEAT) * 1000);
      }
    };
    const wait = (seconds: number) => {
      now += seconds;
      vi.advanceTimersByTime(seconds * 1000);
    };
    return { tempo, engine, ticks, wait, storage, now: () => now };
  };

  it('sets the BPM from the clock, marked MIDI, and hands the engine the clock’s beats', () => {
    const { tempo, engine, ticks } = following();
    ticks(126, 4);
    expect(tempo.get()).toEqual({ bpm: 126, player: false, midi: true });
    // The beats counted from the first tick, at 50 s on the page's clock: 150 s on the engine's.
    expect(engine.handed.at(-1)!.bpm).toBe(126);
    expect(engine.handed.at(-1)!.origin).toBeCloseTo(150, 6);
  });

  it('places the clock’s beats where the engine’s sound is heard as they come, not where it is made (issue 185)', () => {
    const { tempo, engine, ticks } = following();
    // 40 ms of output latency: the context time heard at 50 s on the page's clock is 149.96 s.
    engine.ahead = 99.96;
    ticks(126, 4);
    expect(tempo.get().bpm).toBe(126);
    expect(engine.handed.at(-1)!.origin).toBeCloseTo(149.96, 6);
  });

  it('hands the engine a steady clock once, not on every beat', () => {
    const { engine, ticks } = following();
    ticks(120, 2);
    const handed = engine.handed.length;
    ticks(120, 8);
    expect(engine.handed.length).toBe(handed);
  });

  it('cannot be set by hand or by Tap while the clock runs; when it stops, its last BPM stays, remembered, the person’s to change', () => {
    const { tempo, engine, ticks, wait, storage } = following();
    ticks(90, 4);
    tempo.set(140);
    tempo.tapTempo();
    tempo.tapTempo();
    expect(tempo.get().bpm).toBe(90);
    const handed = engine.handed.length;
    wait(0.5);
    expect(tempo.get().midi).toBe(true);
    wait(0.6);
    expect(tempo.get()).toEqual({ bpm: 90, player: false, midi: false });
    // The tempo and its beats stay as the clock left them.
    expect(engine.handed.slice(handed).every((h) => h.bpm === 90 && Math.abs(h.origin - 150) < 1e-6)).toBe(true);
    expect(createTempoStore({ storage, engine: fakeEngine().host }).get().bpm).toBe(90);
    tempo.set(140);
    expect(tempo.get()).toEqual({ bpm: 140, player: false, midi: false });
  });

  it('starts the beat count again at a MIDI Start, on the tick after it; a Continue goes on counting', () => {
    const { tempo, engine, ticks, wait, now } = following();
    ticks(120, 4);
    wait(0.3);
    tempo.midiClock('start', now(), 'Stand-in DAW');
    const downbeat = now();
    ticks(120, 2);
    expect(engine.handed.at(-1)!.origin).toBeCloseTo(downbeat + 100, 6);
    tempo.midiClock('stop', now(), 'Stand-in DAW');
    wait(0.4);
    tempo.midiClock('continue', now(), 'Stand-in DAW');
    ticks(120, 2);
    // Two beats played, 0.4 s stopped: the beats go on from where they were, later by the pause.
    expect(engine.handed.at(-1)!.origin).toBeCloseTo(downbeat + 100.4, 6);
    expect(tempo.get()).toEqual({ bpm: 120, player: false, midi: true });
  });

  it('follows one clock at a time: another input’s ticks are ignored while it runs', () => {
    const { tempo, ticks } = following();
    ticks(100, 2);
    for (let i = 0; i < 100; i++) tempo.midiClock('clock', 50 + i * 0.001, 'Another clock');
    ticks(100, 2);
    expect(tempo.get().bpm).toBe(100);
  });

  it('follows the input whose Start came first: another input’s ticks are ignored after it', () => {
    const { tempo, ticks, now } = following();
    tempo.midiClock('start', now(), 'Stand-in DAW');
    ticks(100, 1, 'Another clock');
    expect(tempo.get().midi).toBe(false);
    ticks(100, 2);
    expect(tempo.get()).toEqual({ bpm: 100, player: false, midi: true });
  });

  it('leaves a player its own BPM while it plays, the clock ignored, and comes back to the clock’s after', () => {
    const { tempo, engine, ticks } = following();
    ticks(100, 4);
    tempo.take(128, 160);
    ticks(100, 4);
    expect(tempo.get()).toEqual({ bpm: 128, player: true, midi: false });
    expect(engine.handed.at(-1)).toEqual({ bpm: 128, origin: 160 });
    // The clock changes tempo meanwhile; when the player stops, the clock's tempo is back, on its beats.
    ticks(110, 6);
    expect(tempo.get().bpm).toBe(128);
    tempo.giveBack();
    expect(tempo.get()).toEqual({ bpm: 110, player: false, midi: true });
    expect(engine.handed.at(-1)!.bpm).toBe(110);
  });

  it('gives the person’s BPM back after a player if the clock stopped meanwhile, as the clock left it', () => {
    const { tempo, ticks, wait } = following();
    tempo.set(100);
    ticks(130, 4);
    tempo.take(128, 160);
    wait(2);
    tempo.giveBack();
    expect(tempo.get()).toEqual({ bpm: 130, player: false, midi: false });
  });
});
