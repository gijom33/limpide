import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { type Played, type Source, startTransport, type TransportHost } from '../play/transport';
import { loopPhrase, parsePhrase, phraseLength } from './phrase';
import { type Part, TRACK, type Track } from './track';

/** What Listen needs from the app: the Transport's clock, Notes and keys, and the piano's octave. */
export interface ListenHost extends TransportHost {
  onNotes(notes: number[]): void;
  /** The octave the on-screen piano should show, so the part's Notes are in view. */
  showOctave(octave: number): void;
}

/** What the Demo needs from the app besides: a way to load a Preset, turn its knobs, and say where it is. */
export interface DemoHost extends ListenHost {
  /** Load the part's Preset, into the engine at once; returns it (its values start the moves). */
  load(part: Part): Patch;
  /** Turn a knob: the Patch's Parameter takes this value now, in the engine too. */
  setParam(id: ParamId, value: number): void;
  /** A knob starts to move: the page may bring it into view. */
  onMove(id: ParamId): void;
  onStep(index: number): void;
  /** The track is over: every part has played once. */
  onEnd(): void;
}

// Notes are handed to the engine this far ahead of the clock: enough to be on time, little enough to stop quickly.
const LOOKAHEAD = 0.15;
const TICK_MS = 40;
// A breath after pressing Demo before the first Note.
const LEAD_IN = 0.3;
// The next part's Preset loads this long before its bar line, not on the look-ahead: just enough for the engine to
// have its first Notes, while this part's last Notes and their Release keep their own sound (issue 60).
const SWITCH_AHEAD = 0.05;
// Every part but the last lets go of its Notes this long before its end, in beats: a breath before the next sound.
const BREATH = 1 / 8;

/** The piano shows 17 keys from its C: the octave whose keys show the most of these Notes (the highest, if tied). */
export function octaveShowing(notes: number[]): number {
  let best = 0;
  let most = -1;
  for (let octave = 0; octave <= 7; octave++) {
    const low = 12 * (octave + 1);
    const shown = notes.filter((n) => n >= low && n <= low + 16).length;
    if (shown >= most) {
      most = shown;
      best = octave;
    }
  }
  return best;
}

/**
 * Plays the track once, without a break: each part's Preset is loaded at its bar line, just before its first Note is
 * handed to the engine, and each part but the last takes a short breath at its end. Knobs are turned on the same
 * look-ahead as the Notes, so a jump on a bar line is in force when that bar's first Note starts. After the last part it
 * ends by itself. Returns the stop function, which silences everything at once. `from` starts it at that part (the
 * card's dots, the owner): the parts before it are skipped.
 */
export function startDemo(host: DemoHost, track: Track = TRACK, from = 0): () => void {
  const beat = 60 / track.bpm;
  const first = host.now() + LEAD_IN;
  const starts: number[] = [];
  let at = first;
  for (const [i, part] of track.parts.entries()) {
    starts.push(at);
    if (i >= from) at += phraseLength(part.phrase, track.bpm);
  }
  const end = at;

  let index = -1;
  let notes: Played[] = [];
  let queued = 0;
  let moves: { id: ParamId; from: number; to: number; start: number; end: number; started: boolean; done: boolean }[] = [];

  const enter = (i: number) => {
    index = i;
    const part = track.parts[i];
    const start = starts[i];
    const length = phraseLength(part.phrase, track.bpm);
    const patch = host.load(part);
    host.onStep(i);
    const parsed = parsePhrase(part.phrase, track.bpm);
    host.showOctave(octaveShowing(parsed.map((e) => e.note)));
    const letGo = i < track.parts.length - 1 ? start + length - BREATH * beat : Infinity;
    notes = parsed.map((e) => ({
      note: e.note,
      velocity: e.velocity,
      on: start + e.time,
      off: Math.max(start + e.time, Math.min(letGo, start + e.time + e.duration)),
    }));
    queued = 0;
    moves = (part.moves ?? []).map((m) => ({
      id: m.id,
      from: valueToPosition(PARAMS[m.id], m.from ?? patch[m.id]),
      to: valueToPosition(PARAMS[m.id], m.to),
      start: start + (m.start ?? 0) * beat,
      end: start + (m.end === undefined ? length : m.end * beat),
      started: false,
      done: false,
    }));
  };

  /** Every move where it should be at `time`; the first to start is shown. */
  const turnKnobs = (time: number) => {
    let moving: ParamId | null = null;
    for (const m of moves) {
      if (m.done || time < m.start) continue;
      if (!m.started) {
        m.started = true;
        moving ??= m.id;
      }
      const progress = Math.min(1, (time - m.start) / Math.max(1e-6, m.end - m.start));
      host.setParam(m.id, positionToValue(PARAMS[m.id], m.from + (m.to - m.from) * progress));
      if (progress >= 1) m.done = true;
    }
    if (moving) host.onMove(moving);
  };

  // Each part's Notes are played before the next part's Preset loads, so they keep their own sound (issue 60).
  const source: Source = (horizon, now, play) => {
    if (now >= end) {
      turnKnobs(end);
      return 'end';
    }
    for (;;) {
      turnKnobs(horizon);
      const boundary = index + 1 < track.parts.length ? starts[index + 1] : Infinity;
      let last = queued;
      while (last < notes.length && notes[last].on < Math.min(horizon, boundary)) last++;
      play(notes.slice(queued, last));
      queued = last;
      if (boundary >= horizon) return;
      const switchAt = boundary - SWITCH_AHEAD;
      if (now < switchAt) return Math.max(5, (switchAt - now) * 1000); // back in time for the switch, without spinning
      enter(index + 1);
    }
  };

  enter(from);
  return startTransport(host, source, { lookahead: LOOKAHEAD, tick: TICK_MS });
}

/**
 * A Tutorial's Listen: its phrase over and over on the Patch as it is, from a breath after pressing it, each pass
 * letting go a breath before its end as the Demo's parts do, with the piano on the phrase's octave.
 */
export function startPhraseLoop(host: ListenHost, { phrase, bpm }: { phrase: string; bpm: number }): () => void {
  host.showOctave(octaveShowing(parsePhrase(phrase, bpm).map((e) => e.note)));
  return startTransport(host, loopPhrase(phrase, bpm, host.now() + LEAD_IN, { breath: BREATH }), { lookahead: LOOKAHEAD, tick: TICK_MS });
}
