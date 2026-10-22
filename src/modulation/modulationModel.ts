import type { Patch } from '../patch/patch';

/** How far the LFO moves things at full Amount. */
export const LFO_CUTOFF_OCTAVES = 2;
export const LFO_PITCH_CENTS = 100;
export const LFO_PULSE_WIDTH = 0.4;
/** How far the hardest hit opens the Filter at full Velocity amount. */
export const VELOCITY_CUTOFF_OCTAVES = 2;

const MIN_HZ = 20;
const MAX_HZ = 20000;

/**
 * The Cutoff after all modulation, computed here rather than read from the audio graph (ADR-0003).
 * The Filter Envelope moves it by Envelope Amount octaves at full level, and the LFO (aimed at the Cutoff) by
 * up to ±2 octaves, and the Note's Velocity by up to 2 octaves (at full Velocity amount).
 */
export function effectiveCutoff(patch: Patch, filterEnvelope = 0, lfo = 0, velocity = 0): number {
  const lfoOctaves = patch.lfoDestination === 'cutoff' ? LFO_CUTOFF_OCTAVES * patch.lfoAmount * lfo : 0;
  const velocityOctaves = VELOCITY_CUTOFF_OCTAVES * patch.velocityCutoff * velocity;
  const hz = patch.cutoff * 2 ** (patch.filterEnvAmount * filterEnvelope + lfoOctaves + velocityOctaves);
  return Math.min(MAX_HZ, Math.max(MIN_HZ, hz));
}
