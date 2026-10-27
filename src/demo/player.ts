import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { type PhraseEvent, parsePhrase, phraseLength } from './phrase';
import { type Part, TRACK, type Track } from './track';

/** What the Demo needs from the app: the audio clock, a way to load a Preset, and the engine's Note calls. */
export interface DemoHost {
  now(): number;
  /** Load the part's Preset, into the engine at once; returns it (its values start the moves). */
  load(part: Part): Patch;
  /** How many Voices the Patch has now, which decides how Notes are released: the person may change it mid-part. */
  voices(): number;
  /** Turn a knob: the Patch's Parameter takes this value now, in the engine too. */
  setParam(id: ParamId, value: number): void;
  /** A knob starts to move: the page may bring it into view. */
  onMove(id: ParamId): void;
  noteOn(note: number, velocity: number, at: number): void;
  /** The track is over: every part has played once. */
  onEnd(): void;
  /** Every Voice releases (one-Voice Presets). */
  noteOff(at: number): void;
  /** The Voice playing `note` releases (several Voices). */
  release(note: number, at: number): void;
  onStep(index: number): void;
  /** The Notes sounding right now, whenever that changes: for the on-screen piano. */
  onNotes(notes: number[]): void;
  /** The octave the on-screen piano should show, so the part's Notes are in view. */
  showOctave(octave: number): void;
}

// Notes are handed to the engine this far ahead of the clock: enough to be on time, little enough to stop quickly.
const LOOKAHEAD = 0.15;
const TICK_MS = 40;
// A breath after pressing Demo before the first Note.
const LEAD_IN = 0.3;
// The next part's Preset loads this long before its bar line, not on the look-ahead: just enough for the engine to
// have its first Notes, while this part's last Notes and their Release keep their own sound (issue 60).
const SWITCH_AHEAD = 0.03;
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
 * handed to the engine, and each part but the last takes a short breath at its end. Knobs are turned on the same look-ahead as the Notes, so a jump on a bar line
 * is in force when that bar's first Note starts. After the last part it ends by itself. Returns the stop function,
 * which silences everything at once.
 */
export function startDemo(host: DemoHost, track: Track = TRACK): () => void {
  const beat = 60 / track.bpm;
  const first = host.now() + LEAD_IN;
  const starts: number[] = [];
  let at = first;
  for (const part of track.parts) {
    starts.push(at);
    at += phraseLength(part.phrase, track.bpm);
  }
  const end = at;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let index = -1;
  let events: (PhraseEvent & { off: number })[] = [];
  let queued = 0;
  let moves: { id: ParamId; from: number; to: number; start: number; end: number; started: boolean; done: boolean }[] = [];
  let shown = '';

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
    events = parsed.map((e) => ({ ...e, time: start + e.time, off: Math.max(start + e.time, Math.min(letGo, start + e.time + e.duration)) }));
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

  /** Hands the engine the current part's Notes that start before `until`. */
  const handOver = (until: number) => {
    while (queued < events.length && events[queued].time < until) {
      // A chord's Notes all start before any of them stops, so the model's history stays in time order.
      const time = events[queued].time;
      let last = queued;
      while (last < events.length && events[last].time === time) last++;
      for (let i = queued; i < last; i++) host.noteOn(events[i].note, events[i].velocity, events[i].time);
      const voices = host.voices();
      for (let i = queued; i < last; i++) if (voices === 1) host.noteOff(events[i].off); else host.release(events[i].note, events[i].off);
      queued = last;
    }
  };

  const lightKeys = (now: number) => {
    const notes = events.filter((e) => e.time <= now && now < e.off).map((e) => e.note);
    const key = notes.join(',');
    if (key !== shown) {
      shown = key;
      host.onNotes(notes);
    }
  };

  const tick = () => {
    const now = host.now();
    if (now >= end) {
      turnKnobs(end);
      host.onNotes([]);
      host.onEnd();
      return;
    }
    const horizon = now + LOOKAHEAD;
    let wait = TICK_MS;
    for (;;) {
      turnKnobs(horizon);
      const boundary = index + 1 < track.parts.length ? starts[index + 1] : Infinity;
      handOver(Math.min(horizon, boundary));
      if (boundary >= horizon) break;
      const switchAt = boundary - SWITCH_AHEAD;
      if (now < switchAt) {
        wait = Math.min(TICK_MS, (switchAt - now) * 1000); // back in time for the switch
        break;
      }
      enter(index + 1);
    }
    lightKeys(now);
    timer = setTimeout(tick, wait);
  };

  enter(0);
  tick();
  return () => {
    clearTimeout(timer);
    const now = host.now();
    host.noteOff(now);
    host.noteOff(now + LOOKAHEAD + 0.05); // and whatever was already handed to the engine
    host.onNotes([]);
  };
}
