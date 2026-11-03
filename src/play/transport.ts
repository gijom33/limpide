import { backgroundTimers } from './ticker';

/** A Note a player plays: when it starts and ends on the audio clock, in seconds. */
export interface Played {
  note: number;
  velocity: number;
  on: number;
  off: number;
}

/** What the Transport needs from the app: the audio clock and the engine's Note calls, and the piano's keys. */
export interface TransportHost {
  now(): number;
  noteOn(note: number, velocity: number, at: number): void;
  /** The Voice playing `note` releases; on one Voice, the Gate closes if `note` is the one sounding. */
  release(note: number, at: number): void;
  /** Every Voice releases at `at`, a Note handed over for later included: for stopping. */
  noteOff(at: number): void;
  /** The Notes sounding right now, whenever that changes: left out where the piano lights its own keys (Hold). */
  onNotes?(notes: number[]): void;
  /** The source is over. */
  onEnd?(): void;
  /** The player's tempo, its beats counted from its first Note, `first`, on the audio clock (issue 112). */
  onTempo?(bpm: number, first: number): void;
}

/** Waits `ms`, then calls `fn`; returns what cancels it. */
export interface Timers {
  after(ms: number, fn: () => void): () => void;
}

/**
 * While the page is hidden, Notes are handed over this far ahead (seconds): a browser may still wake a background page
 * only about once a second, and every Note due before the next wake must already be with the engine (issue 198).
 */
export const BACKGROUND_LOOKAHEAD = 2;

const pageHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * A player, asked on every tick: it hands `play` the Notes that start before `horizon`, in time order, and returns
 * 'end' once it is over, or how soon (in ms) to be asked again when that is sooner than the next tick.
 */
export type Source = (horizon: number, now: number, play: (notes: readonly Played[]) => void) => 'end' | number | undefined;

/**
 * Plays a source's Notes on the audio clock (issue 75): each Note is handed to the engine once it is within the
 * look-ahead, its start and then its end, a chord's starts before any of its ends, so the model's history stays in
 * time order. The keys of the Notes sounding are lit. Returns the stop function, which silences everything at once,
 * including what was already handed over.
 * Its ticks come from timers the browser does not slow in the background (issue 198); while the page is hidden the
 * look-ahead widens to `BACKGROUND_LOOKAHEAD`, in case they are slowed all the same, and narrows again in front, so a
 * Stop or a change of Preset is still heard at once.
 */
export function startTransport(
  host: TransportHost,
  source: Source,
  { lookahead, tick, timers = backgroundTimers(), hidden = pageHidden }: { lookahead: number; tick: number; timers?: Timers; hidden?: () => boolean },
): () => void {
  let cancel: (() => void) | undefined;
  let sounding: Played[] = [];
  let shown = '';
  let now = host.now();

  const play = (handed: readonly Played[]) => {
    // A Note already past its start is dropped: played now, it would come late, with others in a burst (issue 198).
    const notes = handed.filter((n) => n.on >= now);
    for (let i = 0; i < notes.length; ) {
      let last = i;
      while (last < notes.length && notes[last].on === notes[i].on) last++;
      for (let k = i; k < last; k++) host.noteOn(notes[k].note, notes[k].velocity, notes[k].on);
      for (let k = i; k < last; k++) host.release(notes[k].note, notes[k].off);
      i = last;
    }
    if (host.onNotes) sounding.push(...notes);
  };

  const light = () => {
    if (!host.onNotes) return;
    sounding = sounding.filter((n) => n.off > now);
    const lit = sounding.filter((n) => n.on <= now).map((n) => n.note);
    const key = lit.join(',');
    if (key !== shown) {
      shown = key;
      host.onNotes(lit);
    }
  };

  const step = () => {
    now = host.now();
    const next = source(now + (hidden() ? BACKGROUND_LOOKAHEAD : lookahead), now, play);
    if (next === 'end') {
      cancel = undefined;
      host.onNotes?.([]);
      host.onEnd?.();
      return;
    }
    light();
    cancel = timers.after(typeof next === 'number' ? Math.min(next, tick) : tick, step);
  };

  step();
  return () => {
    cancel?.();
    host.noteOff(host.now()); // the engine's Note Off closes the Notes already handed over too (issue 101)
    host.onNotes?.([]);
  };
}
