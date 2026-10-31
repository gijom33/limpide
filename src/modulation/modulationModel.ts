import { type FilterMode, type LfoDestination, lfos, type ParamId, type Patch } from '../patch/patch';

/** The Note sounding, whose Velocity and key are fixed for as long as it sounds. */
export interface Sounding {
  note: number;
  velocity: number;
}

/**
 * What the Modulation model says at a moment: both Envelope levels, the Effective Cutoff and the Filter's shape. The
 * engine computes it and the Viewers and rings read it, so it lives with the model rather than in the engine.
 */
export interface Modulation {
  amp: number;
  filter: number;
  cutoff: number;
  /** Each LFO's value (−1 to 1), LFO 1 first. */
  lfo: [number, number];
  mode: FilterMode;
  /** The Resonance after the LFOs (0–1). */
  resonance: number;
  /** Band-pass and notch width in octaves. */
  bandwidth: number;
  /** What the Amp is multiplied by (0–1): the Volume knob, dipped by the LFOs on Volume (issue 62). */
  volume: number;
  /** The newest Note while its key is held (or Hold keeps it), with its Velocity; null once released. */
  sounding: Sounding | null;
  /** When the newest Note started (its Gate opened), in the engine's seconds; null before any (issue 115). */
  struck: number | null;
  /** The pitch the newest Note sounds at, in semitones (fractional through a Glide or vibrato); A4 before any. */
  pitch: number;
  /** How far an LFO on Pitch moves it right now, in semitones: `pitch` less the Note where the Glide has taken it. */
  vibrato: number;
}

/** The narrowest and widest pulse the Oscillators make, however far the LFO swings them. */
const MIN_PULSE = 0.05;
const MAX_PULSE = 0.95;

/** What an LFO does to one Destination: see `LFO_LAWS`. */
export interface LfoLaw {
  perDepth: number;
  room?(value: number): number;
  knobs: readonly ParamId[];
}

/**
 * What an LFO does to each Destination (issue 74), read by the model, the engine, the rings and the Timeline alike:
 * `perDepth`, how far one LFO at full Depth swings it each way, in its knobs' unit; `room`, how far it may go each way
 * from a knob's value before an end (both LFOs together kept within it); `knobs`, those whose ring shows it.
 */
export const LFO_LAWS = {
  /** A semitone each way; Pitch has no knob. */
  pitch: { perDepth: 1, knobs: [] },
  /** An octave each way, on the Semitone knob. */
  osc2Pitch: { perDepth: 12, knobs: ['osc2Semitone'] },
  /** 50 cents each way, the Detune knob's range. */
  detune: { perDepth: 50, knobs: ['osc2Detune'] },
  /** 40 points each way, on both Oscillators' Pulse Width, never past the narrowest or widest pulse. */
  pulseWidth: { perDepth: 0.4, room: (width: number) => Math.min(width - MIN_PULSE, MAX_PULSE - width), knobs: ['pulseWidth', 'osc2PulseWidth'] },
  /** Its whole range (0–1), as far as the FM knob leaves room each way: none at 0 (issue 97). */
  fm: { perDepth: 1, room: (fm: number) => Math.min(fm, 1 - fm), knobs: ['crossMod'] },
  /** Two octaves each way. */
  cutoff: { perDepth: 2, knobs: ['cutoff'] },
  /** Its whole range (0–1), as far as the knob's value leaves room each way. */
  resonance: { perDepth: 1, room: (resonance: number) => Math.min(resonance, 1 - resonance), knobs: ['resonance'] },
  /**
   * Volume (tremolo) dips at most to silence: each LFO's swing is half its Depth, around a level that falls by the
   * total swing, so the wave's top is the Envelope's own level and its foot full Depth below it (issue 53).
   */
  volume: { perDepth: 0.5, room: () => 0.5, knobs: ['volume'] },
} as const satisfies Record<LfoDestination, LfoLaw>;
/** How far the hardest hit opens the Filter at full Velocity amount. */
export const VELOCITY_CUTOFF_OCTAVES = 2;

/** Key Track is measured from C4: there the Cutoff is the knob's own value. */
export const KEY_TRACK_CENTRE = 60;

const MIN_HZ = 20;
const MAX_HZ = 20000;

/**
 * The Cutoff after all modulation, computed here rather than read from the audio graph (ADR-0003).
 * The Filter Envelope moves it by Envelope Amount octaves at full level, each LFO aimed at the Cutoff by
 * up to ±2 octaves (`lfo`: each LFO's value, −1 to 1), the Note's Velocity by up to 2 octaves (at full Velocity amount), and Key Track by an
 * octave per octave of the Note from C4 at 100 %. `note` is fractional during a Glide.
 */
