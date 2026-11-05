/** A Note's letter as a pitch class (C = 0). */
const PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;
const pitchClasses = (letters: string) => [...letters].map((l) => PITCH_CLASS[l as keyof typeof PITCH_CLASS]);

/** B, E, A, D, as in a bead of water: the mascot's Notes. */
const BEAD = pitchClasses('BEAD');

/** How long a phrase may take, from its first Note to its last: a second a Note (the owner, issue 204). */
const SECONDS_A_NOTE = 1;
/** The longest B, E, A, D may take, in seconds. */
export const CALLING_SECONDS = BEAD.length * SECONDS_A_NOTE;

/**
 * The Notes that call the mascot and send it away (issue 115): B, E, A, D in that order, in any octave, within
 * `CALLING_SECONDS`; or another phrase of pitch classes, within `seconds`. `press` hears each Note the player presses, at `time` in
 * seconds; true when it completes the phrase. A Note out of order starts it over (its first Note, from there).
 */
export function createCallingPhrase(phrase: readonly number[] = BEAD, seconds = CALLING_SECONDS) {
  let heard = 0; // how many of the phrase's Notes have come in order
  let startedAt = 0;
  return {
    press(note: number, time: number): boolean {
      const pitchClass = ((note % 12) + 12) % 12;
      if (heard > 0 && pitchClass === phrase[heard] && time - startedAt <= seconds) heard++;
      else if (pitchClass === phrase[0]) {
        heard = 1;
        startedAt = time;
      } else heard = 0;
      if (heard < phrase.length) return false;
      heard = 0;
      return true;
    },
  };
}

/** The words Bead answers to while it is out (issue 127), spelled with Notes as B, E, A, D is. */
export const WORDS = { dead: 'DEAD', fade: 'FADE', cafe: 'CAFE', deaf: 'DEAF', baggage: 'BAGGAGE' } as const;
export type Word = keyof typeof WORDS;

/**
 * Hears the words (issue 127), each on its own, so a Note may count towards several: `press` gives the word a Note
 * completes, if any, by the same rules as B, E, A, D's, each word within a second a Note from its first to its last: 4 s
 * for the four-Note words, 7 s for BAGGAGE (the owner, issue 204).
 */
export function createWordsHeard() {
  const phrases = (Object.keys(WORDS) as Word[]).map((word) => ({ word, phrase: createCallingPhrase(pitchClasses(WORDS[word]), WORDS[word].length * SECONDS_A_NOTE) }));
  return {
    press(note: number, time: number): Word | null {
      let done: Word | null = null;
      for (const { word, phrase } of phrases) if (phrase.press(note, time)) done ??= word;
      return done;
    },
  };
}
