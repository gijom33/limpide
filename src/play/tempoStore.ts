import { recall, remember } from '../app/rememberedSettings';
import type { KeyValueStorage } from '../app/storage';
import type { SynthEngine } from '../engine/synthEngine';
import { CLOCK_TIMEOUT, type ClockTempo, createClockFollower } from '../midi/clock';
import type { ClockMessage } from '../midi/parser';
import { clampBpm, TAPS, tappedBpm } from '../music/tempo';

/**
 * The tempo in force: the BPM, whether a player holds it (the Demo, the Song, the Tour or a Tutorial), and whether a
 * MIDI clock sets it (issue 136).
 */
export interface TempoState {
  bpm: number;
  player: boolean;
  midi: boolean;
}

/**
 * A clock's beats moved by less than this on the engine's clock are left as they are: the audio clock moves in steps
 * of 128 samples (about 3 ms), so the same beat, taken over from the page's clock, seems to move by that much.
 */
const CLOCK_SLACK = 0.004;

/**
 * The page's tempo (issue 112, decided by the owner): one BPM, set by hand or by tapping, remembered between visits
 * and never in a Patch. Each change reaches the engine at once, its beats counted again from now. While a player
 * plays, its own BPM is in force, counted from its first beat, and the person's comes back when it stops; meanwhile
 * the person's cannot be set. A MIDI clock from any input sets it too (issue 136), its BPM and beats the clock's, and
 * meanwhile the person's cannot be set; when its ticks stop, its last BPM stays and is the person's. A player still
 * holds the tempo while it plays, and the clock's comes back after. Built once, in the audio session (ADR-0014).
 */
export function createTempoStore({
  storage,
  engine,
  clock = () => performance.now() / 1000,
}: {
  storage: KeyValueStorage;
  engine: Pick<SynthEngine, 'setTempo' | 'now'>;
  /**
   * The page's clock, in seconds, which times the taps and a MIDI clock's ticks: the audio clock stands still until
   * sound is allowed.
   */
  clock?: () => number;
}) {
  let own = recall(storage, 'tempo').bpm;
  let state: TempoState = { bpm: own, player: false, midi: false };
  let taps: number[] = [];
  // A MIDI clock: the input followed, its last tick, and the tempo it sets, on the engine's clock, once it has one.
  const follower = createClockFollower();
  let source: string | null = null;
  let lastTick = -Infinity;
  let heard: ClockTempo | null = null;
  let watch: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const update = (next: TempoState, origin?: number) => {
    state = next;
    engine.setTempo(next.bpm, origin);
    for (const listener of listeners) listener();
  };
  const keep = (bpm: number) => {
    own = clampBpm(bpm);
    remember(storage, 'tempo', { bpm: own });
  };
  const setOwn = (bpm: number, origin?: number) => {
    keep(bpm);
    update({ bpm: own, player: false, midi: false }, origin);
  };
  /** No tick for a second: the clock stopped, its last BPM and beats stay, the person's from now. */
  const watchClock = () => {
    watch = undefined;
    const idle = clock() - lastTick;
    if (idle < CLOCK_TIMEOUT) {
      watch = setTimeout(watchClock, (CLOCK_TIMEOUT - idle) * 1000);
      return;
    }
    follower.lost();
    source = null;
    if (!heard) return;
    const { bpm, origin } = heard;
    heard = null;
    keep(bpm);
    if (!state.player) update({ bpm, player: false, midi: false }, origin);
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
      if (state.player || heard || clampBpm(bpm) === own) return;
      setOwn(bpm);
    },
    /**
     * A tap on Tap, timed by the page's clock: from the second on, the BPM follows the taps, and the beats are counted
     * from the last, on the engine's clock, so a synced LFO lands where the person tapped.
     */
    tap() {
      if (state.player || heard) return;
      taps = [...taps.slice(1 - TAPS), clock()];
      const bpm = tappedBpm(taps);
      if (bpm !== undefined) setOwn(bpm, engine.now());
    },
    /** A player starts: its BPM is in force, its beats counted from `origin` (its first, on the engine's clock). */
    take(bpm: number, origin: number) {
      update({ bpm, player: true, midi: false }, origin);
    },
    /** The player stopped: a running clock's tempo comes back, on its beats, else the person's, counted from now. */
    giveBack() {
      if (!state.player) return;
      if (heard) update({ bpm: heard.bpm, player: false, midi: true }, heard.origin);
      else update({ bpm: own, player: false, midi: false });
    },
    /**
     * A MIDI clock's message from the input `from`, at `time` on the page's clock (issue 136). The first input to tick
     * is followed until its ticks stop; another's are ignored meanwhile. A Start counts the beats again from the next
     * tick; between a Stop and a Continue the count stands still, the clock's place in its track with it.
     */
    midiClock(type: ClockMessage['type'], time: number, from: string) {
      if (source !== null && from !== source) return;
      if (type === 'start') return follower.start();
      if (type === 'stop') return follower.stop();
      if (type === 'continue') return follower.resume();
      source = from;
      lastTick = time;
      if (watch === undefined) watch = setTimeout(watchClock, CLOCK_TIMEOUT * 1000);
      const beat = follower.tick(time);
      if (!beat) return;
      const origin = engine.now() - (clock() - beat.origin);
      if (heard && heard.bpm === beat.bpm && Math.abs(heard.origin - origin) < CLOCK_SLACK) return;
      heard = { bpm: beat.bpm, origin };
      if (!state.player) update({ bpm: heard.bpm, player: false, midi: true }, origin);
    },
  };
}

export type TempoStore = ReturnType<typeof createTempoStore>;
