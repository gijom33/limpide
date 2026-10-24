/** Clicks on Hold this close together (seconds) are taps of a rhythm rather than switching it off. */
export const TAP_GAP = 2;

/** A tapped rhythm: the time from each tap to the next, the last to where it starts over; and its beat. */
export interface Rhythm {
  gaps: number[];
  beat: number;
}

/**
 * The Hold button's clicks. The first switches Hold on; clicks soon after it, before any Note is held, keep Hold on
 * and tap a rhythm. Every tap plays; after the last, at least a beat of rest, and the rhythm starts over on the next
 * beat, so it loops in time. The beat is the typical time between taps (the median), so a little unevenness in the
 * tapping does not throw it. The first Note held sets the rhythm; after that, or after a longer pause, a click
 * switches Hold off.
 */
export function createHoldTaps() {
  let hold = false;
  let taps: number[] = [];
  let recording = false;

  return {
    /** A click on Hold at `now` (seconds), with or without Notes held; returns whether Hold is on. */
    press(now: number, notesHeld = false): boolean {
      if (!hold) {
        hold = true;
        taps = [now];
        recording = !notesHeld;
      } else if (recording && now - taps[taps.length - 1] <= TAP_GAP) {
        taps.push(now);
      } else {
        hold = false;
        taps = [];
        recording = false;
      }
      return hold;
    },
    noteArrived() {
      recording = false;
    },
    /** The tapped rhythm, or null with fewer than two taps. */
    rhythm(): Rhythm | null {
      if (taps.length < 2) return null;
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const beat = [...gaps].sort((a, b) => a - b)[Math.floor((gaps.length - 1) / 2)];
      const span = taps[taps.length - 1] - taps[0];
      // The last tap's beat and a beat of rest, then on to the next beat (a little slack for uneven tapping).
      const beats = Math.ceil(span / beat + 2 - 0.3);
      return { gaps: [...gaps, beats * beat - span], beat };
    },
  };
}

/** What the rhythm player needs from the app: the audio clock, the Notes held, the Voices and the engine's Note calls. */
export interface RhythmHost {
  now(): number;
  /** The Notes held now (keys down and Notes Hold keeps), oldest first. */
  notes(): number[];
  voices(): number;
  noteOn(note: number, velocity: number, at: number): void;
  /** The Voice playing `note` releases (several Voices). */
  release(note: number, at: number): void;
  /** Every Voice releases (one Voice). */
  noteOff(at: number): void;
}

// Notes are handed to the engine this far ahead of the clock.
const LOOKAHEAD = 0.1;
const TICK_MS = 25;
/** Each tap's Notes sound for this fraction of the time to the next tap, so every tap strikes anew. */
const GATE = 0.85;
const VELOCITY = 0.9;

/**
 * Plays the held Notes on a tapped rhythm, looping, from the moment a Note is held. On one Voice, every tap plays
 * the newest held Note; on several, taps alternate one Note at a time, each held Note in turn, and the whole chord.
 * A Note sounds for at most a beat, so longer gaps, like the rest at the end, are heard as rests. While no Note is
 * held it waits, and starts the rhythm over when one is. Returns the stop function.
 */
export function startRhythm(host: RhythmHost, { gaps, beat }: Rhythm): () => void {
  let next: number | null = null; // when the next tap plays; null while nothing is held
  let step = 0;
  let single = 0; // which held Note the next single-Note tap plays
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = () => {
    const now = host.now();
    if (!host.notes().length) {
      next = null;
      step = 0;
      single = 0;
    } else {
      next ??= now;
      while (next < now + LOOKAHEAD) {
        const notes = host.notes();
        const oneVoice = host.voices() === 1;
        const play = oneVoice ? [notes[notes.length - 1]] : step % 2 === 0 ? [notes[single++ % notes.length]] : notes;
        const gap = gaps[step % gaps.length];
        const end = next + Math.min(gap, beat) * GATE;
        for (const note of play) host.noteOn(note, VELOCITY, next);
        if (oneVoice) host.noteOff(end);
        else for (const note of play) host.release(note, end);
        next += gap;
        step++;
      }
    }
    timer = setTimeout(tick, TICK_MS);
  };

  tick();
  return () => {
    clearTimeout(timer);
    const now = host.now();
    host.noteOff(now);
    host.noteOff(now + LOOKAHEAD + 0.05); // and whatever was already handed to the engine
  };
}
