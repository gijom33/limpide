import { HIGHEST_CUTOFF, LOWEST_CUTOFF } from '../modulation/modulationModel';
import type { FilterMode, FilterSlope } from '../patch/patch';

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
  const peaked = mode === 'lowpass' || mode === 'highpass';
  const q = peaked ? resonanceToQdB(resonance) : resonanceToQ(resonance);
  if (slope === 12) return [{ type: mode, Q: q, gain: 0 }, TRANSPARENT];
  const perStage = peaked ? q / 2 : q;
  return [
    { type: mode, Q: perStage, gain: 0 },
    { type: mode, Q: perStage, gain: 0 },
  ];
}

/** Points in the curve of the Resonance's swing: read between them, a Q is within a millionth of its own. */
const SWING_POINTS = 4097;

/**
 * What the LFOs' swing of the Resonance adds to each stage's Q, as the model moves the Resonance (issue 166): a
 * WaveShaper's `curve` over the swing as a share of `span`, the most the LFOs together swing it either way from the
 * knob's `resonance` (−1 to 1), the first stage's Q there less its own; and the share of it each stage takes. A
 * band-pass's or notch's Q grows by ratios, so a straight line through the swing's ends would take its foot below zero
 * (a notch silent, a band-pass letting everything through): along the curve the Q never passes its floor, as the
 * Resonance never passes 0 or 1. A second stage at 24 dB has the first's Q; at 12 dB it is the transparent shelf,
 * which no swing moves.
 */
export function qSwing(mode: FilterMode, slope: FilterSlope, resonance: number, span: number): { curve: Float32Array<ArrayBuffer>; stages: [number, number] } {
  const q = (r: number) => filterStages(mode, slope, r)[0].Q;
  const rest = q(resonance);
  const curve = Float32Array.from({ length: SWING_POINTS }, (_, i) => q(resonance + span * ((2 * i) / (SWING_POINTS - 1) - 1)) - rest);
  return { curve, stages: [1, slope === 24 ? 1 : 0] };
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

/** How far under the top of its range the Filter starts to fade, in cents: half an octave (issue 195). */
const FADE_CENTS = 600;
/** How far a Cutoff is into the top's fade, from 0 (under it) to 1 (at 20 kHz): a raised cosine over the cents. */
function intoTheTop(cents: number) {
  const into = (cents - (CUTOFF_SPAN - FADE_CENTS)) / FADE_CENTS;
  return into <= 0 ? 0 : into >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * into);
}
/**
 * How much of its Resonance a low- or high-pass keeps at a Cutoff (issue 195): all of it up to half an octave under
 * 20 kHz, none at 20 kHz, as an analogue Filter's fades past its range. Without the fade the Cutoff held at 20 kHz
 * (issue 166) would ring there, where the low-pass past Nyquist never did; a high-pass fades out with it.
 */
export const topFade = (cutoff: number) => 1 - intoTheTop(centsOverFloor(cutoff));

/** The two biquads at a Cutoff: a low- or high-pass's Q taken toward its flat one as the Resonance fades at the top. */
export function filterStagesAt(mode: FilterMode, slope: FilterSlope, resonance: number, cutoff: number): [Stage, Stage] {
  const stages = filterStages(mode, slope, resonance);
  if (mode !== 'lowpass' && mode !== 'highpass') return stages;
  const fade = topFade(cutoff);
  const flat = filterStages(mode, slope, 0);
  return [0, 1].map((k) => ({ ...stages[k], Q: flat[k].Q + (stages[k].Q - flat[k].Q) * fade })) as [Stage, Stage];
}

/** What passes the Filter at a Cutoff at all: a high-pass falls silent at the top as its Resonance fades (issue 195). */
export const filterLevel = (mode: FilterMode, cutoff: number) => (mode === 'highpass' ? topFade(cutoff) : 1);

/** Points in the top's fade curve: read between them, the fade is within a hundred-thousandth of its own. */
const DIP_POINTS = 8193;
/**
 * The top's fade for the sound, a WaveShaper's curve over the clamped Cutoff's cents over the floor divided by the
 * span: what it takes off (1 less `topFade`), nothing under the fade.
 */
export const TOP_DIP = Float32Array.from({ length: DIP_POINTS }, (_, i) => intoTheTop(CUTOFF_SPAN * ((2 * i) / (DIP_POINTS - 1) - 1)));
