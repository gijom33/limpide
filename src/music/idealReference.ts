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
export type IdealSource = 'osc1' | 'osc2' | 'sub' | 'ring';

/** How many Harmonics of each Oscillator Ring's sums and differences are drawn from: enough to read its pattern. */
const RING_HARMONICS = 16;
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
    ...ringPartials(patch, root, osc2, count),
  ]
    .filter((p) => p.level > 1e-5)
    .sort((a, b) => a.ratio - b.ratio);
}

/**
 * Ring Modulation's partials (issue 88): each pair of Harmonics of Osc 1 and Osc 2 (the first RING_HARMONICS of each)
 * gives their sum and their difference, at half the product of their levels. Where several land on one frequency,
 * their levels add as power (their phases unknown to theory).
 */
function ringPartials(patch: Patch, osc1: number, osc2: number, count: number): IdealPartial[] {
  if (patch.mixRing === 0) return [];
  const a = harmonicSeries(patch.waveform, patch.pulseWidth, RING_HARMONICS + 1).magnitudes;
  const b = harmonicSeries(patch.osc2Waveform, patch.osc2PulseWidth, RING_HARMONICS + 1).magnitudes;
  const power = new Map<string, { ratio: number; power: number }>();
  for (let i = 1; i <= RING_HARMONICS; i++)
    for (let j = 1; j <= RING_HARMONICS; j++) {
      const level = (a[i] * b[j] * patch.mixRing) / 2;
      if (level <= 1e-5) continue;
      for (const ratio of [Math.abs(i * osc1 - j * osc2), i * osc1 + j * osc2]) {
        if (ratio < 1e-6 || ratio >= count) continue;
        const key = ratio.toFixed(6);
        const entry = power.get(key) ?? power.set(key, { ratio, power: 0 }).get(key)!;
        entry.power += level * level;
      }
    }
  return [...power.values()].map(({ ratio, power: p }) => ({ ratio, level: Math.sqrt(p), source: 'ring' as const }));
}
