import { filterStages } from '../engine/filterDesign';
import type { FilterMode, FilterSlope, ParamId, Patch } from '../patch/patch';
import type { Waveform } from './harmonics';

/**
 * The Maths Layer's content (issue 14): the quantities behind the sound, as data. The formulas are the ones the
 * Viewers already compute from (the Harmonic series of each Waveform, a biquad's gain per frequency), written out.
 */

/** A formula, and what its letters mean. */
export interface Formula {
  formula: string;
  where: string;
}

/** The Harmonic series of each Waveform, as the Ideal Reference draws it (n is the Harmonic's number). */
export function harmonicFormula(waveform: Waveform, pulseWidth: number): Formula {
  switch (waveform) {
    case 'sine':
      return { formula: 'b₁ = 1,  bₙ = 0 for n > 1', where: 'one Harmonic only' };
    case 'saw':
      return { formula: 'bₙ = 2 / (π n)', where: 'every n: each Harmonic 1/n of the first' };
    case 'square':
      return { formula: 'bₙ = 4 / (π n),  odd n only', where: 'the even Harmonics are missing' };
    case 'triangle':
      return { formula: 'bₙ = 8 / (π² n²),  odd n only', where: 'falling as 1/n², signs alternating' };
    case 'pulse':
      return { formula: 'aₙ = 4 sin(π n d) / (π n)', where: `d = ${Math.round(pulseWidth * 100)} %: zero wherever n d is whole` };
  }
}

/** The 12 dB core of each Filter Mode's gain, over x = f / fc. */
const CORE: Record<FilterMode, string> = {
  lowpass: '1',
  highpass: 'x²',
  bandpass: 'x / Q',
  notch: '|1 − x²|',
};

/** The Response Curve's gain per frequency for a Filter Mode and Slope: one biquad, or two in a row at 24 dB. */
export function responseFormula(mode: FilterMode, slope: FilterSlope): Formula {
  const one = `${CORE[mode]} / √((1 − x²)² + (x / Q)²)`;
  return {
    formula: slope === 12 ? `|H| = ${one}` : `|H| = (${one})²`,
    where: slope === 12 ? 'x = f / fc' : 'x = f / fc; two stages in a row, so squared',
  };
}

/**
 * The Filter's Q (centre over bandwidth; 0.71 is flat) at a Resonance, per stage, and how many stages there are.
 * Low- and high-pass biquads take their Q in dB in Web Audio, so it is converted back to a ratio.
 */
export function filterQ(mode: FilterMode, slope: FilterSlope, resonance: number): { q: number; stages: 1 | 2 } {
  const [stage] = filterStages(mode, slope, resonance);
  const peaked = mode === 'lowpass' || mode === 'highpass';
  return { q: peaked ? 10 ** (stage.Q / 20) : stage.Q, stages: slope === 12 ? 1 : 2 };
}

const twoPlaces = (v: number) => (v < 10 ? v.toFixed(2) : v.toFixed(1));

/** "Q 0.71", or "Q 0.84 ×2" with two stages. */
export function qText(mode: FilterMode, slope: FilterSlope, resonance: number): string {
  const { q, stages } = filterQ(mode, slope, resonance);
  return `Q ${twoPlaces(q)}${stages === 2 ? ' ×2' : ''}`;
}

/** A gain as dB: "−3.1 dB", "0.0 dB", "−∞ dB" when silent. */
export function levelDb(level: number): string {
  if (level <= 0) return '−∞ dB';
  const db = 20 * Math.log10(level);
  return `${db < -0.05 ? '−' : ''}${Math.abs(db).toFixed(1)} dB`;
}

/** The Parameters whose value is a gain: the Mixer's levels and the Amp's Sustain. */
const GAINS: ParamId[] = ['mixOsc1', 'mixOsc2', 'mixSub', 'mixNoise', 'ampSustain'];

/** What a knob or fader reads in the Maths Layer instead of its everyday value, if anything. */
export function mathsReadout(id: ParamId, value: number, patch: Patch): string | undefined {
  if (id === 'resonance') return qText(patch.filterMode, patch.filterSlope, value);
  if (GAINS.includes(id)) return levelDb(value);
  return undefined;
}

/** The widest readout a Parameter can show in the Maths Layer, to size its column while the layer is on. */
export function widestMathsReadout(id: ParamId): string | undefined {
  if (id === 'resonance') return 'Q 15.8 ×2';
  if (GAINS.includes(id)) return '−99.9 dB';
  return undefined;
}
