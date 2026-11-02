import type { PhraseAtTempo } from '../demo/phrase';
import type { Waveform } from '../music/harmonics';
import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { positionToValue, valueToPosition } from '../patch/taper';
import type { ViewerName } from './tutorial';

/**
 * A control the synth turns by itself on a Tour card: a knob or fader along `path`, evenly along its travel, `seconds`
 * for each leg (or a length for each, in turn); or the Waveform through `path`, each held `seconds`. Each starts on the
 * Tour's Patch's value, and a knob's path ends there too, so the next move, or the next pass, takes over without a jump.
 */
export type TourMove =
  | { kind: 'param'; id: ParamId; path: number[]; seconds: number | number[] }
  | { kind: 'choice'; id: 'waveform'; path: Waveform[]; seconds: number };

/**
 * One Section of the page, in the signal's order, said on its card in four parts while the synth turns its controls
 * (issue 128). Its phrase, in the Demo's notation (src/demo/phrase.ts), at its tempo, is what the synth plays over and
 * over while the card is shown.
 */
export interface TourSection extends PhraseAtTempo {
  title: string;
  /**
   * The first line: what to watch now, while the synth turns its controls. It is all a folded card shows on a phone,
   * so it says what to look at, not where the Section sits (issue 129).
   */
  look: string;
  /** Where the signal comes from and where it goes next. */
  chain: string;
  /** What the Section does, and what the synth is turning. */
  does: string;
  /** What its Viewers show at that point in the chain. */
  sees: string;
  /** The Viewers the card points at, by their accessible names, the first brought into view first where not all fit. */
  viewers: ViewerName[];
  /** Turned one after the other, then again from the first. */
  moves: TourMove[];
  /**
   * When the synth freezes the Viewers, in seconds from the start of the moves' cycle, and what the card names on the
   * frozen picture meanwhile, left to right (issue 130).
   */
  freezes?: { at: number; seconds: number; names: string[] }[];
}

/** The Tour's own sound: Init, a saw through an open low-pass Filter (issue 128, decision 6). */
export const TOUR_PATCH = PRESETS[0];

/**
 * One pass of the Amp card (issue 130, decisions 2 and 3), in seconds, at 60 BPM, where a beat is a second: the synth
 * turns one stage of the Amp Envelope over `turn`; the Note goes down at `note`, carrying the change, and has faded by
 * `freeze`, when the Viewers freeze for `frozen`; then the stage goes back, by `length`. Each Note fits, onset to fade,
 * in the 2 s the Envelope Timeline shows by default.
 */
const PASS = { bpm: 60, turn: 1, note: 1.5, freeze: 3.2, frozen: 3, length: 7 };

/**
 * The Amp card's passes, one per stage: where the synth takes it, how many beats its Note's step lasts (held 85 % of
 * it: long enough to show the stage, short enough to fade before the freeze), and what the card names on the frozen
 * picture, the stage just changed (decision 3).
 */
const STAGES: { id: ParamId; to: number; beats: number; name: string }[] = [
  { id: 'ampAttack', to: 0.6, beats: 1.3, name: 'up: Attack' },
  { id: 'ampDecay', to: 1, beats: 1.3, name: 'down to a level: Decay' },
  { id: 'ampSustain', to: 0.3, beats: 1.2, name: 'held: Sustain' },
  { id: 'ampRelease', to: 1, beats: 0.6, name: 'let go: Release' },
];

/** One stage of the Amp Envelope taken to `to` for its pass, then given back. */
const stageMove = ({ id, to }: (typeof STAGES)[number]): TourMove => {
  const from = TOUR_PATCH.patch[id] as number;
  return { kind: 'param', id, path: [from, to, to, from], seconds: [PASS.turn, PASS.freeze + PASS.frozen - PASS.turn, PASS.length - PASS.freeze - PASS.frozen] };
};

/** Each pass's Note, a rest before it while the stage turns and one after while it fades and the picture freezes. */
const stagePhrase = STAGES.map(({ beats }) => `-:${PASS.note} C3:${beats} -:${+(PASS.length - PASS.note - beats).toFixed(2)}`).join(' ');

