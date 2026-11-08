import type { PhraseAtTempo } from '../demo/phrase';
import type { Waveform } from '../music/harmonics';
import { PARAMS, type ParamId, type Patch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { positionToValue, valueToPosition } from '../patch/taper';
import type { Overlay } from '../viewers/overlays';
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
  /**
   * The Viewers the card points at, by their accessible names, the first brought into view first where not all fit;
   * where they and the control moving do not fit together, the page shows each in turn (`tourAt`'s `looking`, issue 206).
   */
  viewers: ViewerName[];
  /** Turned one after the other, then again from the first. */
  moves: TourMove[];
  /**
   * When the synth freezes the Viewers, in seconds from the start of the moves' cycle, and what the card names on the
   * frozen picture meanwhile, left to right (issue 130).
   */
  freezes?: { at: number; seconds: number; names: string[] }[];
}

/** What the page shows where a card's moving control and its Viewers do not fit on screen together (issue 206). */
export type Looking = 'control' | 'viewer';

/** The Tour's own sound: Init, a saw through a low-pass Filter at 2 kHz (issue 128, decision 6). */
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
 * picture, the stage just changed (decision 3): its name first, then what it is, as the card says it (issue 190).
 */
const STAGES: { id: ParamId; to: number; beats: number; name: string; gloss?: string }[] = [
  { id: 'ampAttack', to: 0.6, beats: 1.3, name: 'Attack', gloss: 'the rise' },
  { id: 'ampDecay', to: 1, beats: 1.3, name: 'Decay', gloss: 'the fall to a steady level' },
  { id: 'ampSustain', to: 0.3, beats: 1.2, name: 'Sustain', gloss: 'that level held' },
  // The last pass names all four by name alone.
  { id: 'ampRelease', to: 1, beats: 0.6, name: 'Release' },
];

/** One stage of the Amp Envelope taken to `to` for its pass, then given back. */
const stageMove = ({ id, to }: (typeof STAGES)[number]): TourMove => {
  const from = TOUR_PATCH.patch[id] as number;
  return { kind: 'param', id, path: [from, to, to, from], seconds: [PASS.turn, PASS.freeze + PASS.frozen - PASS.turn, PASS.length - PASS.freeze - PASS.frozen] };
};

/** Each pass's Note, a rest before it while the stage turns and one after while it fades and the picture freezes. */
const stagePhrase = STAGES.map(({ beats }) => `-:${PASS.note} C3:${beats} -:${+(PASS.length - PASS.note - beats).toFixed(2)}`).join(' ');

