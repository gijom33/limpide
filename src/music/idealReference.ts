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
 * with Detune. Where two land on one Harmonic both are kept, each at its own level, so each Oscillator's own marks
 * show (how they add depends on how their waves line up; Ring alone is worked out from it). Noise has no Harmonics
 * to predict. Low to high.
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
 * Ring Modulation's partials (issue 88): Osc 1 times Osc 2. With Osc 2 a whole number of octaves from Osc 1, both
 * start their cycles together on each Note (issue 94), so their product is one known wave: its partials are worked out
 * from it, cancelling where the sound does. Otherwise each pair of Harmonics of the two (the first RING_HARMONICS of
 * each) gives their sum and their difference, at half the product of their levels; where several land on one
 * frequency their levels add as power, as their alignment drifts.
 */
function ringPartials(patch: Patch, osc1: number, osc2: number, count: number): IdealPartial[] {
  if (patch.mixRing === 0) return [];
  const octaves = Math.log2(osc2 / osc1);
  if (Math.abs(octaves - Math.round(octaves)) < 1e-9) {
    // The product repeats at the lower Oscillator's pitch.
    const base = Math.min(osc1, osc2);
    const levels = ringProduct(patch, Math.round(osc1 / base), Math.round(osc2 / base), Math.ceil(count / base));
    return Array.from(levels, (level, m) => ({ ratio: m * base, level: level * patch.mixRing, source: 'ring' as const })).filter(
      (p) => p.ratio > 0 && p.ratio < count,
    );
  }
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

// Samples of one cycle of the product per Harmonic drawn: enough that the jumps' aliasing stays far below them.
const SAMPLES_PER_HARMONIC = 16;
// The engine's Oscillators play this many Harmonics; the Ideal scales each wave as they are scaled.
const ENGINE_HARMONICS = 1024;
const products = new Map<string, Float64Array>();
const PRODUCTS_LIMIT = 16;

/**
 * The level of each Harmonic (index m, of the lower pitch) of Osc 1 times Osc 2 at whole-number pitches n1 and n2 of
 * it, both starting their cycles together, up to `harmonics`: the waves sampled as the engine plays them (in their
 * ideal, unending form), multiplied, and Fourier-transformed. Kept by its arguments: a Patch change elsewhere asks
 * again.
 */
function ringProduct(patch: Patch, n1: number, n2: number, harmonics: number): Float64Array {
  const samples = 2 ** Math.ceil(Math.log2(Math.max(1024, SAMPLES_PER_HARMONIC * harmonics)));
  const key = `${patch.waveform} ${patch.pulseWidth} ${patch.osc2Waveform} ${patch.osc2PulseWidth} ${n1} ${n2} ${samples}`;
  const known = products.get(key);
  if (known) return known;
  if (products.size >= PRODUCTS_LIMIT) products.clear();
  const one = engineWave(patch.waveform, patch.pulseWidth);
  const two = engineWave(patch.osc2Waveform, patch.osc2PulseWidth);
  const re = new Float64Array(samples);
  const im = new Float64Array(samples);
  for (let i = 0; i < samples; i++) {
    // Between samples' edges, so no sample falls on a jump.
    const phase = (2 * Math.PI * (i + 0.5)) / samples;
    re[i] = one(n1 * phase) * two(n2 * phase);
  }
  fft(re, im);
  const levels = new Float64Array(Math.min(harmonics, samples / 2));
  for (let m = 1; m < levels.length; m++) levels[m] = (2 * Math.hypot(re[m], im[m])) / samples;
  products.set(key, levels);
  return levels;
}

/**
 * An Oscillator's wave at a phase, as the engine plays it: each Waveform its unending series' shape at the engine's
 * scale, and a pulse built the engine's way, a saw less a copy of it one width behind.
 */
function engineWave(waveform: Patch['waveform'], width: number): (phase: number) => number {
  const scaled = (w: Exclude<Patch['waveform'], 'pulse'>, firstHarmonic: number, shape: (phase: number) => number) => {
    const scale = harmonicSeries(w, 0.5, ENGINE_HARMONICS).magnitudes[1] / firstHarmonic;
    return (phase: number) => scale * shape(phase);
  };
  const wrapped = (phase: number) => phase - 2 * Math.PI * Math.floor(phase / (2 * Math.PI) + 0.5); // −π to π
  const saw = scaled('saw', 2 / Math.PI, (phase) => wrapped(phase) / Math.PI);
  switch (waveform) {
    case 'sine':
      return scaled('sine', 1, Math.sin);
    case 'triangle':
      return scaled('triangle', 8 / Math.PI ** 2, (phase) => (2 / Math.PI) * Math.asin(Math.sin(phase)));
    case 'saw':
      return saw;
    case 'square':
      return scaled('square', 4 / Math.PI, (phase) => (wrapped(phase) >= 0 ? 1 : -1));
    case 'pulse': {
      const sawPeak = harmonicSeries('saw', 0.5, ENGINE_HARMONICS).magnitudes[1];
      const scale = harmonicSeries('pulse', width, 256).magnitudes[1] / (2 * Math.sin(Math.PI * width) * sawPeak);
      const lag = 2 * Math.PI * width;
      return (phase) => scale * (saw(phase) - saw(phase - lag));
    }
  }
}

/** In place, radix 2: the discrete Fourier transform of re + i·im, whose length is a power of two. */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const r = re[i];
      re[i] = re[j];
      re[j] = r;
      const m = im[i];
      im[i] = im[j];
      im[j] = m;
    }
  }
  const cos = new Float64Array(n / 2);
  const sin = new Float64Array(n / 2);
  for (let k = 0; k < n / 2; k++) {
    cos[k] = Math.cos((2 * Math.PI * k) / n);
    sin[k] = -Math.sin((2 * Math.PI * k) / n);
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let start = 0; start < n; start += size)
      for (let k = 0; k < half; k++) {
        const c = cos[k * step];
        const s = sin[k * step];
        const a = start + k;
        const b = a + half;
        const tr = re[b] * c - im[b] * s;
        const ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
  }
}
