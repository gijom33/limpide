import type { Played, Source } from '../play/transport';


/**
 * A phrase is a line of music in a small notation, one token per step, separated by spaces:
 *   `C3:1`        a Note for one beat
 *   `C3+E3+G3:2`  a chord for two beats
 *   `-:1`         a rest for one beat
 *   `C3:1@0.5`    a Note played at half Velocity (the default is 0.9)
 * Note names are letter, optional # or b, octave (C4 = MIDI 60; A4 = 440 Hz, as everywhere in Limpide).
 */
export interface PhraseEvent {
  /** Seconds from the phrase's start. */
  time: number;
  /** How long the Note is held, in seconds. */
  duration: number;
  note: number;
  velocity: number;
}

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "C4" → 60, "F#2" → 42, "Bb3" → 58. */
export function noteNumber(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`Not a Note name: ${name}`);
  const [, letter, accidental, octave] = m;
  return (Number(octave) + 1) * 12 + SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
}

/** Notes end this fraction of the way through their step, so repeated Notes retrigger cleanly. */
const GATE = 0.85;

export function parsePhrase(text: string, bpm: number, velocity = 0.9): PhraseEvent[] {
  const beat = 60 / bpm;
  const events: PhraseEvent[] = [];
  let at = 0;
  for (const token of text.trim().split(/\s+/)) {
    const [notes, rest] = token.split(':');
    const [beats, accent] = (rest ?? '').split('@');
    const length = Number(beats);
    if (!(length > 0)) throw new Error(`Each step needs a length in beats: ${token}`);
    const v = accent === undefined ? velocity : Number(accent);
    if (!(v > 0 && v <= 1)) throw new Error(`A Velocity is between 0 and 1: ${token}`);
    if (notes !== '-') for (const name of notes.split('+')) events.push({ time: at * beat, duration: length * beat * GATE, note: noteNumber(name), velocity: v });
    at += length;
  }
  return events;
}

/** How long a phrase lasts, in seconds: its last step's end. */
export function phraseLength(text: string, bpm: number): number {
  return text
    .trim()
    .split(/\s+/)
    .reduce((beats, token) => beats + Number(token.split(':')[1].split('@')[0]), 0) * (60 / bpm);
}

/**
 * A phrase on a loop for the Transport (the Song, a Tutorial's Listen), from `start` on the audio clock, each pass
 * straight after the last. A Note still sounding `breath` beats before a pass ends is let go then; `transpose`, in
 * semitones, is read as each Note falls due (the Song follows the piano's octave from the next Note).
 */
export function loopPhrase(
  phrase: string,
  bpm: number,
  start: number,
  { breath = 0, transpose = () => 0 }: { breath?: number; transpose?(): number } = {},
): Source {
  const events = parsePhrase(phrase, bpm);
  const length = phraseLength(phrase, bpm);
  const letGo = length - breath * (60 / bpm);
  let pass = start;
  let next = 0;
  return (horizon, _now, play) => {
    const due: Played[] = [];
    while (pass + events[next].time < horizon) {
      const e = events[next];
      const on = pass + e.time;
      due.push({ note: e.note + transpose(), velocity: e.velocity, on, off: Math.max(on, Math.min(pass + letGo, on + e.duration)) });
      if (++next === events.length) {
        next = 0;
        pass += length;
      }
    }
    play(due);
  };
}
