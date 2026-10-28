import { GLIDE_OFF, type ParamId } from '../patch/patch';

/**
 * The Demo: one original track, played by the synth alone, so the Viewers show everything heard. Each part is a
 * Preset, loaded on the bar line so the music never stops; the builds and drops are knobs turning. The same every
 * time (ADR-0002 keeps the Viewers out of React; the Demo keeps the Display out of its hands: it only plays).
 */
/** A knob turned while the part plays: from one value (the Preset's own, if none is given) to another. */
export interface KnobMove {
  id: ParamId;
  from?: number;
  to: number;
  /** In beats from the part's start; the whole part when left out. A move that starts and ends together is a jump. */
  start?: number;
  end?: number;
}

export interface Part {
  preset: string;
  phrase: string;
  moves?: KnobMove[];
  /** What to hear and see, in plain words, shown while the part plays (issue 50). */
  caption?: string;
}

export interface Track {
  bpm: number;
  parts: readonly Part[];
}

const BPM = 128;
/** LFO Rates that land on the beat at the track's tempo, in Hz: a quarter Note, an eighth, a sixteenth, a thirty-second. */
const SYNC = { quarter: BPM / 60, eighth: (BPM / 60) * 2, sixteenth: (BPM / 60) * 4, thirtySecond: (BPM / 60) * 8 };

const times = (text: string, n: number) => Array(n).fill(text).join(' ');
/** One bar of sixteenths: a Note name is a soft step, `!` after it an accent, `-` a rest. */
const sixteenths = (steps: string) =>
  steps.split(' ').map((s) => (s === '-' ? '-:.25' : s.endsWith('!') ? `${s.slice(0, -1)}:.25@1` : `${s}:.25@.6`)).join(' ');
/** One bar of an arpeggio over a chord's four Notes, low to high: up, down and up again in sixteenths. */
const arpeggio = (chord: string) => {
  const [a, b, c, d] = chord.split(' ');
  const cell = [`${a}:.25@1`, `${c}:.25@.6`, `${d}:.25@.8`, `${c}:.25@.6`, `${b}:.25@.9`, `${c}:.25@.6`, `${d}:.25@.8`, `${c}:.25@.6`];
  return times(cell.join(' '), 2);
};
/** One bar of the wobble bass: the root held, struck again, then the octave to close the bar. */
const wobbleBar = (root: string, octave: string) => `${root}:1.5@1 ${root}:.5 ${root}:.75 ${root}:.75 ${octave}:.5@1`;
/** Five stabs across the bar, pushed off the beat. */
const pushedStabs = (chord: string) => `${chord}:.5@1 -:.25 ${chord}:.5 -:.25 ${chord}:.5@1 -:.5 ${chord}:.5 -:.25 ${chord}:.5@1 -:.25`;
/** One bar of electric-piano comping: the chord struck three times, the second softer, across the bar. */
const comp = (chord: string) => `${chord}:1.5@.8 ${chord}:1@.55 ${chord}:1.5@.7`;
/** An LFO Rate that changes on bar lines: [bar, Hz] pairs, each a jump. */
const rateByBar = (steps: [number, number][]): KnobMove[] => steps.map(([bar, hz]) => ({ id: 'lfoRate', to: hz, start: bar * 4, end: bar * 4 }));

// Mostly the root and its octave, the same bar over and over with one Note changed: hypnotic rather than busy.
const acidA = sixteenths('A1! - A1 A2 A1 - A2! A1 - A1 C2! A1 A2 - G1 A1');
const acidB = sixteenths('A1! - A1 A2 A1 - A2! A1 - A1 E2! A1 A2 - G2! A1');
const acidEnd = sixteenths('A1! - A1 A2 A1 - A2! A1 - A1 E2! A1 A2 - - -');

