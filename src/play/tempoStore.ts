import { recall, remember } from '../app/displaySettings';
import type { KeyValueStorage } from '../app/storage';
import type { SynthEngine } from '../engine/synthEngine';
import { clampBpm, tappedBpm } from '../music/tempo';

/** The tempo in force: the BPM, and whether a player holds it (the Demo, the Song, the Tour or a Tutorial). */
export interface TempoState {
  bpm: number;
  player: boolean;
}

/**
 * The page's tempo (issue 112, decided by the owner): one BPM, set by hand or by tapping, remembered between visits
 * and never in a Patch. Each change reaches the engine at once, its beats counted again from now. While a player
 * plays, its own BPM is in force, counted from its first beat, and the person's comes back when it stops; meanwhile
 * the person's cannot be set. Built once, in the audio session (ADR-0014).
 */
export function createTempoStore({ storage, engine }: { storage: KeyValueStorage; engine: Pick<SynthEngine, 'setTempo' | 'now'> }) {
  let own = recall(storage, 'tempo').bpm;
  let state: TempoState = { bpm: own, player: false };
  let taps: number[] = [];
  const listeners = new Set<() => void>();
  const update = (next: TempoState, origin?: number) => {
    state = next;
    engine.setTempo(next.bpm, origin);
    for (const listener of listeners) listener();
  };
  const setOwn = (bpm: number, origin?: number) => {
    own = clampBpm(bpm);
    remember(storage, 'tempo', { bpm: own });
    update({ bpm: own, player: false }, origin);
  };
  engine.setTempo(own);
  return {
    get: (): TempoState => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    /** The person's BPM, by hand. */
    set(bpm: number) {
      if (state.player || clampBpm(bpm) === own) return;
      setOwn(bpm);
    },
    /**
     * A tap on Tap, at `time` on the engine's clock: from the second on, the BPM follows the taps, and the beats are
     * counted from the last, so a synced LFO lands where the person tapped.
     */
    tap(time = engine.now()) {
      if (state.player) return;
      taps = [...taps.slice(-7), time];
      const bpm = tappedBpm(taps);
      if (bpm !== undefined) setOwn(bpm, time);
    },
    /** A player starts: its BPM is in force, its beats counted from `origin` (its first, on the engine's clock). */
    take(bpm: number, origin: number) {
      update({ bpm, player: true }, origin);
    },
    /** The player stopped: the person's BPM comes back, its beats counted from now. */
    giveBack() {
      if (state.player) update({ bpm: own, player: false });
    },
  };
}

export type TempoStore = ReturnType<typeof createTempoStore>;