/** The four cards: the Oscillators with the Mixer, the Filter, the Amp, the LFOs (issue 128, decisions 3 and 4). */
export const TOUR: TourSection[] = [
  {
    title: 'Oscillators and Mixer',
    look: 'Watch the wave change shape: the synth is switching Osc 1 from Saw to Square to Sine.',
    chain: 'The sound starts here: the Oscillators make it, and the Mixer sends it on to the Filter, the sound’s tone knob.',
    does: 'An Oscillator makes a sound by drawing one wave shape, its Waveform, over and over, hundreds of times a second. How fast sets the pitch; the shape sets the colour of the sound. The Mixer, on its own tab, sets how loud each one is.',
    sees: 'The top picture, the Oscillator Scope, draws the wave’s shape. The one below, the Oscillator Spectrum, shows its Harmonics, the stack of pitches every Note is made of, one line each: a saw has them all, so it buzzes; a square every other one, so it sounds hollow; a sine just the Note, so it sounds pure.',
    viewers: ['Oscillator Scope', 'Oscillator Spectrum'],
    phrase: 'A3:1.5 -:.5 A3:1.5 -:.5 E3:1.5 -:.5 G3:1.5 -:.5',
    bpm: 100,
    moves: [{ kind: 'choice', id: 'waveform', path: ['saw', 'square', 'sine', 'square'], seconds: 2.4 }],
  },
  {
    title: 'Filter',
    look: 'Watch the lines on the Filter Spectrum sink as the synth turns the Cutoff down, and come back as it turns it up.',
    chain: 'The Filter takes what the Oscillators make and passes it on to the Amp, the volume stage.',
    does: 'A Filter is a tone knob you can sweep. This one is a low-pass, which lets the low pitches through and turns the high ones down, above a point called the Cutoff. Lower Cutoff, darker sound. Then the synth raises Resonance, which lifts the Harmonics right at the Cutoff into a ringing peak.',
    sees: 'On the Filter Spectrum, the dashed line is the Filter’s shape: the lines under its slope get shorter, and Resonance raises a bump on it at the Cutoff. On the Filter Scope, the wave’s corners round off.',
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
    look: 'Watch the Envelope Timeline: before each Note the synth changes one stage, and the picture freezes to show its shape.',
    chain: 'The Amp takes the Filter’s sound and sends it on to your speakers.',
    does: 'The Amp sets how loud each Note is, moment by moment, with its Envelope, a shape over time: a Note’s life story in four stages. Attack, how fast it rises once the key goes down. Decay, how fast it then falls back to a steady level. Sustain, that level, held while the key stays down. Release, how long it fades once you let go. The Filter has an Envelope of its own too, the same four stages opening and closing the Filter instead of changing the loudness.',
    sees: 'Once each Note has faded, the pictures freeze for a moment: the Envelope Timeline, the last few seconds drawn left to right, shows the shape the Note took. The Amp Scope is what you hear, its height the loudness; on the Amp Spectrum all the lines rise and fall together.',
    // The Timeline first: on a phone it is far below the Amp's Viewers, and it alone is brought into view (issue 130).
    viewers: ['Envelope Timeline', 'Amp Scope', 'Amp Spectrum'],
    phrase: stagePhrase,
    bpm: PASS.bpm,
    moves: STAGES.map(stageMove),
    // After the last, all four, left to right.
    freezes: STAGES.map((stage, i) => ({
      at: i * PASS.length + PASS.freeze,
      seconds: PASS.frozen,
      names: i === STAGES.length - 1 ? STAGES.map((s) => s.name) : [stage.name],
    })),
  },
  {
    title: 'LFOs',
    look: 'Watch the dotted line on the Envelope Timeline: it rises and falls as an LFO swings the Cutoff.',
    chain: 'The LFOs send no sound down the chain: each one turns a control in it, over and over, by itself.',
    does: 'An LFO is an Oscillator too slow to hear as a pitch: here it swings twice a second, like a slow, invisible hand on a knob. LFO 1 is aimed at the Cutoff. As the synth turns up its Depth, how far it swings, the Cutoff starts moving on its own, and the sound opens and closes with it.',
    sees: 'The Envelope Timeline, the last few seconds drawn left to right, shows the Cutoff as a dotted line: watch it rise and fall with LFO 1, over each Note’s Amp Envelope.',
    viewers: ['Envelope Timeline'],
    phrase: 'A2:3.5 -:.5 E3:3.5 -:.5',
    bpm: 100,
    moves: [{ kind: 'param', id: 'lfoAmount', path: [0, 0.6, 0.6, 0], seconds: 3 }],
  },
];

/** What the last card says after its own words, pointing on to the first Tutorial. */
export const TOUR_END = 'That is the whole chain. Now build a sound yourself: the Bass Tutorial goes through it one control at a time.';

/** How long each leg of a move takes: a knob's from one point of its path to the next, a Waveform's held. */
const legsOf = (move: TourMove) =>
  typeof move.seconds === 'number' ? Array<number>(move.kind === 'param' ? move.path.length - 1 : move.path.length).fill(move.seconds) : move.seconds;

/** How long a move takes once through. */
const moveLength = (move: TourMove) => legsOf(move).reduce((sum, leg) => sum + leg, 0);

/** How long a card's moves take once through, before they start again. */
export const cycleLength = (card: TourSection) => card.moves.reduce((sum, move) => sum + moveLength(move), 0);

/**
 * Where the card's controls are `seconds` after its phrase's first beat: the one moving now along its path, the others
 * resting on the Tour's Patch's values; which control is moving; and what the card names while the synth freezes the
 * Viewers, or null while they run.
 */
export function tourAt(card: TourSection, seconds: number): { values: Partial<Patch>; moving: TourMove['id']; naming: string[] | null } {
  const inCycle = seconds % cycleLength(card);
  const naming = card.freezes?.find((f) => inCycle >= f.at && inCycle < f.at + f.seconds)?.names ?? null;
  let t = inCycle;
  let current = card.moves[0];
  for (const move of card.moves) {
    current = move;
    if (t < moveLength(move)) break;
    t -= moveLength(move);
  }
  const values: Partial<Patch> = Object.fromEntries(card.moves.map((m) => [m.id, TOUR_PATCH.patch[m.id]]));
  const legs = legsOf(current);
  let leg = 0;
  for (; leg < legs.length - 1 && t >= legs[leg]; leg++) t -= legs[leg];
  if (current.kind === 'choice') values[current.id] = current.path[leg];
  else {
    const def = PARAMS[current.id];
    const [from, to] = [current.path[leg], current.path[Math.min(leg + 1, current.path.length - 1)]];
    const progress = Math.min(1, t / legs[leg]);
    values[current.id] = progress === 0 || from === to ? from : positionToValue(def, valueToPosition(def, from) + (valueToPosition(def, to) - valueToPosition(def, from)) * progress);
  }
  return { values, moving: current.id, naming };
}
