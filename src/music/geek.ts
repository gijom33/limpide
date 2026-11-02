import { filterStages } from '../engine/filterDesign';
import { type FilterMode, type FilterSlope, FM_INDEX, fmIndex, osc1Heard, type ParamId, type Patch } from '../patch/patch';
import { WAVEFORM_NAMES, type Waveform } from './harmonics';
import { besselJ, osc2Ratio } from './idealReference';
import { noteToFrequency } from './pitch';

/**
 * The Synth Geek Layer's content (issue 14): the quantities behind the sound, as data. The formulas are the ones the
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


/** A ratio as the Synth Geek Layer writes it: "1", "2.38". */
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
  // Osc 1 silent (its fader down, Ring off): its series, but not what sounds, FM or not.
  if (!fm && !ring) return [osc1Heard(patch) ? series : { formula: series.formula, where: `${series.where}; Osc 1 is silent: not the sound now` }];
  const r = osc2Ratio(patch);
  const lines: Formula[] = [];
  if (fm) {
    const index = fmIndex(patch.crossMod);
    const j = Array.from(besselJ(index, 3), (v) => Math.abs(v).toFixed(2)).join(' ');
    const landing = Math.abs(r - Math.round(r)) < 1e-6 && r >= 1 ? 'on the Harmonics' : 'between the Harmonics';
    const osc2 = patch.osc2Waveform === 'sine' ? '' : `; Osc 2 a ${WAVEFORM_NAMES[patch.osc2Waveform]}: its 1st Harmonic only`;
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

/**
 * The Note the layer's numbers are worked out at (issue 133, decision 6): the last Note played, as a MIDI note number;
 * before any (null), A4, and the readout says so with BEFORE_ANY_NOTE.
 */
export type GeekNote = number | null;
const A4 = 69;
export const BEFORE_ANY_NOTE = 'at A4';
/** The frequency of the Note the numbers use, in Hz. */
export const geekNoteHz = (note: GeekNote) => noteToFrequency(note ?? A4);

/** Whole octaves under the Note, as fractions. */
const FRACTIONS = ['1', '½', '¼'];
/** A frequency ratio as a multiple: whole octaves as "×2", "×½"; anything else to three places, "×1.498". */
function multipleText(ratio: number): string {
  const octaves = Math.log2(ratio);
  if (Math.abs(octaves - Math.round(octaves)) > 1e-9) return `×${ratio.toFixed(3)}`;
  const k = Math.round(octaves);
  return `×${k >= 0 ? 2 ** k : FRACTIONS[-k]}`;
}

/**
 * How fast Osc 2 beats against a tone at its pitch before Detune, in Hz (issue 167): Δf = f·(2^(c/1200) − 1), f the
 * Note played moved by Osc 2's Octave and Semitone, as the engine tunes it (osc2Cents), c the cents of Detune.
 */
export function detuneBeatsHz(patch: Patch, cents: number, note: GeekNote): number {
  const f = geekNoteHz(note) * 2 ** (patch.osc2Octave + patch.osc2Semitone / 12);
  return Math.abs(f * (2 ** (cents / 1200) - 1));
}
/** A rate in Hz to three figures: "2.55 Hz", "25.5 Hz", "981 Hz". */
const hzText = (hz: number) => `${hz < 10 ? hz.toFixed(2) : hz < 100 ? hz.toFixed(1) : Math.round(hz)} Hz`;

/**
 * A readout of the Synth Geek Layer: its figure, and the words after it, if any, which are left out where the readout
 * shows in the name's place (phones, issue 83), too narrow for them: "2.55 Hz" and "beats".
 */
export interface GeekReadout {
  figure: string;
  words?: string;
}

/**
 * What a knob or fader reads in the Synth Geek Layer instead of its everyday value, if anything, in its parts; `note`
 * is the last Note played, for the readouts that depend on it.
 */
export function geekReadoutParts(id: ParamId, value: number, patch: Patch, note: GeekNote = null): GeekReadout | undefined {
  if (id === 'resonance') return { figure: qText(patch.filterMode, patch.filterSlope, value) };
  if (GAINS.includes(id)) return { figure: levelDb(value) };
  if (id === 'osc2Octave') return { figure: multipleText(2 ** value) };
  if (id === 'osc2Semitone') return { figure: multipleText(2 ** (value / 12)) };
  if (id === 'osc2Detune') return { figure: hzText(detuneBeatsHz(patch, value, note)), words: note === null ? BEFORE_ANY_NOTE : 'beats' };
  return undefined;
}

/** A readout's whole text: "2.55 Hz beats". */
export const readoutText = ({ figure, words }: GeekReadout) => (words ? `${figure} ${words}` : figure);

/** What a knob or fader reads in the Synth Geek Layer, as a whole: "Q 0.71", "2.55 Hz beats". */
export function geekReadout(id: ParamId, value: number, patch: Patch, note: GeekNote = null): string | undefined {
  const parts = geekReadoutParts(id, value, patch, note);
  return parts && readoutText(parts);
}

/** The widest readout a Parameter can show in the Synth Geek Layer, to size its column while the layer is on. */
export function widestGeekReadout(id: ParamId): string | undefined {
  if (id === 'resonance') return 'Q 15.8 ×2';
  if (GAINS.includes(id)) return '−99.9 dB';
  if (id === 'osc2Octave' || id === 'osc2Semitone') return '×0.000';
  // Its widest at the top of MIDI's Notes, Osc 2 three octaves up: 2.9 kHz.
  if (id === 'osc2Detune') return '9999 Hz beats';
  return undefined;
}

/**
 * The formulas in the tips, under "Under the hood" (issue 133, decision 2), shown with the Synth Geek Layer on, above
 * History: each the one the engine computes, its letters said. Keyed by what they explain; the tips name theirs.
 */
export const UNDER_THE_HOOD = {
  osc2Octave: { formula: 'f₂ = f × 2^o', where: 'o: the Octave; f: the Note played. Each octave doubles the frequency: ×2 up, ×½ down.' },
  osc2Semitone: {
    formula: 'f₂ = f × 2^(s/12)',
    where: 's: the Semitones; f: the Note played. Twelve equal steps to an octave, each ×1.059; +7 is ×1.498, near a fifth’s 3/2.',
  },
  osc2Detune: {
    formula: 'Δf = f·(2^(c/1200) − 1)',
    where: 'Δf: the beats per second against a tone at f; c: the cents; f: Osc 2 before Detune, on the Note played (A4 until one is).',
  },
  noise: {
    formula: 'white: P(f) flat;  pink: P(f) ∝ 1/f, −3 dB per octave',
    where: 'P(f): the power at each frequency. Pink is white through Paul Kellet’s filter, −10 dB a decade, as loud overall.',
  },
} satisfies Record<string, Formula>;
