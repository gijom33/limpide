import { workerTimers } from './workerTimers';

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
 * While the page is hidden, a player whose Notes are all known ahead (the Song, Listen) hands them over this far ahead
 * (seconds): should a browser slow even the worker's ticks to about once a second, every Note due before the next must
 * already be with the engine (issue 198).
 */
export const BACKGROUND_LOOKAHEAD = 2;

const pageHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * A player, asked on every tick: it hands `play` the Notes that start before `horizon`, in time order, and returns
 * 'end' once it is over, or how soon (in ms) to be asked again when that is sooner than the next tick. One that widens
 * its look-ahead in the background can be rewound: it then hands again the Notes from `from` on (issue 227).
 */
export type Source = ((horizon: number, now: number, play: (notes: readonly Played[]) => void) => 'end' | number | undefined) & {
  rewind?(from: number): void;
};

/**
 * Plays a source's Notes on the audio clock (issue 75): each Note is handed to the engine once it is within the
 * look-ahead, its start and then its end, a chord's starts before any of its ends, so the model's history stays in
 * time order. The keys of the Notes sounding are lit. Returns the stop function, which silences everything at once,
 * including what was already handed over.
 * Its ticks come from timers the browser does not slow in the background (issue 198). While the page is hidden the
 * look-ahead may widen to `background`, in case they are slowed all the same, and narrows again in front, so a Stop or
 * a change of Preset is still heard at once: back in front, the Notes handed further ahead than the short look-ahead
 * are taken back (the Gate closed at the first one's start, which ends a Note still sounding then too) and made again
 * as they fall due, with the Patch and octave of then (issue 227).
 */
export function startTransport(
  host: TransportHost,
  source: Source,
  {
    lookahead,
    tick,
    background = lookahead,
    timers = workerTimers(),
    hidden = pageHidden,
  }: { lookahead: number; tick: number; background?: number; timers?: Timers; hidden?: () => boolean },
): () => void {
  let cancel: (() => void) | undefined;
  let sounding: Played[] = [];
  let shown = '';
  let now = host.now();
  // The starts of the Notes handed over that have not started yet.
  let ahead: number[] = [];

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
    ahead.push(...notes.map((n) => n.on));
    if (host.onNotes) sounding.push(...notes);
  };

  /** In front, the Notes handed over beyond the short look-ahead (while the page was hidden) are taken back. */
  const takeBack = () => {
    ahead = ahead.filter((on) => on >= now);
    if (hidden() || !source.rewind) return;
    const later = ahead.filter((on) => on >= now + lookahead);
    if (!later.length) return;
    const from = Math.min(...later);
    host.noteOff(from);
    source.rewind(from);
    ahead = ahead.filter((on) => on < from);
    sounding = sounding.filter((n) => n.on < from);
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
    takeBack();
    const next = source(now + (hidden() ? background : lookahead), now, play);
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
