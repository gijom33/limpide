import { keyToNote } from '../input/keyboardLayout';

/** The computer keyboard's range: C to the E above (17 keys, 10 of them white). */
const LETTER_KEYS = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon'];
const LETTER_WHITES = 10;
/** A finger's target: a white key is never wider. */
const WHITE_KEY_MAX = 44;
const HIGHEST_NOTE = 127;

export const isBlack = (note: number) => [1, 3, 6, 8, 10].includes(note % 12);

/**
 * How many white keys the piano has in `room` pixels, and how wide each is (issue 154, decision 6): the letter keys'
 * 10 sharing the room up to 44 px each, then one more white key whenever the room holds more than half of one, so
 * the keys are never wider than 44 px and, once there are more than 10, never under 42. What is left, under one key,
 * stays empty.
 */
export function fitPiano(room: number): { whites: number; keyWidth: number } {
  const whites = Math.max(LETTER_WHITES, Math.round(room / WHITE_KEY_MAX));
  return { whites, keyWidth: Math.min(WHITE_KEY_MAX, Math.floor((room / whites) * 100) / 100) };
}

/**
 * The piano's Notes, low to high, for `whites` white keys: the letter keys' 17 from C of `octave`, then upward a white
 * key at a time with the black keys between, ending on a white key and never past the highest MIDI Note. The keys
 * beyond the letter keys play by pointer, touch or MIDI (issue 154).
 */
export function pianoNotes(octave: number, whites: number): number[] {
  const notes = LETTER_KEYS.map((code) => keyToNote(code, octave)!);
  let white = LETTER_WHITES;
  for (let note = notes.at(-1)! + 1; white < whites && note <= HIGHEST_NOTE; note++) {
    notes.push(note);
    if (!isBlack(note)) white++;
  }
  if (isBlack(notes.at(-1)!)) notes.pop(); // a white key last
  return notes;
}

/** How many white keys the piano draws for `whites`: fewer near the top, where its keys stop at the highest Note. */
export const whiteKeys = (octave: number, whites: number) => pianoNotes(octave, whites).filter((note) => !isBlack(note)).length;
