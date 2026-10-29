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
  /** Every Voice releases: for stopping. */
  noteOff(at: number): void;
  /** The Notes sounding right now, whenever that changes: left out where the piano lights its own keys (Hold). */
  onNotes?(notes: number[]): void;
  /** The source is over. */
  onEnd?(): void;
}

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
 */
export function startTransport(host: TransportHost, source: Source, { lookahead, tick }: { lookahead: number; tick: number }): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sounding: Played[] = [];
  let shown = '';

  const play = (notes: readonly Played[]) => {
    for (let i = 0; i < notes.length; ) {
      let last = i;
      while (last < notes.length && notes[last].on === notes[i].on) last++;
      for (let k = i; k < last; k++) host.noteOn(notes[k].note, notes[k].velocity, notes[k].on);
      for (let k = i; k < last; k++) host.release(notes[k].note, notes[k].off);
      i = last;
    }
    if (host.onNotes) sounding.push(...notes);
  };

  const light = (now: number) => {
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
    const now = host.now();
    const next = source(now + lookahead, now, play);
    if (next === 'end') {
      timer = undefined;
      host.onNotes?.([]);
      host.onEnd?.();
      return;
    }
    light(now);
    timer = setTimeout(step, typeof next === 'number' ? Math.min(next, tick) : tick);
  };

  step();
  return () => {
    clearTimeout(timer);
    const now = host.now();
    host.noteOff(now);
    host.noteOff(now + lookahead + 0.05); // and whatever was already handed to the engine
    host.onNotes?.([]);
  };
}
