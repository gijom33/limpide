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
