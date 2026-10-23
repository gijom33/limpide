import type { Patch } from '../patch/patch';
import { harmonicSeries } from './harmonics';

/**
 * The level of each Harmonic (index n) that Osc 1 and the Sub should put at the Oscillator Tap, before the
 * Nominal Level. With the Sub on, the sound repeats at the Sub's pitch, so Harmonics count from there: the Sub's
 * square fills the odd ones and Osc 1's series the even ones. They never share a Harmonic, so the levels are exact.
 */
export function idealReference(patch: Patch, count: number): Float32Array {
  const osc1 = harmonicSeries(patch.waveform, patch.pulseWidth, count).magnitudes;
  if (patch.mixSub === 0) return osc1.map((m) => m * patch.mixOsc1);
  const sub = harmonicSeries('square', 0.5, count).magnitudes;
  return Float32Array.from({ length: count }, (_, n) => (n % 2 ? sub[n] * patch.mixSub : (osc1[n / 2] ?? 0) * patch.mixOsc1));
}
