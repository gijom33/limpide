import { HIGHEST_CUTOFF, LOWEST_CUTOFF } from '../modulation/modulationModel';
import type { FilterMode, FilterSlope } from '../patch/patch';

/** Whether a Mode's Resonance is a peak at the Cutoff (its Q in dB): a low- or high-pass's, not a band-pass's or notch's. */
export const isPeaked = (mode: FilterMode) => mode === 'lowpass' || mode === 'highpass';
/** Whether a Mode's output fades with its Resonance at the top of the range: a high-pass's (issue 195). */
export const fadesOutAtTheTop = (mode: FilterMode) => mode === 'highpass';
/** Whether a Mode's level is made up after its stages: a band-pass's (issue 231). */
export const isMadeUp = (mode: FilterMode) => mode === 'bandpass';

/** One biquad's settings. */
export interface Stage {
  type: BiquadFilterType;
  Q: number;
  gain: number;
}

// Web Audio interprets a low/high-pass biquad's Q in dB: −3 dB is a flat Butterworth response.
export const resonanceToQdB = (resonance: number) => -3.01 + resonance * 27;
// For band-pass and notch, Q is a ratio (centre / bandwidth): Resonance narrows the band.
const resonanceToQ = (resonance: number) => 0.5 * 40 ** resonance;

// A 0 dB shelf passes everything unchanged (magnitude and phase): the second stage at 12 dB.
const TRANSPARENT: Stage = { type: 'lowshelf', Q: 1, gain: 0 };

/**
 * The two biquads that make a Filter Mode at a Slope. 24 dB cascades two stages; for low/high-pass each gets
 * half the resonant peak (in dB), because cascading adds dB, so Resonance sounds equally strong at both Slopes.
 */
export function filterStages(mode: FilterMode, slope: FilterSlope, resonance: number): [Stage, Stage] {
  const peaked = isPeaked(mode);
  const q = peaked ? resonanceToQdB(resonance) : resonanceToQ(resonance);
  if (slope === 12) return [{ type: mode, Q: q, gain: 0 }, TRANSPARENT];
  const perStage = peaked ? q / 2 : q;
  return [
    { type: mode, Q: perStage, gain: 0 },
    { type: mode, Q: perStage, gain: 0 },
  ];
}

/** Points in the Resonance's curve: read between them, a Q is within a millionth of its own. */
const CURVE_POINTS = 4097;

/**
 * The Resonance's curve (issues 166 and 219): a WaveShaper's `curve` from the Resonance itself (0 to 1, taken as −1 to
 * 1) to what it adds to the first stage's Q over its flat one, at no Resonance; and the share of it each stage takes.
 * The knob, aftertouch and the LFOs all move the Resonance into it, so it is made once per Mode and Slope and nothing
 * that moves the Resonance makes it again. A band-pass's or notch's Q grows by ratios: along the curve it never passes
 * its floor, as the Resonance never passes 0 or 1. A second stage at 24 dB has the first's Q; at 12 dB it is the
 * transparent shelf, which no Resonance moves.
 */
export function resonanceCurve(mode: FilterMode, slope: FilterSlope): { curve: Float32Array<ArrayBuffer>; stages: [number, number] } {
  const q = (r: number) => filterStages(mode, slope, r)[0].Q;
  const flat = q(0);
  const curve = Float32Array.from({ length: CURVE_POINTS }, (_, i) => q(i / (CURVE_POINTS - 1)) - flat);
  return { curve, stages: [1, slope === 24 ? 1 : 0] };
}

/** A band-pass's make-up at 5 % Resonance and under it, in dB, by Slope (issue 231). */
const MAKE_UP_DB: Record<FilterSlope, number> = { 12: 9, 24: 12 };
/** The Resonance the make-up starts to rise from: 5 % (Init's is 20 %). */
export const MAKE_UP_RISES_FROM = 0.05;
/** How far the make-up rises over its fixed part at most, in dB: its ceiling. */
const MAKE_UP_RISE_DB = 12;

/**
 * A band-pass's make-up gain (issue 231): the band passes 0 dB at its centre, but a saw's power lies on its skirts,
 * so a band-pass is 10 to 15 dB quieter than a low-pass. A fixed part brings the broadest bands near the low-pass;
 * above 5 % Resonance, the band narrows and what passes falls as the square root of its Q, so the make-up rises by as
 * much (half a constant-skirt band-pass's rise in dB), up to its ceiling: Init, at 20 %, plays within 3 dB of the
 * low-pass. Every other Mode is left at 1.
 */
