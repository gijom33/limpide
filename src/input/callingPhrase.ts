/** C, A, D, E: the Notes hidden in the name, as pitch classes (C = 0). */
const PHRASE = [0, 9, 2, 4];

/** The longest the phrase may take, from its first Note to its last, in seconds. */
export const CALLING_SECONDS = 4;

/**
 * The Notes that call the mascot and send it away (issue 115): C, A, D, E in that order, in any octave, within
 * `CALLING_SECONDS`. `press` hears each Note the player presses, at `time` in seconds; true when it completes the
 * phrase. A Note out of order starts it over (a C, from its first Note).
 */
export function createCallingPhrase() {
  let heard = 0; // how many of the phrase's Notes have come in order
  let startedAt = 0;
  return {
    press(note: number, time: number): boolean {
      const pitchClass = ((note % 12) + 12) % 12;
      if (heard > 0 && pitchClass === PHRASE[heard] && time - startedAt <= CALLING_SECONDS) heard++;
      else if (pitchClass === PHRASE[0]) {
        heard = 1;
        startedAt = time;
      } else heard = 0;
      if (heard < PHRASE.length) return false;
      heard = 0;
      return true;
    },
  };
}
