import { parsePhrase, phraseLength, type PhraseEvent } from './phrase';
import { TOUR, type TourStop } from './tour';

/** What the Demo needs from the app: the audio clock, a way to load a Preset, and the engine's Note calls. */
export interface DemoHost {
  now(): number;
  /** Load the stop's Preset; returns how many Voices it has (one means the Notes must not overlap). */
  load(stop: TourStop): number;
  noteOn(note: number, velocity: number, at: number): void;
  /** The tour is over: every stop has played once. */
  onEnd(): void;
  /** Every Voice releases (one-Voice Presets). */
  noteOff(at: number): void;
  /** The Voice playing `note` releases (several Voices). */
  release(note: number, at: number): void;
  onStep(index: number): void;
}

// Notes are handed to the engine this far ahead of the clock: enough to be on time, little enough to stop quickly.
const LOOKAHEAD = 0.15;
const TICK_MS = 40;
// A breath after loading a Preset before its phrase, and after the phrase before the next Preset.
const LEAD_IN = 0.4;
const GAP = 0.6;

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

  const step = () => {
    index += 1;
    if (index >= tour.length) {
      clearTimeout(timer);
      host.onEnd();
      return false;
    }
    const stop = tour[index];
    voices = host.load(stop);
    host.onStep(index);
    const start = host.now() + LEAD_IN;
    events = parsePhrase(stop.phrase, stop.bpm).map((e) => ({ ...e, time: start + e.time, off: start + e.time + e.duration }));
    queued = 0;
    end = start + phraseLength(stop.phrase, stop.bpm) + GAP;
    return true;
  };

  const tick = () => {
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
  };
}
