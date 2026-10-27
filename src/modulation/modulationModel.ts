import { type LfoDestination, lfos, type Patch } from '../patch/patch';

/** How far the LFO moves things at full Amount. */
export const LFO_CUTOFF_OCTAVES = 2;
export const LFO_PITCH_CENTS = 100;
export const LFO_PULSE_WIDTH = 0.4;
/** Resonance swings by its whole range (0–1) at full Depth, as far as the knob's value leaves room each way. */
export const LFO_RESONANCE = 1;
/**
 * Volume (tremolo) dips at most to silence: each LFO's swing is half its Depth, around a level that falls by the
 * total swing, so the wave's top is the Envelope's own level and its foot full Depth below it (issue 53).
 */
export const LFO_VOLUME = 0.5;
/** Osc 2 Pitch swings an octave each way, its Detune 50 cents (the Detune knob's range). */
export const LFO_OSC2_CENTS = 1200;
export const LFO_DETUNE_CENTS = 50;
/** The narrowest and widest pulse the Oscillators make, however far the LFO swings them. */
export const MIN_PULSE = 0.05;
export const MAX_PULSE = 0.95;
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
  const lfoOctaves = lfoOffset(patch, 'cutoff', LFO_CUTOFF_OCTAVES, lfo);
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
  return gliding + lfoOffset(patch, 'pitch', LFO_PITCH_CENTS / 100, lfo);
}

/**
 * How far each LFO swings a destination at the top of its wave, in the destination's units: `perDepth` at full Depth,
 * both kept together within `room` each way (a Pulse Width or the Resonance cannot pass its ends), shared by Depth.
 */
export function lfoSwings(patch: Patch, destination: LfoDestination, perDepth: number, room = Infinity): [number, number] {
  const wanted = lfos(patch).map((l) => (l.destination === destination ? perDepth * l.amount : 0)) as [number, number];
  const total = wanted[0] + wanted[1];
  const scale = total > room ? Math.max(0, room) / total : 1;
  return [wanted[0] * scale, wanted[1] * scale];
}

/** Where both LFOs take a destination right now: each one's swing times its value (`lfo`, −1 to 1 each). */
export function lfoOffset(patch: Patch, destination: LfoDestination, perDepth: number, lfo: readonly number[], room = Infinity) {
  const [one, two] = lfoSwings(patch, destination, perDepth, room);
  return one * (lfo[0] ?? 0) + two * (lfo[1] ?? 0);
}

/** The Resonance after the LFOs: they swing it around the knob's value, never past 0 or 1. */
export function effectiveResonance(patch: Patch, lfo: readonly number[] = []): number {
  const room = Math.min(patch.resonance, 1 - patch.resonance);
  return patch.resonance + lfoOffset(patch, 'resonance', LFO_RESONANCE, lfo, room);
}

/**
 * The tremolo: what the LFOs aimed at Volume multiply the Amp by right now, 0 to 1. Never above 1, so the Amp
 * Envelope sets the loudest the Note gets and the LFOs pull it down from there.
 */
export function tremolo(patch: Patch, lfo: readonly number[] = []): number {
  const [one, two] = lfoSwings(patch, 'volume', LFO_VOLUME, LFO_VOLUME);
  return 1 - one - two + one * (lfo[0] ?? 0) + two * (lfo[1] ?? 0);
}

/** Osc 2's tuning against Osc 1, in cents: Octave, Semitone and Detune, then the LFOs on Osc 2 Pitch and on Detune. */
export function osc2Cents(patch: Patch, lfo: readonly number[] = []): number {
  const knobs = patch.osc2Octave * 1200 + patch.osc2Semitone * 100 + patch.osc2Detune;
  return knobs + lfoOffset(patch, 'osc2Pitch', LFO_OSC2_CENTS, lfo) + lfoOffset(patch, 'detune', LFO_DETUNE_CENTS, lfo);
}
