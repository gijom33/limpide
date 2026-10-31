import type { Waveform } from '../music/harmonics';
import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { positionToValue, valueToPosition } from '../patch/taper';
import type { ViewerName } from './tutorial';

/**
 * A control the synth turns by itself on a Tour card: a knob or fader along `path`, evenly along its travel, `seconds`
 * for each leg; or the Waveform through `path`, each held `seconds`. Each starts on the Tour's Patch's value, and a
 * knob's path ends there too, so the next move, or the next pass, takes over without a jump.
 */
export type TourMove =
  | { kind: 'param'; id: ParamId; path: number[]; seconds: number }
  | { kind: 'choice'; id: 'waveform'; path: Waveform[]; seconds: number };

/** One Section of the page, in the signal's order, said in three parts while the synth turns its controls (issue 128). */
export interface TourCard {
  title: string;
  /** The first line: where the signal comes from and where it goes next. */
  chain: string;
  /** What the Section does, and what the synth is turning. */
  does: string;
  /** What its Viewers show at that point in the chain. */
  sees: string;
  /** The Viewers the card points at, by their accessible names. */
  viewers: ViewerName[];
  /** A control the card speaks of besides those it turns, brought into view with them where there is room. */
  watch?: ParamId;
  /** What the synth plays over and over while the card is shown, in the Demo's notation (src/demo/phrase.ts). */
  phrase: string;
  bpm: number;
  /** Turned one after the other, then again from the first. */
  moves: TourMove[];
}

/** The Tour's own sound: Init, a saw through an open low-pass Filter (issue 128, decision 6). */
export const TOUR_PATCH = PRESETS[0];

/** The four cards: the Oscillators with the Mixer, the Filter, the Amp, the LFOs (issue 128, decisions 3 and 4). */
export const TOUR: TourCard[] = [
  {
    title: 'Oscillators and Mixer',
    chain: 'The sound starts here: the Oscillators make it, and the Mixer sends it on to the Filter.',
    does: 'An Oscillator plays its Waveform, one cycle after another, as many times a second as the Note’s pitch, and the Waveform sets the timbre. The synth is stepping Osc 1 from Saw to Square to Sine. The Mixer, on its own tab, sets how much of each source goes on: here only Osc 1’s fader is up.',
    sees: 'The Oscillator Scope draws the Waveform; the Oscillator Spectrum, its Harmonics: a saw has every one, a square only the odd ones, a sine just one.',
    viewers: ['Oscillator Scope', 'Oscillator Spectrum'],
    phrase: 'A3:1.5 -:.5 A3:1.5 -:.5 E3:1.5 -:.5 G3:1.5 -:.5',
    bpm: 100,
    moves: [{ kind: 'choice', id: 'waveform', path: ['saw', 'square', 'sine', 'square'], seconds: 2.4 }],
  },
  {
    title: 'Filter',
    chain: 'The Filter takes what the Oscillators make, as the Mixer sends it, and passes it on to the Amp.',
    does: 'It takes Harmonics away. This one is a low-pass: it lets those below its Cutoff through and turns down those above. The synth sweeps the Cutoff down, darker, and back up; then it raises Resonance, which lifts the Harmonics at the Cutoff into a ringing peak.',
    sees: 'On the Filter Spectrum the high Harmonics go away under the Curve as the Cutoff falls, and Resonance raises a bump on the Curve at the Cutoff. The Filter Scope’s shape rounds off.',
    viewers: ['Filter Scope', 'Filter Spectrum'],
    phrase: 'A2:.5 A3:.5 A2:.5 A3:.5 G2:.5 G3:.5 G2:.5 G3:.5',
    bpm: 120,
    moves: [
      { kind: 'param', id: 'cutoff', path: [2000, 150, 2000], seconds: 4 },
      { kind: 'param', id: 'resonance', path: [0.2, 0.8, 0.2], seconds: 3 },
    ],
  },
  {
    title: 'Amp',
    chain: 'The Amp takes the Filter’s sound and sends it on to your speakers.',
    does: 'It sets how loud each Note is over time, following the Amp Envelope: Attack is how long a Note takes to rise once a key goes down, Release how long it takes to fade once the key is let go. The synth lengthens the Attack, then the Release, and brings each back.',
    sees: 'The Amp Scope is what you hear, its height the level: with a long Attack each Note swells in, with a long Release it fades on after the key is up. On the Amp Spectrum the Harmonics rise and fall together.',
    viewers: ['Amp Scope', 'Amp Spectrum'],
    phrase: 'C3:2 -:2 G3:2 -:2',
    bpm: 100,
    moves: [
      { kind: 'param', id: 'ampAttack', path: [0.01, 0.8, 0.01], seconds: 4 },
      { kind: 'param', id: 'ampRelease', path: [0.4, 2, 0.4], seconds: 4 },
    ],
  },
  {
    title: 'LFOs',
    chain: 'The LFOs send no sound down the chain: each one turns a control in it, over and over, by itself.',
    does: 'An LFO is an Oscillator too slow to hear as a pitch, here two cycles a second. LFO 1 is aimed at the Cutoff: as the synth raises its Depth, the dot on the Cutoff knob swings up and down on its own while a Note sounds, and the sound opens and closes with it.',
    sees: 'The Envelope Timeline draws the last few seconds: the Cutoff’s dotted line rising and falling with LFO 1, over each Note’s Amp Envelope.',
    viewers: ['Envelope Timeline'],
    watch: 'cutoff',
    phrase: 'A2:3.5 -:.5 E3:3.5 -:.5',
    bpm: 100,
    moves: [{ kind: 'param', id: 'lfoAmount', path: [0, 0.6, 0.6, 0], seconds: 3 }],
  },
];

/** How long a move takes once through. */
const moveLength = (move: TourMove) => move.seconds * (move.kind === 'param' ? move.path.length - 1 : move.path.length);

/** How long a card's moves take once through, before they start again. */
export const cycleLength = (card: TourCard) => card.moves.reduce((sum, move) => sum + moveLength(move), 0);

/**
 * Where the card's controls are `seconds` after it came up: the one moving now along its path, the others resting on
 * the Tour's Patch's values; and which control is moving.
 */
export function tourAt(card: TourCard, seconds: number): { values: Partial<Patch>; moving: TourMove['id'] } {
  let t = seconds % cycleLength(card);
  let current = card.moves[0];
  for (const move of card.moves) {
    current = move;
    if (t < moveLength(move)) break;
    t -= moveLength(move);
  }
  const values: Partial<Patch> = Object.fromEntries(card.moves.map((m) => [m.id, TOUR_PATCH.patch[m.id]]));
  const leg = Math.min(Math.floor(t / current.seconds), current.path.length - 1);
  if (current.kind === 'choice') values[current.id] = current.path[leg];
  else {
    const def = PARAMS[current.id];
    const [from, to] = [current.path[leg], current.path[Math.min(leg + 1, current.path.length - 1)]];
    const progress = t / current.seconds - leg;
    values[current.id] = progress === 0 ? from : positionToValue(def, valueToPosition(def, from) + (valueToPosition(def, to) - valueToPosition(def, from)) * progress);
  }
  return { values, moving: current.id };
}
