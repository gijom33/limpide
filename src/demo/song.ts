import { parsePhrase, phraseLength } from './phrase';

/** What the Song needs from the app: the audio clock, the piano's octave, the Patch's Voices and the engine's Note calls. */
export interface SongHost {
  now(): number;
  /** The piano's octave: its first key is this octave's C. */
  octave(): number;
  /** How many Voices the Patch has now, which decides how Notes end: the person may change it while the Song plays. */
  voices(): number;
  noteOn(note: number, velocity: number, at: number): void;
  /** Every Voice releases (one Voice). */
  noteOff(at: number): void;
  /** The Voice playing `note` releases (several Voices). */
  release(note: number, at: number): void;
  /** The Notes sounding right now, whenever that changes: for the on-screen piano. */
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

type Step = { time: number; on: boolean; id: number; note: number; velocity: number };

/**
 * Plays the Song on a loop until stopped, on whatever Patch is loaded. Each Note's start and end go to the engine in
 * time order; a Note takes the octave and the Voices of the moment it starts, and ends as it started. Returns the
 * stop function, which silences everything at once.
 */
export function startSong(host: SongHost): () => void {
  const steps: Step[] = parsePhrase(SONG.phrase, SONG.bpm).flatMap((e, id) => [
    { time: e.time, on: true, id, note: e.note, velocity: e.velocity },
    { time: e.time + e.duration, on: false, id, note: e.note, velocity: 0 },
  ]);
  // Ends before starts at the same moment; a chord's Notes keep their order, so its top Note starts last.
  steps.sort((a, b) => a.time - b.time || Number(a.on) - Number(b.on));
  const length = phraseLength(SONG.phrase, SONG.bpm);

  let start = host.now() + LEAD_IN;
  let next = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sounding = new Map<number, { note: number; oneVoice: boolean; from: number; to: number }>();
  let shown = '';

  const tick = () => {
    const now = host.now();
    while (start + steps[next].time < now + LOOKAHEAD) {
      const step = steps[next];
      const at = start + step.time;
      if (step.on) {
        const note = step.note + 12 * (host.octave() - WRITTEN_OCTAVE);
        host.noteOn(note, step.velocity, at);
        sounding.set(step.id, { note, oneVoice: host.voices() === 1, from: at, to: Infinity });
      } else {
        const played = sounding.get(step.id)!;
        if (played.oneVoice) host.noteOff(at);
        else host.release(played.note, at);
        played.to = at;
      }
      if (++next === steps.length) {
        next = 0;
        start += length;
      }
    }
    const lit: number[] = [];
    for (const [id, played] of sounding) {
      if (played.to <= now) sounding.delete(id);
      else if (played.from <= now) lit.push(played.note);
    }
    const key = lit.join(',');
    if (key !== shown) {
      shown = key;
      host.onNotes(lit);
    }
    timer = setTimeout(tick, TICK_MS);
  };

  tick();
  return () => {
    clearTimeout(timer);
    const now = host.now();
    host.noteOff(now);
    host.noteOff(now + LOOKAHEAD + 0.05); // and whatever was already handed to the engine
    host.onNotes([]);
  };
}