export function makeUp(mode: FilterMode, slope: FilterSlope, resonance: number): number {
  if (!isMadeUp(mode)) return 1;
  const rise = Math.sqrt(resonanceToQ(Math.max(resonance, MAKE_UP_RISES_FROM)) / resonanceToQ(MAKE_UP_RISES_FROM));
  return 10 ** ((MAKE_UP_DB[slope] + Math.min(20 * Math.log10(rise), MAKE_UP_RISE_DB)) / 20);
}

/**
 * The make-up's curve, as `resonanceCurve`'s: a WaveShaper's from the Resonance (0 to 1, taken as −1 to 1) to what the
 * make-up adds to a gain of 1, so it follows the Resonance however it is moved. A Mode with none adds nothing.
 */
export function makeUpCurve(mode: FilterMode, slope: FilterSlope): Float32Array<ArrayBuffer> {
  if (!isMadeUp(mode)) return Float32Array.of(0, 0);
  return Float32Array.from({ length: CURVE_POINTS }, (_, i) => makeUp(mode, slope, i / (CURVE_POINTS - 1)) - 1);
}

/** The Effective Cutoff's range in cents, from its bottom to its top. */
export const CUTOFF_SPAN = 1200 * Math.log2(HIGHEST_CUTOFF / LOWEST_CUTOFF);
/** A Cutoff in cents over the bottom of the range, the Filter's own frequency, which its detune climbs from. */
export const centsOverFloor = (hz: number) => 1200 * Math.log2(hz / LOWEST_CUTOFF);
/**
 * The clamp on the Filter's detune (issue 166), a WaveShaper's curve over the cents over the floor divided by the span:
 * none under the floor, the cents themselves up to the top, the top past it, as the model holds the Effective Cutoff.
 * Its corners fall on its points, so between them it is exact.
 */
export const CUTOFF_CLAMP = Float32Array.of(0, 0, CUTOFF_SPAN);

/** How far under the top of its range the Resonance starts to fade, in cents: half an octave (issue 195). */
const RESONANCE_FADE = 600;
/** How far under the top a high-pass starts to fall silent, in cents: a semitone, where it passes little that is heard. */
const LEVEL_FADE = 100;
/**
 * How far a Cutoff (in cents over the floor) is into a fade `width` cents wide under the top, from 0 (under it) to 1
 * (at 20 kHz): a raised cosine.
 */
function intoTheTop(cents: number, width: number) {
  const into = (cents - (CUTOFF_SPAN - width)) / width;
  return into <= 0 ? 0 : into >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * into);
}
/**
 * How much of its Resonance a low- or high-pass keeps at a Cutoff (issue 195): all of it up to half an octave under
 * 20 kHz, none at 20 kHz, as an analogue Filter's fades past its range. Without the fade the Cutoff held at 20 kHz
 * (issue 166) would ring there, where the low-pass past Nyquist never did.
 */
export const topFade = (cutoff: number) => 1 - intoTheTop(centsOverFloor(cutoff), RESONANCE_FADE);

/** The two biquads at a Cutoff: a low- or high-pass's Q taken toward its flat one as the Resonance fades at the top. */
export function filterStagesAt(mode: FilterMode, slope: FilterSlope, resonance: number, cutoff: number): [Stage, Stage] {
  const stages = filterStages(mode, slope, resonance);
  if (!isPeaked(mode)) return stages;
  const fade = topFade(cutoff);
  const flat = filterStages(mode, slope, 0);
  return [0, 1].map((k) => ({ ...stages[k], Q: flat[k].Q + (stages[k].Q - flat[k].Q) * fade })) as [Stage, Stage];
}

/**
 * What passes the Filter at a Cutoff at all (issue 195): a high-pass falls silent over the last semitone under 20 kHz,
 * as it did past Nyquist, instead of passing only what is above hearing; every other Mode passes.
 */
export const filterLevel = (mode: FilterMode, cutoff: number) => (fadesOutAtTheTop(mode) ? 1 - intoTheTop(centsOverFloor(cutoff), LEVEL_FADE) : 1);

/** Points in the top's fade curves: read between them, a fade is within a ten-thousandth of its own. */
const FADE_POINTS = 16385;
/** A fade's curve for the sound, over the clamped Cutoff's cents over the floor divided by the span: what it takes off. */
const fadeCurve = (width: number) => Float32Array.from({ length: FADE_POINTS }, (_, i) => intoTheTop(CUTOFF_SPAN * ((2 * i) / (FADE_POINTS - 1) - 1), width));
/** The Resonance's fade at the top, as a WaveShaper's curve: 1 less `topFade`. */
export const RESONANCE_FADE_CURVE = fadeCurve(RESONANCE_FADE);
/** A high-pass's fall to silence at the top, as a WaveShaper's curve: 1 less its `filterLevel`. */
export const LEVEL_FADE_CURVE = fadeCurve(LEVEL_FADE);