export function effectiveCutoff(patch: Patch, filterEnvelope = 0, lfo: readonly number[] = [], velocity = 0, note = KEY_TRACK_CENTRE): number {
  const lfoOctaves = lfoOffset(patch, 'cutoff', lfo);
  const velocityOctaves = VELOCITY_CUTOFF_OCTAVES * patch.velocityCutoff * velocity;
  const keyOctaves = (patch.keyTrack * (note - KEY_TRACK_CENTRE)) / 12;
  const hz = patch.cutoff * 2 ** (patch.filterEnvAmount * filterEnvelope + lfoOctaves + velocityOctaves + keyOctaves);
  return Math.min(MAX_HZ, Math.max(MIN_HZ, hz));
}

/**
 * The pitch sounding, in semitones (MIDI numbering, fractional): the Note as far as the Glide has taken it, moved
 * by up to a semitone each way by the LFO aimed at Pitch.
 */
export function soundingPitch(patch: Patch, gliding: number, lfo: readonly number[] = []): number {
  return gliding + lfoOffset(patch, 'pitch', lfo);
}

/**
 * How far each LFO swings a destination at the top of its wave, in the destination's units: `perDepth` at full Depth,
 * both kept together within `room` each way (a Pulse Width or the Resonance cannot pass its ends), shared by Depth.
 */
function lfoSwings(patch: Patch, destination: LfoDestination, perDepth: number, room = Infinity): [number, number] {
  const wanted = lfos(patch).map((l) => (l.destination === destination ? perDepth * l.amount : 0)) as [number, number];
  const total = wanted[0] + wanted[1];
  const scale = total > room ? Math.max(0, room) / total : 1;
  return [wanted[0] * scale, wanted[1] * scale];
}

/** Each LFO's swing on a Destination by its law, in its knobs' unit, from a knob's `value` (where its room is measured). */
export function destinationSwings(patch: Patch, destination: LfoDestination, value = 0): [number, number] {
  const law: LfoLaw = LFO_LAWS[destination];
  return lfoSwings(patch, destination, law.perDepth, law.room?.(value));
}

/**
 * Where both LFOs take a Destination right now, in its knobs' unit, from a knob's `value`: each one's swing times its
 * value (`lfo`, −1 to 1 each).
 */
export function lfoOffset(patch: Patch, destination: LfoDestination, lfo: readonly number[], value = 0) {
  const [one, two] = destinationSwings(patch, destination, value);
  return one * (lfo[0] ?? 0) + two * (lfo[1] ?? 0);
}

/** The Resonance after the LFOs: they swing it around the knob's value, never past 0 or 1. */
export function effectiveResonance(patch: Patch, lfo: readonly number[] = []): number {
  return patch.resonance + lfoOffset(patch, 'resonance', lfo, patch.resonance);
}

/**
 * The tremolo: what the LFOs aimed at Volume multiply the Amp by right now, 0 to 1. Never above 1, so the Amp
 * Envelope sets the loudest the Note gets and the LFOs pull it down from there.
 */
export function tremolo(patch: Patch, lfo: readonly number[] = []): number {
  // Each LFO's value less one: at its top (+1) the gain is 1, at its foot (−1) twice its swing below.
  return 1 + lfoOffset(patch, 'volume', [(lfo[0] ?? 0) - 1, (lfo[1] ?? 0) - 1]);
}

/** What the Amp's Envelope is multiplied by: the Volume knob, and the tremolo dipping from it (issue 62). */
export function effectiveVolume(patch: Patch, lfo: readonly number[] = []): number {
  return patch.volume * tremolo(patch, lfo);
}

/**
 * Osc 2's tuning against the Note played, in cents: Octave, Semitone and Detune, then the LFOs on Osc 2 Pitch and on
 * Detune, and the Filter Envelope's level times its Env Amount (issue 93).
 */
export function osc2Cents(patch: Patch, lfo: readonly number[] = [], filterEnvelope = 0): number {
  const knobs = patch.osc2Octave * 1200 + patch.osc2Semitone * 100 + patch.osc2Detune;
  return knobs + lfoOffset(patch, 'osc2Pitch', lfo) * 100 + lfoOffset(patch, 'detune', lfo) + patch.osc2EnvAmount * filterEnvelope * 100;
}
