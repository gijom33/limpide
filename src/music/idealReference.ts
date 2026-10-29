import type { Patch } from '../patch/patch';
import { harmonicSeries } from './harmonics';

/**
 * The level of each Harmonic (index n) that Osc 1 and the Sub should put at the Oscillator Tap, before the
 * Nominal Level. With the Sub on, the sound repeats at the Sub's pitch, so Harmonics count from there: an octave
 * down, the Sub's square fills the odd ones and Osc 1's series the even ones; two down, Osc 1 every fourth. They
 * never share a Harmonic, so the levels are exact.
 */
export function idealReference(patch: Patch, count: number): Float32Array {
  const levels = new Float32Array(count);
  for (const p of idealPartials({ ...patch, mixOsc2: 0 }, count)) if (p.ratio < count) levels[Math.round(p.ratio)] += p.level;
  return levels;
}

/** Where the Ideal puts its marks: one per Harmonic of each Oscillator that sounds (issue 61). */
export type IdealSource = 'osc1' | 'osc2' | 'sub';
export interface IdealPartial {
  /** Its frequency over the fundamental the Viewers count from (the Sub's pitch when it plays, else Osc 1's, at its Octave). */
  ratio: number;
  /** Its level at the Oscillator Tap, before the Nominal Level, as idealReference's. */
  level: number;
  source: IdealSource;
}

/**
 * The Ideal from every Oscillator (the owner, 2026-10-27): Osc 1, Osc 2 and the Sub, each its Fourier series at its
 * Mixer level, each Harmonic where it falls. Osc 2 lands between Osc 1's Harmonics off an octave, a few cents off
 * with Detune. Where two land on one Harmonic both are kept, each at its own level (how they add depends on how
 * their waves line up, which theory cannot know). Noise has no Harmonics to predict. Low to high.
 */
export function idealPartials(patch: Patch, count: number): IdealPartial[] {
  const root = patch.mixSub > 0 ? 2 ** -patch.subOctave : 1; // Osc 1's pitch, in Harmonics of the fundamental
  // Osc 2 counts from the Note played, Osc 1 from its Octave (issue 90).
  const osc2 = root * 2 ** (patch.osc2Octave - patch.osc1Octave + patch.osc2Semitone / 12 + patch.osc2Detune / 1200);
  const series = (source: IdealSource, magnitudes: Float32Array, mix: number, pitch: number) =>
    mix > 0 ? Array.from({ length: count - 1 }, (_, i) => ({ ratio: (i + 1) * pitch, level: magnitudes[i + 1] * mix, source })) : [];
  return [
    ...series('osc1', harmonicSeries(patch.waveform, patch.pulseWidth, count).magnitudes, patch.mixOsc1, root),
    ...series('osc2', harmonicSeries(patch.osc2Waveform, patch.osc2PulseWidth, count).magnitudes, patch.mixOsc2, osc2),
    ...series('sub', harmonicSeries(patch.subWaveform, 0.5, count).magnitudes, patch.mixSub, 1),
  ]
    .filter((p) => p.level > 1e-5)
    .sort((a, b) => a.ratio - b.ratio);
}
