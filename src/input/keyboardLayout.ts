// Piano layout on a QWERTY keyboard: home row = white keys, row above = black keys.
const SEMITONE_BY_CODE: Record<string, number> = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7,
  KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16,
};

/** MIDI note for a `KeyboardEvent.code`, with KeyA as C of `octave` (C4 = 60). */
export function keyToNote(code: string, octave: number): number | undefined {
  const semitone = SEMITONE_BY_CODE[code];
  return semitone === undefined ? undefined : 12 * (octave + 1) + semitone;
}
