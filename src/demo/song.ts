import { startTransport, type TransportHost } from '../play/transport';
import { loopPhrase } from './phrase';

/** What the Song needs from the app besides the Transport's clock, Notes and keys: the piano's octave. */
export interface SongHost extends TransportHost {
  /** The piano's octave: its first key is this octave's C. */
  octave(): number;
  onNotes(notes: number[]): void;
}

const times = (text: string, n: number) => Array(n).fill(text).join(' ');
const staccato = (notes: string) => notes.split(' ').map((n) => `${n}:.25 -:.25`).join(' ');
/** The low Note on each beat, the chord on each offbeat. */
const offbeatStabs = (low: string, chord: string) => times(`${low}:.25 -:.25 ${chord}:.25 -:.25`, 4);
/** Five stabs across the bar, pushed off the beat. */
const pushedStabs = (chord: string) => `${chord}:.5 -:.25 ${chord}:.5 -:.25 ${chord}:.5 -:.5 ${chord}:.5 -:.25 ${chord}:.5 -:.25`;

/**
 * The Song: house in C minor over Cm–A♭–E♭–B♭, sixteen bars that loop. It only uses the 13 keys from the piano's C
 * to the C above (all a phone shows), written from C4, so every Note lights a key; it moves with the piano's octave.
 * A staccato pumping line; the beat on the low keys with chord stabs on the offbeats; a syncopated hook; the stabs
 * pushed off the beat. In every chord the top Note comes last, so on one Voice the chords still play a line.
 */
export const SONG = {
  bpm: 124,
  phrase: [
    staccato('C4 G4 C4 Eb4 C4 G4 C4 Bb4 C4 Ab4 C4 Eb4 C4 Ab4 C4 C5 Eb4 Bb4 Eb4 G4 Eb4 Bb4 Eb4 G4 D4 Bb4 D4 F4 D4 Bb4 D4 F4'),
    offbeatStabs('C4', 'C4+Eb4+G4'),
    offbeatStabs('C4', 'C4+Eb4+Ab4'),
    offbeatStabs('Eb4', 'Eb4+G4+Bb4'),
    offbeatStabs('D4', 'D4+F4+Bb4'),
    'G4:.75 Bb4:.75 C5:1 Bb4:.5 G4:1 Ab4:.75 G4:.75 Eb4:1 F4:.5 G4:1',
    'G4:.75 Bb4:.75 C5:1 Bb4:.5 C5:.5 Bb4:.5 G4:.5 F4:.5 Eb4:.5 D4:.5 Eb4:.5 F4:.5 D4:1',
    pushedStabs('Eb4+G4+C5'),
    pushedStabs('Eb4+Ab4+C5'),
    pushedStabs('Eb4+G4+Bb4'),
    pushedStabs('D4+F4+Bb4'),
  ].join(' '),
};
/** The octave the Song is written for. */
const WRITTEN_OCTAVE = 4;

// Notes are handed to the engine this far ahead of the clock: enough to be on time, little enough to stop quickly.
const LOOKAHEAD = 0.15;
const TICK_MS = 40;
const LEAD_IN = 0.2;

/**
 * Plays the Song on a loop until stopped, on whatever Patch is loaded. A Note takes the piano's octave of the moment it
 * falls due. Returns the stop function, which silences everything at once.
 */
export function startSong(host: SongHost): () => void {
  const source = loopPhrase(SONG.phrase, SONG.bpm, host.now() + LEAD_IN, { transpose: () => 12 * (host.octave() - WRITTEN_OCTAVE) });
  return startTransport(host, source, { lookahead: LOOKAHEAD, tick: TICK_MS });
}
