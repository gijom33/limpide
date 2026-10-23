/**
 * A phrase is a line of music in a small notation, one token per step, separated by spaces:
 *   `C3:1`        a Note for one beat
 *   `C3+E3+G3:2`  a chord for two beats
 *   `-:1`         a rest for one beat
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
    const [notes, beats] = token.split(':');
    const length = Number(beats);
    if (!(length > 0)) throw new Error(`Each step needs a length in beats: ${token}`);
    if (notes !== '-') for (const name of notes.split('+')) events.push({ time: at * beat, duration: length * beat * GATE, note: noteNumber(name), velocity });
    at += length;
  }
  return events;
}

/** How long a phrase lasts, in seconds: its last step's end. */
export function phraseLength(text: string, bpm: number): number {
  return text
    .trim()
    .split(/\s+/)
    .reduce((beats, token) => beats + Number(token.split(':')[1]), 0) * (60 / bpm);
}
