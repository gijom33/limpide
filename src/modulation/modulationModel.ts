import type { Patch } from '../patch/patch';

/** How far the LFO moves things at full Amount. */
export const LFO_CUTOFF_OCTAVES = 2;
export const LFO_PITCH_CENTS = 100;
export const LFO_PULSE_WIDTH = 0.4;

const MIN_HZ = 20;
const MAX_HZ = 20000;

/**
 * The Cutoff after all modulation, computed here rather than read from the audio graph (ADR-0003).
 * The Filter Envelope moves it by Envelope Amount octaves at full level, and the LFO (aimed at the Cutoff) by
 * up to ±2 octaves; Velocity (ticket 10) will add to this.
 */
export function effectiveCutoff(patch: Patch, filterEnvelope = 0, lfo = 0): number {
  const lfoOctaves = patch.lfoDestination === 'cutoff' ? LFO_CUTOFF_OCTAVES * patch.lfoAmount * lfo : 0;
  const hz = patch.cutoff * 2 ** (patch.filterEnvAmount * filterEnvelope + lfoOctaves);
  return Math.min(MAX_HZ, Math.max(MIN_HZ, hz));
}
