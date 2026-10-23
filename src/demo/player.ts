import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { parsePhrase, phraseLength, type PhraseEvent } from './phrase';
import { TOUR, type TourStop } from './tour';

/** What the Demo needs from the app: the audio clock, a way to load a Preset, and the engine's Note calls. */
export interface DemoHost {
  now(): number;
  /** Load the stop's Preset; returns it (its Voices decide how Notes are released; its values start the moves). */
  load(stop: TourStop): Patch;
  /** Turn a knob: the Patch's Parameter takes this value now. */
  setParam(id: ParamId, value: number): void;
  noteOn(note: number, velocity: number, at: number): void;
  /** The tour is over: every stop has played once. */
  onEnd(): void;
  /** Every Voice releases (one-Voice Presets). */
  noteOff(at: number): void;
  /** The Voice playing `note` releases (several Voices). */
  release(note: number, at: number): void;
  onStep(index: number): void;
  /** The Notes sounding right now, whenever that changes: for the on-screen piano. */
  onNotes(notes: number[]): void;
  /** The octave the on-screen piano should show, so the stop's phrase is in view. */
  showOctave(octave: number): void;
}

// Notes are handed to the engine this far ahead of the clock: enough to be on time, little enough to stop quickly.
const LOOKAHEAD = 0.15;
const TICK_MS = 40;
// A breath after loading a Preset before its phrase, and after the phrase before the next Preset.
const LEAD_IN = 0.3;
const GAP = 0.4;

/**
 * Plays the tour once: for each stop, load its Preset, play its phrase on the audio clock, move on; after the
 * last, it ends by itself. Returns the stop function, which silences everything at once.
 */
export function startDemo(host: DemoHost, tour: readonly TourStop[] = TOUR): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let index = -1;
  let events: (PhraseEvent & { off: number })[] = [];
  let queued = 0;
  let end = 0;
  let voices = 1;
  let moves: { id: ParamId; from: number; to: number; start: number; end: number; done: boolean }[] = [];
  let shown = '';

  const step = () => {
    index += 1;
    if (index >= tour.length) {
      clearTimeout(timer);
      host.onNotes([]);
      host.onEnd();
      return false;
    }
    const stop = tour[index];
    const patch = host.load(stop);
    voices = patch.voices;
    host.onStep(index);
    const lowest = Math.min(...parsePhrase(stop.phrase, stop.bpm).map((e) => e.note));
    host.showOctave(Math.floor(lowest / 12) - 1); // the piano's C is the lowest Note's octave
    const start = host.now() + LEAD_IN;
    const beat = 60 / stop.bpm;
    const length = phraseLength(stop.phrase, stop.bpm);
    events = parsePhrase(stop.phrase, stop.bpm).map((e) => ({ ...e, time: start + e.time, off: start + e.time + e.duration }));
    moves = (stop.moves ?? []).map((m) => ({
      id: m.id,
      from: valueToPosition(PARAMS[m.id], m.from ?? patch[m.id]),
      to: valueToPosition(PARAMS[m.id], m.to),
      start: start + (m.start ?? 0) * beat,
      end: start + (m.end === undefined ? length : m.end * beat),
      done: false,
    }));
    queued = 0;
    end = start + length + GAP;
    return true;
  };

  const turnKnobs = () => {
    const now = host.now();
    for (const m of moves) {
      if (m.done || now < m.start) continue;
      const progress = Math.min(1, (now - m.start) / Math.max(1e-6, m.end - m.start));
      host.setParam(m.id, positionToValue(PARAMS[m.id], m.from + (m.to - m.from) * progress));
      if (progress >= 1) m.done = true;
    }
  };

  const lightKeys = () => {
    const now = host.now();
    const notes = events.filter((e) => e.time <= now && now < e.off).map((e) => e.note);
    const key = notes.join(',');
    if (key !== shown) {
      shown = key;
      host.onNotes(notes);
    }
  };

  const tick = () => {
    turnKnobs();
    lightKeys();
    const horizon = host.now() + LOOKAHEAD;
    while (queued < events.length && events[queued].time < horizon) {
      // A chord's Notes all start before any of them stops, so the model's history stays in time order.
      const at = events[queued].time;
      let last = queued;
      while (last < events.length && events[last].time === at) last++;
      for (let i = queued; i < last; i++) host.noteOn(events[i].note, events[i].velocity, events[i].time);
      for (let i = queued; i < last; i++) if (voices === 1) host.noteOff(events[i].off); else host.release(events[i].note, events[i].off);
      queued = last;
    }
    if (host.now() >= end && !step()) return;
    timer = setTimeout(tick, TICK_MS);
  };

  step();
  tick();
  return () => {
    clearTimeout(timer);
    const now = host.now();
    host.noteOff(now);
    host.noteOff(now + LOOKAHEAD + 0.05); // and whatever was already handed to the engine
    host.onNotes([]);
  };
}
