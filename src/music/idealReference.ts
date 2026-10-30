import { destinationSwings } from '../modulation/modulationModel';
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

/** Osc 1's pitch in Harmonics of the fundamental the Viewers count from: the Sub's pitch when it plays. */
const osc1Pitch = (patch: Patch) => (patch.mixSub > 0 ? 2 ** -patch.subOctave : 1);
/** Osc 2's pitch over Osc 1's: Osc 2 counts from the Note played, Osc 1 from its Octave (issue 90). */
const osc2Ratio = (patch: Patch) => 2 ** (patch.osc2Octave - patch.osc1Octave + patch.osc2Semitone / 12 + patch.osc2Detune / 1200);

/**
 * The Ideal from every Oscillator (the owner, 2026-10-27): Osc 1, Osc 2 and the Sub, each its Fourier series at its
 * Mixer level, each Harmonic where it falls. Osc 2 lands between Osc 1's Harmonics off an octave, a few cents off
 * with Detune. Where two land on one Harmonic both are kept, each at its own level, so each Oscillator's own marks
 * show (how they add depends on how their waves line up; Ring alone is worked out from it). Noise has no Harmonics
 * to predict. Low to high. `fmKept` is how much of FM's depth the Note keeps at the top (fmDepthKept).
 */
export function idealPartials(patch: Patch, count: number, fmKept = 1): IdealPartial[] {
  const root = osc1Pitch(patch);
  const osc2 = root * osc2Ratio(patch);
  const series = (source: IdealSource, magnitudes: Float32Array, mix: number, pitch: number) =>
    mix > 0 ? Array.from({ length: count - 1 }, (_, i) => ({ ratio: (i + 1) * pitch, level: magnitudes[i + 1] * mix, source })) : [];
  return [
    // Under FM, Osc 1 as FM makes it, where that can be worked out (issue 96), at the depth the Note keeps (issue 103).
    ...((patch.crossMod > 0 && patch.mixOsc1 > 0 && fmPartials(patch, root, osc2, count, fmKept)) ||
      series('osc1', harmonicSeries(patch.waveform, patch.pulseWidth, count).magnitudes, patch.mixOsc1, root)),
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

/** How much the engine scales a saw less its delayed copy, so the pulse it makes has the pulse series' level. */
function pulseScale(width: number): number {
  const sawPeak = harmonicSeries('saw', 0.5, ENGINE_HARMONICS).magnitudes[1];
  return harmonicSeries('pulse', width, 256).magnitudes[1] / (2 * Math.sin(Math.PI * width) * sawPeak);
}

/** FM (`crossMod`) at full: Osc 2 swings Osc 1's frequency by four times its own (a modulation index of 4, issue 89). */
export const FM_INDEX = 4;

/**
 * The top of what the browser plays (issue 103): half its sample rate, where anything higher folds back, but never
 * above a 48 kHz device's, so FM and Ring sound the same on a faster one.
 */
export const playedTop = (sampleRate: number) => Math.min(sampleRate, 48000) / 2;

/** The share of FM's sound its kept depth may put past the top (−65 dB): folded back, it stays under −60 dB. */
const FOLD_SHARE = 10 ** -6.5;

/** The share of a Sine at `osc1` Hz swung by a Sine at `osc2` Hz with `index` that lies past `top`: Σ J_k² there. */
function shareAbove(index: number, osc1: number, osc2: number, top: number): number {
  const reach = Math.ceil(index + 10 * Math.cbrt(index + 1) + 10);
  const j = besselJ(index, reach);
  let share = 0;
  for (let k = -reach; k <= reach; k++) if (Math.abs(osc1 + k * osc2) > top) share += j[Math.abs(k)] ** 2;
  return share;
}

/**
 * How much of FM's depth a Note keeps (issue 103), from 0 to 1: all of it, unless Osc 1's sidebands at FM's peak (the
 * knob plus its LFOs' swing) would pass the top of what the browser plays; then as much as keeps what passes it under
 * FOLD_SHARE. Worked out for Osc 1's fundamental swung by Osc 2's, as Sines (every FM Preset's Waveforms), at Osc 1's
 * frequency `osc1Hz`. The engine scales FM's depth by it on each Note, and the Ideal draws the same.
 */
export function fmDepthKept(patch: Patch, osc1Hz: number, sampleRate: number): number {
  const peak = FM_INDEX * destinationSwings(patch, 'fm', patch.crossMod).reduce((sum, swing) => sum + swing, patch.crossMod);
  const osc2Hz = osc1Hz * osc2Ratio(patch);
  const top = playedTop(sampleRate);
  if (peak === 0 || shareAbove(peak, osc1Hz, osc2Hz, top) <= FOLD_SHARE) return 1;
  // The share grows with the index, so halve the gap between an index that passes and one that does not.
  let [kept, over] = [0, peak];
  while (over - kept > peak * 1e-4) {
    const mid = (kept + over) / 2;
    if (shareAbove(mid, osc1Hz, osc2Hz, top) <= FOLD_SHARE) kept = mid;
    else over = mid;
  }
  return kept / peak;
}

/** How much of FM's depth the Ideal's Note keeps, at the Viewers' `fundamental` (Hz) on a device of `sampleRate`. */
export const idealFmKept = (patch: Patch, fundamental: number, sampleRate: number) =>
  fmDepthKept(patch, osc1Pitch(patch) * fundamental, sampleRate);

/**
 * Osc 1's partials under FM (issue 96), at its Mixer level, or null where they cannot be worked out. FM swings Osc 1's
 * frequency by FM_INDEX × FM × Osc 2's frequency, following Osc 2's wave, so its Harmonic n is swung with an index n
 * times that. With Osc 2 a whole number of octaves from Osc 1 both start their cycles together (issue 94) and the
 * swung wave repeats: its partials come from one cycle of it. Otherwise, with Osc 2 a Sine, each Harmonic n gives a
 * partial at n × Osc 1 + k × Osc 2 for every k, at its level times |J_k| of its index (a negative frequency folds
 * back): the classic FM result. Any other Osc 2 has no such result: null.
 */
function fmPartials(patch: Patch, osc1: number, osc2: number, count: number, kept: number): IdealPartial[] | null {
  const index = FM_INDEX * patch.crossMod * kept;
  const octaves = Math.log2(osc2 / osc1);
  if (Math.abs(octaves - Math.round(octaves)) < 1e-9) {
    const base = Math.min(osc1, osc2);
    const levels = fmCycle(patch, Math.round(osc1 / base), Math.round(osc2 / base), Math.ceil(count / base), index);
    return Array.from(levels, (level, m) => ({ ratio: m * base, level: level * patch.mixOsc1, source: 'osc1' as const })).filter(
      (p) => p.ratio > 0 && p.ratio < count,
    );
  }
  if (patch.osc2Waveform !== 'sine') return null;
  const pulse = patch.waveform === 'pulse';
  const levels = harmonicSeries(pulse ? 'saw' : patch.waveform, 0.5, ENGINE_HARMONICS).magnitudes;
  const scale = pulse ? pulseScale(patch.pulseWidth) : 1;
  const power = new Map<string, { ratio: number; power: number }>();
  const most = Math.min(ENGINE_HARMONICS - 1, Math.ceil((1.5 * count) / osc1));
  for (let n = 1; n <= most; n++) {
    if (levels[n] < 1e-9) continue;
    // The sidebands that land below `count`, either side, and no further than J_k reaches.
    const reach = Math.ceil(n * index + 10 * Math.cbrt(n * index + 1) + 10);
    const low = Math.max(-reach, Math.ceil((-count - n * osc1) / osc2));
    const high = Math.min(reach, Math.floor((count - n * osc1) / osc2));
    if (low > high) continue;
    const j = besselJ(n * index, Math.max(Math.abs(low), Math.abs(high)));
    for (let k = low; k <= high; k++) {
      const frequency = n * osc1 + k * osc2;
      const ratio = Math.abs(frequency);
      if (ratio < 1e-6 || ratio >= count) continue;
      let level = levels[n] * Math.abs(j[Math.abs(k)]);
      // A pulse: the swung saw less its copy one width of Osc 1's cycle behind.
      if (pulse) level *= 2 * scale * Math.abs(Math.sin((Math.PI * frequency * patch.pulseWidth) / osc1));
      if (level <= 1e-7) continue;
      const key = ratio.toFixed(6);
      const entry = power.get(key) ?? power.set(key, { ratio, power: 0 }).get(key)!;
      entry.power += level * level;
    }
  }
  return [...power.values()].map(({ ratio, power: p }) => ({ ratio, level: Math.sqrt(p) * patch.mixOsc1, source: 'osc1' as const }));
}

/**
 * The Bessel functions of the first kind J_0(x) … J_kmax(x), by Miller's backward recurrence, normalised so that
 * J_0 + 2(J_2 + J_4 + …) = 1.
 */
export function besselJ(x: number, kmax: number): Float64Array {
  const out = new Float64Array(kmax + 1);
  if (x === 0) {
    out[0] = 1;
    return out;
  }
  const top = Math.max(kmax, x);
  let k = 2 * Math.ceil((top + 20 + Math.sqrt(40 * top)) / 2);
  let [above, here] = [0, 1e-30]; // J_(k+1), J_k, unscaled
  let sum = 0;
  for (; k > 0; k--) {
    const below = ((2 * k) / x) * here - above; // J_(k−1)
    [above, here] = [here, below];
    if (k - 1 <= kmax) out[k - 1] = here;
    if (k - 1 > 0 && (k - 1) % 2 === 0) sum += 2 * here;
    if (Math.abs(here) > 1e200) {
      // Rescale before it overflows.
      for (let i = k - 1; i <= kmax; i++) out[i] *= 1e-200;
      [above, here, sum] = [above * 1e-200, here * 1e-200, sum * 1e-200];
    }
  }
  sum += here; // J_0
  for (let i = 0; i <= kmax; i++) out[i] /= sum;
  return out;
}

const cycles = new Map<string, Float64Array>();

/**
 * The level of each Harmonic (index m, of the lower pitch) of Osc 1 swung by Osc 2 at whole-number pitches n1 and n2
 * of it, both starting their cycles together, up to `harmonics` (issue 96): Osc 1's phase is its own plus the integral
 * of Osc 2's wave times the index, one cycle sampled as the engine plays it (a pulse a swung saw less its copy one
 * width of Osc 1's cycle behind), and Fourier-transformed. Kept by its arguments.
 */
function fmCycle(patch: Patch, n1: number, n2: number, harmonics: number, index: number): Float64Array {
  const samples = 2 ** Math.ceil(Math.log2(Math.max(2048, SAMPLES_PER_HARMONIC * harmonics * (1 + index))));
  const key = `${patch.waveform} ${patch.pulseWidth} ${patch.osc2Waveform} ${patch.osc2PulseWidth} ${n1} ${n2} ${index} ${samples}`;
  const known = cycles.get(key);
  if (known) return known;
  if (cycles.size >= PRODUCTS_LIMIT) cycles.clear();
  const swing = engineWave(patch.osc2Waveform, patch.osc2PulseWidth);
  // FM's share of Osc 1's phase at each sample (between samples' edges, as ringProduct's), from Osc 2's wave summed
  // at each step's middle.
  const extra = new Float64Array(samples + 1);
  let sum = (swing((2 * Math.PI * n2 * 0.25) / samples) * 0.5) / samples;
  for (let i = 0; i <= samples; i++) {
    extra[i] = 2 * Math.PI * index * n2 * sum;
    sum += swing((2 * Math.PI * n2 * (i + 1)) / samples) / samples;
  }
  const phase = (t: number) => {
    // t in samples, any real number: FM's share repeats each cycle.
    const wrapped = ((t % samples) + samples) % samples;
    const i = Math.floor(wrapped);
    const share = extra[i] + (extra[i + 1] - extra[i]) * (wrapped - i);
    return (2 * Math.PI * n1 * (t + 0.5)) / samples + share;
  };
  const pulse = patch.waveform === 'pulse';
  const wave = engineWave(pulse ? 'saw' : patch.waveform, 0.5);
  const scale = pulse ? pulseScale(patch.pulseWidth) : 1;
  const lag = (patch.pulseWidth * samples) / n1; // one width of Osc 1's cycle, in samples
  const re = new Float64Array(samples);
  const im = new Float64Array(samples);
  for (let i = 0; i < samples; i++) re[i] = pulse ? scale * (wave(phase(i)) - wave(phase(i - lag))) : wave(phase(i));
  fft(re, im);
  const levels = new Float64Array(Math.min(harmonics, samples / 2));
  for (let m = 1; m < levels.length; m++) levels[m] = (2 * Math.hypot(re[m], im[m])) / samples;
  cycles.set(key, levels);
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
      const scale = pulseScale(width);
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
