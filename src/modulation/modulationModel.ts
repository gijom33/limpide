import type { Patch } from '../patch/patch';

const MIN_HZ = 20;
const MAX_HZ = 20000;

/**
 * The Cutoff after all modulation, computed here rather than read from the audio graph (ADR-0003).
 * Nothing modulates the Filter yet; the Filter Envelope (ticket 06), LFO (09) and Velocity (10) add to this.
 */
export function effectiveCutoff(patch: Patch): number {
  return Math.min(MAX_HZ, Math.max(MIN_HZ, patch.cutoff));
}
