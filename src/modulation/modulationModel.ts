import type { Patch } from '../patch/patch';

/** How far the LFO moves things at full Amount. */
export const LFO_CUTOFF_OCTAVES = 2;
export const LFO_PITCH_CENTS = 100;
export const LFO_PULSE_WIDTH = 0.4;
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
 * The Filter Envelope moves it by Envelope Amount octaves at full level, and the LFO (aimed at the Cutoff) by
 * up to ±2 octaves, the Note's Velocity by up to 2 octaves (at full Velocity amount), and Key Track by an
 * octave per octave of the Note from C4 at 100 %. `note` is fractional during a Glide.
 */
export function effectiveCutoff(patch: Patch, filterEnvelope = 0, lfo = 0, velocity = 0, note = KEY_TRACK_CENTRE): number {
  const lfoOctaves = patch.lfoDestination === 'cutoff' ? LFO_CUTOFF_OCTAVES * patch.lfoAmount * lfo : 0;
  const velocityOctaves = VELOCITY_CUTOFF_OCTAVES * patch.velocityCutoff * velocity;
  const keyOctaves = (patch.keyTrack * (note - KEY_TRACK_CENTRE)) / 12;
  const hz = patch.cutoff * 2 ** (patch.filterEnvAmount * filterEnvelope + lfoOctaves + velocityOctaves + keyOctaves);
  return Math.min(MAX_HZ, Math.max(MIN_HZ, hz));
}
