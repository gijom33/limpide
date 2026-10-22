import type { Patch } from '../patch/patch';

const MIN_HZ = 20;
const MAX_HZ = 20000;

/**
 * The Cutoff after all modulation, computed here rather than read from the audio graph (ADR-0003).
 * The Filter Envelope moves it by Envelope Amount octaves at full level; the LFO (ticket 09) and
 * Velocity (10) will add to this.
 */
export function effectiveCutoff(patch: Patch, filterEnvelope = 0): number {
  const hz = patch.cutoff * 2 ** (patch.filterEnvAmount * filterEnvelope);
  return Math.min(MAX_HZ, Math.max(MIN_HZ, hz));
}
