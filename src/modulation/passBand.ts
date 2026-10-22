import type { FilterMode } from '../patch/patch';

/**
 * The frequency ranges a Filter Mode lets through, as [low, high] pairs in Hz: what the Envelope Timeline
 * shades. `bandwidth` (octaves) applies to band-pass and notch, centred on the Cutoff.
 */
export function passBand(mode: FilterMode, cutoff: number, bandwidth: number, { min, max }: { min: number; max: number }): [number, number][] {
  const clamp = (f: number) => Math.min(max, Math.max(min, f));
  const half = 2 ** (bandwidth / 2);
  switch (mode) {
    case 'lowpass':
      return [[min, clamp(cutoff)]];
    case 'highpass':
      return [[clamp(cutoff), max]];
    case 'bandpass':
      return [[clamp(cutoff / half), clamp(cutoff * half)]];
    case 'notch':
      return [
        [min, clamp(cutoff / half)],
        [clamp(cutoff * half), max],
      ];
  }
}

/** A band-pass or notch biquad's bandwidth in octaves for its Q (the inverse of Q = 1 / (2·sinh(ln2/2 · N))). */
export const bandwidthOctaves = (q: number) => (2 * Math.asinh(1 / (2 * q))) / Math.LN2;
