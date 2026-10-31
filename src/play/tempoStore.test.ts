import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { createTempoStore } from './tempoStore';

/** An engine that only keeps the tempo it is handed, on a clock the test moves. */
const fakeEngine = () => {
  const engine = { time: 5, handed: [] as { bpm: number; origin: number }[] };
  return {
    engine,
    host: { now: () => engine.time, setTempo: (bpm: number, origin = engine.time) => void engine.handed.push({ bpm, origin }) },
  };
};

describe('the tempo (issue 112)', () => {
  it('starts at 120 BPM, hands it to the engine, and is the page’s: remembered between visits, never in a Patch', () => {
    const storage = memoryStorage();
    const { engine, host } = fakeEngine();
    const tempo = createTempoStore({ storage, engine: host });
    expect(tempo.get()).toEqual({ bpm: 120, player: false });
    expect(engine.handed).toEqual([{ bpm: 120, origin: 5 }]);
    engine.time = 7;
    tempo.set(97.4);
    expect(tempo.get().bpm).toBe(97);
    expect(engine.handed.at(-1)).toEqual({ bpm: 97, origin: 7 });
    expect(createTempoStore({ storage, engine: fakeEngine().host }).get().bpm).toBe(97);
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
    for (const t of [10, 10.6, 11.2, 11.8]) {
      now = t;
      engine.time = t + 100;
      tempo.tap();
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
    expect(tempo.get()).toEqual({ bpm: 128, player: true });
    expect(engine.handed.at(-1)).toEqual({ bpm: 128, origin: 5.3 });
    // Set by hand meanwhile: nothing changes until the player stops.
    tempo.set(150);
    tempo.tap();
    tempo.tap();
    expect(tempo.get().bpm).toBe(128);
    engine.time = 9;
    tempo.giveBack();
    expect(tempo.get()).toEqual({ bpm: 100, player: false });
    expect(engine.handed.at(-1)).toEqual({ bpm: 100, origin: 9 });
    expect(seen).toEqual([128, 100]);
    // Given back when nothing holds it: nothing happens.
    tempo.giveBack();
    expect(seen).toEqual([128, 100]);
  });
});
