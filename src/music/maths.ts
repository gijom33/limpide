import { filterStages } from '../engine/filterDesign';
import { type FilterMode, type FilterSlope, osc1Heard, type ParamId, type Patch } from '../patch/patch';
import type { Waveform } from './harmonics';
import { besselJ, FM_INDEX, osc2Ratio } from './idealReference';

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

const WAVE_NAMES: Record<Waveform, string> = { sine: 'Sine', saw: 'Saw', square: 'Square', triangle: 'Triangle', pulse: 'Pulse' };

/** A ratio as the Maths Layer writes it: "1", "2.38". */
const ratioText = (r: number) => String(Number(r.toFixed(2)));

/**
 * The Oscillator Spectrum's lines (issue 109): Osc 1's Harmonic series while it is what sounds; under FM, FM's rule with
 * the figures for the knobs, Osc 1's series marked as what FM starts from; with Ring up, the sum and the difference.
 * Its own series is left out where Osc 1 is heard through Ring alone. The Sub, Osc 2's own fader and the Noise are not
 * written (the Ideal draws them).
 */
export function oscillatorFormulas(patch: Patch): Formula[] {
  const series = harmonicFormula(patch.waveform, patch.pulseWidth);
  const fm = patch.crossMod > 0 && osc1Heard(patch);
  const ring = patch.mixRing > 0;
  if (!fm && !ring) return [series];
  const r = osc2Ratio(patch);
  const lines: Formula[] = [];
  if (fm) {
    const index = FM_INDEX * patch.crossMod;
    const j = Array.from(besselJ(index, 3), (v) => Math.abs(v).toFixed(2)).join(' ');
    const landing = Math.abs(r - Math.round(r)) < 1e-6 && r >= 1 ? 'on the Harmonics' : 'between the Harmonics';
    const osc2 = patch.osc2Waveform === 'sine' ? '' : `; Osc 2 a ${WAVE_NAMES[patch.osc2Waveform]}: its 1st Harmonic only`;
    lines.push({
      formula: `n f₁ + k f₂:  bₙ |Jₖ(n β)|,  β = ${FM_INDEX} × FM = ${index.toFixed(2)}`,
      where: `f₂ / f₁ = ${ratioText(r)}: ${landing}; |J₀…J₃(β)| ${j}${osc2}`,
    });
    lines.push({ formula: series.formula, where: 'bₙ: Osc 1 before FM, not the sound now' });
  } else if (patch.mixOsc1 > 0) {
    lines.push({ formula: series.formula, where: `${series.where}; Osc 1’s own, Ring adds the rest` });
  }
  if (ring) {
    const difference = Math.abs(r - 1);
    lines.push({
      formula: 'Ring, Osc 1 × Osc 2:  n f₁ ± m f₂,  ½ bₙ cₘ',
      where: `sums and differences (cₘ: Osc 2’s series); the first pair ${difference < 1e-6 ? '0 (taken out)' : ratioText(difference)} and ${ratioText(r + 1)} × f₁`,
    });
  }
  return lines;
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
const GAINS: ParamId[] = ['mixOsc1', 'mixOsc2', 'mixSub', 'mixNoise', 'ampSustain', 'volume'];

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