// Every part after the first plays over Am–F–C–G, a bar each: the four chords of a great deal of modern dance music.
export const TRACK: Track = {
  bpm: BPM,
  parts: [
    // The intro: four on the floor, a fill into the bass. The Filter Envelope's drop deepens, then the Decay lengthens.
    // It starts at the Preset's own drop, from 440 Hz: from lower, the first hits were below what a phone plays.
    { preset: 'Kick', phrase: `${times('C2:1@1 C2:1@1 C2:1@1 C2:1@1', 3)} C2:1@1 C2:1@1 C2:.5@1 C2:.5@.7 C2:.25@.6 C2:.25@.7 C2:.25@.8 C2:.25@1`,
      caption: 'A kick drum, made by the synth: a tone that falls fast in pitch, each hit a little deeper.',
      moves: [{ id: 'filterEnvAmount', from: 3, to: 4.5 }, { id: 'ampDecay', from: 0.25, to: 0.6, start: 8 }] },
    // The build: an acid line, its accents biting, without Glide (here it would slide into every Note). The Cutoff
    // opens and the Resonance climbs, so the Response Curve's peak walks up through the Harmonics; then the Filter
    // Envelope's Decay lengthens and the squelch grows.
    { preset: 'Acid', phrase: [times(acidA, 4), times(acidB, 3), acidEnd].join(' '),
      caption: 'The Filter opens bit by bit and starts to ring: a squelchy, talking bass line.',
      moves: [
        { id: 'cutoff', from: 180, to: 1500 },
        { id: 'glide', to: GLIDE_OFF, start: 0, end: 0 },
        { id: 'resonance', from: 0.55, to: 0.8 },
        { id: 'filterDecay', from: 0.12, to: 0.3, start: 16 },
      ] },
    // The hook: an arpeggio on six Voices. The Pulse Width narrows and the Spectrum's gaps slide along the ladder; then
    // the plucks bloom as the Filter Envelope's Decay lengthens.
    { preset: 'Poly Pluck', caption: 'Notes plucked like strings, several at once. The pulse narrows and the sound turns thin and glassy.', phrase: times(['A3 C4 E4 A4', 'A3 C4 F4 A4', 'G3 C4 E4 G4', 'G3 B3 D4 G4'].map(arpeggio).join(' '), 2),
      moves: [{ id: 'pulseWidth', from: 0.5, to: 0.1, end: 16 }, { id: 'filterDecay', from: 0.18, to: 0.5, start: 16 }, { id: 'cutoff', from: 500, to: 1400, start: 16 }] },
    // The break: the chords held by a string section, the Pulse Width shimmer quickening until it buzzes.
    { preset: 'Strings', caption: 'Held chords that shimmer, the shimmer speeding up until it buzzes.', phrase: 'A2+E3+A3+C4+E4:4 F2+C3+A3+C4+F4:4 C3+G3+C4+E4+G4:4 G2+D3+G3+B3+D4:4',
      moves: [{ id: 'lfoRate', from: 0.7, to: SYNC.sixteenth }, { id: 'lfoAmount', from: 0.5, to: 0.8 }] },
    // The lift (issue 60): an electric piano on the same chords, LFO 1 on Volume. The tremolo locks to the beat in
    // eighths and deepens, then quickens to sixteenths for the last two bars, into the riser.
    { preset: 'Tremolo Keys', caption: 'An electric piano with tremolo: an LFO on Volume makes the chords pulse in time, deeper and deeper. The Amp Scope swells and shrinks with it.',
      phrase: times(['A3+C4+E4', 'F3+A3+C4', 'G3+C4+E4', 'G3+B3+D4'].map(comp).join(' '), 2),
      moves: [...rateByBar([[0, SYNC.eighth], [6, SYNC.sixteenth]]), { id: 'lfoAmount', from: 0.2, to: 0.8, end: 24 }] },
    // The riser: a Filter singing on its own, its Cutoff swept across the whole Spectrum while the LFO trembles
    // faster and faster; then a beat of silence.
    { preset: 'Self-Oscillation', caption: 'No Oscillator at all: the Filter sings on its own as it sweeps from low to high.', phrase: 'A2:7@1 -:1',
      moves: [{ id: 'cutoff', from: 300, to: 12000, end: 7 }, { id: 'lfoAmount', from: 0, to: 0.3, end: 7 }, { id: 'lfoRate', from: SYNC.quarter, to: SYNC.thirtySecond, end: 7 }] },
    // The drop: a wobble bass, its LFO restarted by every Note and set to the beat: eighths, quickening to sixteenths
    // at the end of each four bars. Its Depth grows from a gentle sway, on a milder Resonance than the Preset's.
    { preset: 'Wobble', caption: 'A slow wave opens and closes the Filter in time with the beat: the wobble.', phrase: times([wobbleBar('A1', 'A2'), wobbleBar('F1', 'F2'), wobbleBar('C2', 'C3'), wobbleBar('G1', 'G2')].join(' '), 2),
      moves: [
        ...rateByBar([[0, SYNC.eighth], [3, SYNC.sixteenth], [4, SYNC.eighth], [7, SYNC.sixteenth]]),
        { id: 'lfoAmount', from: 0.3, to: 0.5 },
        { id: 'resonance', to: 0.45, start: 0, end: 0 },
      ] },
    // The break (issue 60): held chords on a pad whose Filter Envelope takes seconds to open, so the Effective Cutoff
    // climbs across the Timeline under each chord.
    { preset: 'Sweep Pad', caption: 'A pad whose Filter opens over seconds: watch the Cutoff climb across the Timeline under each chord.',
      phrase: 'A2+E3+A3+C4:8 F2+C3+F3+A3:8',
      moves: [{ id: 'resonance', from: 0.5, to: 0.65 }] },
    // The hook again (issue 60), brighter: the Cutoff opens wide and the Pulse Width comes back to square, so the
    // Filter Spectrum fills up to the top and the even Harmonics fall away again.
    { preset: 'Poly Pluck', caption: 'The hook again, brighter: the Filter opens wide and the Spectrum fills to the top.', phrase: times(['A3 C4 E4 A4', 'A3 C4 F4 A4', 'G3 C4 E4 G4', 'G3 B3 D4 G4'].map(arpeggio).join(' '), 2),
      moves: [{ id: 'cutoff', from: 1400, to: 5000, end: 24 }, { id: 'filterDecay', to: 0.45, start: 0, end: 0 }, { id: 'pulseWidth', from: 0.1, to: 0.5, start: 16 }] },
    // The end: brass stabs pushed off the beat, brightening, then the first chord again, left to ring.
    { preset: 'Brass Section', caption: 'Brass chords that brighten as the Filter opens, then the first chord again, left to ring.', phrase: `${['A2+E3+A3+C4+E4', 'F2+C3+F3+A3+C4', 'C3+E3+G3+C4+E4', 'G2+D3+G3+B3+D4'].map(pushedStabs).join(' ')} A2+E3+A3+C4+E4:4@1 -:4`,
      moves: [{ id: 'cutoff', from: 500, to: 2500, end: 16 }, { id: 'filterEnvAmount', from: 2, to: 3.5, end: 16 }] },
  ],
};

/** What the welcome plays on a shared sound, untouched: four bars of a riff over the same chords, one Note at a time. */
export const SHARED_RIFF =
  'A3:.5 C4:.5 E4:.5 A4:.5 G4:.75 E4:.75 C4:.5 F4:.5 C4:.5 A3:.5 C4:.5 F4:.75 E4:.75 C4:.5 ' +
  'E4:.5 C4:.5 G3:.5 C4:.5 E4:.75 G4:.75 E4:.5 D4:.5 B3:.5 G3:.5 B3:.5 D4:1 -:1';
