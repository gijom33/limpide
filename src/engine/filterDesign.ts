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