/**
 * The four Sections' cards: the Oscillators with the Mixer, the Filter, the Amp, the LFOs (issue 128, decisions 3 and 4);
 * the Tour's last cards follow them (`TOUR_FINDS`, issue 210).
 */
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
    does: 'The Amp sets how loud each Note is, moment by moment, with its Envelope, a shape over time: a Note’s life story in four stages. Attack, how fast it rises once the key goes down. Decay, how fast it then falls back to a steady level. Sustain, that level, held while the key stays down. Release, how long it fades once you let go. The Filter has an Envelope of its own too, opening and closing it the same way.',
    sees: 'Once each Note has faded, the pictures freeze for a moment: the Envelope Timeline, the last few seconds, shows the shape the Note took. On the Amp Spectrum, all the lines rise and fall together.',
    // The Timeline first: on a phone it is far below the Amp's Viewers and faders, and it alone is brought into view while
    // the picture shows the Note's shape and freezes (issues 130 and 206).
    viewers: ['Envelope Timeline', 'Amp Scope', 'Amp Spectrum'],
    phrase: stagePhrase,
    bpm: PASS.bpm,
    moves: STAGES.map(stageMove),
    // After the last, all four by name, left to right.
    freezes: STAGES.map((stage, i) => ({
      at: i * PASS.length + PASS.freeze,
      seconds: PASS.frozen,
      names: i === STAGES.length - 1 ? STAGES.map((s) => s.name) : [`${stage.name}, ${stage.gloss}`],
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

/**
 * A card after the Sections (issue 210): something else there is to find, or to play (issue 260), said in a few lines,
 * and the control on the page where it is found, which the card shows and the synth leaves as it is: an option in
 * Display's panel (its button standing for it while the panel is shut), or a button in the header.
 */
export interface TourFind {
  title: string;
  /** The first line, all a folded card shows on a phone: what to look at (issue 129). */
  look: string;
  /** What it is, and how to use it. */
  says: string[];
  /** The control it shows. */
  shows: { kind: 'display'; overlay: Overlay } | { kind: 'header'; name: 'Tutorial' | 'Song' };
  /**
   * What its own button starts: the first Tutorial, offered beside Next; or the Song, the card's way out in place of
   * Next, which ends the Tour (issue 260).
   */
  starts?: 'firstTutorial' | 'song';
}

/**
 * The Tour's last cards, after the Sections (issue 210, decided by the owner): the Synth Geek Layer with its History
 * lines, then the Tutorials, which offer the first, Sub Ladder (issue 233); then the last card, something to play, whose
 * way out is the Song (issue 260), so a newcomer leaves the Tour playing, not on the geek extras.
 */
export const TOUR_FINDS: TourFind[] = [
  {
    title: 'Synth Geek Layer',
    look: 'Find the ringed Display button: its Geek toggle, a pair of glasses, turns on the Synth Geek Layer.',
    says: [
      'The Synth Geek Layer shows the numbers under the hood, for the curious: levels in decibels, how many times a second each Scope’s wave repeats. It stays off until you switch it on.',
      'With it on, the tips grow too: rest on a control, or hold it with a finger, and some give the formula behind it, a wave’s Harmonics among them, and most end with a History, where the control comes from, the instruments and people it came through.',
    ],
    shows: { kind: 'display', overlay: 'geek' },
  },
  {
    title: 'Tutorials',
    look: 'Find the ringed Tutorial button: each Tutorial in it has you rebuild one of the Presets yourself.',
    says: [
      'The Presets are Limpide’s ready-made sounds. A Tutorial starts from Init, a plain sound, and has you build one back step by step: you turn each control, and hear and see what it does.',
      'To build one yourself, start with Sub Ladder: it plays each wave in turn and shows its own Harmonics.',
    ],
    shows: { kind: 'header', name: 'Tutorial' },
    starts: 'firstTutorial',
  },
  {
    title: 'Your turn',
    look: 'Now play the piano’s keys, or press the ringed Song for a tune to play over.',
    says: [
      'On a computer the letter keys play too, from A.',
      'That is the whole Tour. As the Song plays, flip the Presets with › beside the sound’s name, or turn a knob, and hear the sound change under the tune.',
    ],
    shows: { kind: 'header', name: 'Song' },
    starts: 'song',
  },
];

/** How many cards the Tour has: a Section's each, then what else there is to find, and to play. */
export const TOUR_LENGTH = TOUR.length + TOUR_FINDS.length;

/** The Tour's card at `index`: a Section's, then, after the Sections, what else there is to find, and to play. */
export const tourCardAt = (index: number): { kind: 'section'; section: TourSection } | { kind: 'find'; find: TourFind } =>
  index < TOUR.length ? { kind: 'section', section: TOUR[index] } : { kind: 'find', find: TOUR_FINDS[index - TOUR.length] };

/**
 * How long the page looks at a control as it starts to move, from rest, before it looks at the card's Viewers, where
 * the two do not fit on screen together (issue 206): long enough to see it go, and the whole of the Amp's turn.
 */
const CONTROL_SHOWN = 1;

/** How long each leg of a move takes: a knob's from one point of its path to the next, a Waveform's held. */
const legsOf = (move: TourMove) =>
  typeof move.seconds === 'number' ? Array<number>(move.kind === 'param' ? move.path.length - 1 : move.path.length).fill(move.seconds) : move.seconds;

/** How long a move takes once through. */
const moveLength = (move: TourMove) => legsOf(move).reduce((sum, leg) => sum + leg, 0);

/** How long a card's moves take once through, before they start again. */
export const cycleLength = (card: TourSection) => card.moves.reduce((sum, move) => sum + moveLength(move), 0);

/**
 * Where the card's controls are `seconds` after its phrase's first beat: the one moving now along its path, the others
 * resting on the Tour's Patch's values; which control is moving; what the card names while the synth freezes the
 * Viewers, or null while they run; and what the page looks at where the moving control and the Viewers do not fit on
 * screen together (issue 206, decisions 2 and 4): the control for its first second whenever it starts from rest (a
 * knob's move or its leg after a hold, each new Waveform), else the Viewers, so they show what the move did and every
 * freeze.
 */
export function tourAt(
  card: TourSection,
  seconds: number,
): { values: Partial<Patch>; moving: TourMove['id']; naming: string[] | null; looking: Looking } {
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
  const { path } = current;
  const fromRest = current.kind === 'choice' || (path[leg] !== path[leg + 1] && (leg === 0 || path[leg - 1] === path[leg]));
  const looking = fromRest && t < Math.min(CONTROL_SHOWN, legs[leg]) ? 'control' : 'viewer';
  if (current.kind === 'choice') values[current.id] = current.path[leg];
  else {
    const def = PARAMS[current.id];
    const [from, to] = [current.path[leg], current.path[Math.min(leg + 1, current.path.length - 1)]];
    const progress = Math.min(1, t / legs[leg]);
    values[current.id] = progress === 0 || from === to ? from : positionToValue(def, valueToPosition(def, from) + (valueToPosition(def, to) - valueToPosition(def, from)) * progress);
  }
  return { values, moving: current.id, naming, looking };
}
