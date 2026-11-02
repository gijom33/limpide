import { filterStages } from '../engine/filterDesign';
import { destinationSwings, effectiveCutoff, KEY_TRACK_CENTRE, LFO_LAWS, osc2Cents } from '../modulation/modulationModel';
import {
  type FilterMode, type FilterSlope, FM_INDEX, fmIndex, formatParam, LFO_DESTINATIONS, LFO_KEYS, type LfoDestination, type LfoNumber, osc1Heard,
  type ParamId, type Patch,
} from '../patch/patch';
import { WAVEFORM_NAMES, type Waveform } from './harmonics';
import { besselJ, osc2Ratio } from './idealReference';
import { A4_MIDI, noteToFrequency } from './pitch';
import { NOTE_VALUES, TEMPO } from './tempo';

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
 * before any (null), A4. Detune's readout says so with BEFORE_ANY_NOTE; Key Track's has no room to (issue 169), its tip
 * says it.
 */
export type GeekNote = number | null;
/** Where a readout is worked out: at the Note played (A4 before any) and the page's tempo, for a synced Rate. */
export interface GeekAt {
  note?: GeekNote;
  bpm?: number;
}
export const BEFORE_ANY_NOTE = 'at A4';
/** The frequency of the Note the numbers use, in Hz. */
export const geekNoteHz = (note: GeekNote) => noteToFrequency(note ?? A4_MIDI);

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
 * Note played moved by Osc 2's Transpose as the engine tunes it (osc2Cents, the knobs alone), c the cents of Detune.
 */
export function detuneBeatsHz(patch: Patch, cents: number, note: GeekNote): number {
  const f = geekNoteHz(note) * 2 ** (osc2Cents({ ...patch, osc2Detune: 0 }) / 1200);
  return Math.abs(f * (2 ** (cents / 1200) - 1));
}
/** A rate in Hz to three figures: "2.55 Hz", "25.5 Hz", "981 Hz". */
const hzText = (hz: number) => `${hz < 10 ? hz.toFixed(2) : hz < 100 ? hz.toFixed(1) : Math.round(hz)} Hz`;

/** A period in seconds, to two or three figures: "0.50 s", "0.050 s", "20.0 s". */
const periodText = (seconds: number) => `${seconds < 0.1 ? seconds.toFixed(3) : twoPlaces(seconds)} s`;

/** The Parameters of each LFO's knobs, by the LFO: its Rate in Hz, its note value (Sync on) and its Depth. */
const LFO_OF = new Map<ParamId, { lfo: LfoNumber; knob: 'rate' | 'note' | 'amount' }>(
  ([1, 2] as const).flatMap((lfo) => (['rate', 'note', 'amount'] as const).map((knob): [ParamId, { lfo: LfoNumber; knob: typeof knob }] => [LFO_KEYS[lfo][knob], { lfo, knob }])),
);

/**
 * Where an LFO on the Pulse Width measures its room (issue 74's law): Osc 1's width, or Osc 2's while it alone is a
 * pulse. Each Oscillator's swing is kept within its own width's room in the engine.
 */
const pulseWidthOf = (patch: Patch) => (patch.waveform !== 'pulse' && patch.osc2Waveform === 'pulse' ? patch.osc2PulseWidth : patch.pulseWidth);
/** The knob's value an LFO's room on `destination` is measured from, as the engine measures it. */
const ROOM_FROM: Partial<Record<LfoDestination, (patch: Patch) => number>> = {
  pulseWidth: pulseWidthOf,
  fm: (patch) => patch.crossMod,
  resonance: (patch) => patch.resonance,
};

/** A swing each way in a unit: "±0.80 oct", "±12.0 st"; a share of a knob's travel in %, "±12 %". */
const swingText = (swing: number, unit: string) => (unit === '%' ? `±${Math.round(swing * 100)} %` : `±${twoPlaces(swing)} ${unit}`);
/** Each Destination's unit, its knob's (Pitch's semitones, the Cutoff's octaves). */
const UNITS: Record<Exclude<LfoDestination, 'volume'>, string> = {
  pitch: 'st', osc2Pitch: 'st', detune: '¢', pulseWidth: '%', fm: '%', cutoff: 'oct', resonance: '%',
};

/**
 * How far LFO `lfo` swings its Destination at a Depth of `depth` (issue 169), in the Destination's own unit, as the
 * engine does: by its law, both LFOs on one sharing its room. Volume's wave tops at the Envelope's level and dips: its
 * foot in dB below the top.
 */
function depthSwingText(patch: Patch, lfo: LfoNumber, depth: number): string {
  const keys = LFO_KEYS[lfo];
  const destination = patch[keys.destination];
  const swung = { ...patch, [keys.amount]: depth };
  const swing = destinationSwings(swung, destination, ROOM_FROM[destination]?.(patch))[lfo - 1];
  return destination === 'volume' ? levelDb(1 - 2 * swing) : swingText(swing, UNITS[destination]);
}

/**
 * The Cutoff at the Note played (A4 before any) under Key Track (issue 169): the Effective Cutoff's figure with the
 * Filter Envelope at rest and no LFO or Velocity moving it.
 */
const keyTrackedCutoff = (patch: Patch, note: GeekNote) => effectiveCutoff(patch, 0, [], 0, note ?? A4_MIDI);

/**
 * A readout of the Synth Geek Layer: its figure, and the words after it, if any, which are left out where the readout
 * shows in the name's place (phones, issue 83), too narrow for them: "2.55 Hz" and "beats".
 */
export interface GeekReadout {
  figure: string;
  words?: string;
}

/**
 * What a knob or fader reads in the Synth Geek Layer instead of its everyday value, if anything, in its parts; `at`
 * the last Note played and the tempo, for the readouts that depend on them.
 */
export function geekReadoutParts(id: ParamId, value: number, patch: Patch, { note = null, bpm = TEMPO.default }: GeekAt = {}): GeekReadout | undefined {
  if (id === 'resonance') return { figure: qText(patch.filterMode, patch.filterSlope, value) };
  if (GAINS.includes(id)) return { figure: levelDb(value) };
  if (id === 'osc2Octave') return { figure: multipleText(2 ** value) };
  if (id === 'osc2Semitone') return { figure: multipleText(2 ** (value / 12)) };
  if (id === 'osc2Detune') return { figure: hzText(detuneBeatsHz(patch, value, note)), words: note === null ? BEFORE_ANY_NOTE : 'beats' };
  // Issue 169: an LFO's period, at the tempo while synced, and its swing; the Cutoff at the Note under Key Track.
  const lfo = LFO_OF.get(id);
  if (lfo?.knob === 'rate') return { figure: periodText(1 / value) };
  if (lfo?.knob === 'note') return { figure: periodText((NOTE_VALUES[Math.round(value)].beats * 60) / bpm) };
  if (lfo?.knob === 'amount') return { figure: depthSwingText(patch, lfo.lfo, value) };
  if (id === 'keyTrack') return { figure: formatParam('cutoff', keyTrackedCutoff({ ...patch, keyTrack: value }, note)) };
  return undefined;
}

/** A readout's whole text: "2.55 Hz beats". */
export const readoutText = ({ figure, words }: GeekReadout) => (words ? `${figure} ${words}` : figure);

/** What a knob or fader reads in the Synth Geek Layer, as a whole: "Q 0.71", "2.55 Hz beats". */
export function geekReadout(id: ParamId, value: number, patch: Patch, at: GeekAt = {}): string | undefined {
  const parts = geekReadoutParts(id, value, patch, at);
  return parts && readoutText(parts);
}

/**
 * The widest readouts a Parameter can show in the Synth Geek Layer, to size its column while the layer is on: several
 * where which is widest depends on the font.
 */
export function widestGeekReadout(id: ParamId): string[] {
  if (id === 'resonance') return ['Q 15.8 ×2'];
  if (GAINS.includes(id)) return ['−99.9 dB'];
  if (id === 'osc2Octave' || id === 'osc2Semitone') return ['×0.000'];
  // Its widest at the top of MIDI's Notes, Osc 2 three octaves up: 2.9 kHz.
  if (id === 'osc2Detune') return ['9999 Hz beats'];
  const lfo = LFO_OF.get(id);
  if (lfo?.knob === 'rate' || lfo?.knob === 'note') return ['0.000 s', '00.0 s'];
  if (lfo?.knob === 'amount') return ['±12.0 st', '±2.00 oct', '±50.0 ¢', '±40 %', '−99.9 dB'];
  if (id === 'keyTrack') return ['20.00 kHz'];
  return [];
}

/**
 * Each Destination's reach at full Depth, by its law: "Pitch ±1 st", "Pulse Width ±40 %"; those whose reach is their
 * whole range (FM, the Resonance) and Volume, which dips, are said apart.
 */
const REACH = LFO_DESTINATIONS.flatMap(({ id, label }) => {
  if (id === 'volume') return [];
  const unit = UNITS[id];
  const reach = LFO_LAWS[id].perDepth;
  if (unit === '%' && reach === 1) return [];
  return [`${label} ±${unit === '%' ? Math.round(reach * 100) : reach} ${unit}`];
}).join(', ');

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
  // Issue 169: the LFOs and Key Track.
  lfoRate: { formula: 'T = 1 / f', where: 'T: the period, one cycle, in seconds; f: the Rate in Hz.' },
  lfoNote: {
    formula: 'T = beats × 60 / BPM',
    where: 'T: the period, one cycle, in seconds; beats: the note value’s length (1/4 is one, D half as long again, T two thirds).',
  },
  lfoDepth: {
    formula: 'swing = Depth × its reach',
    where: `each way, in the Destination’s unit. The reach at full Depth: ${REACH}; FM and Resonance their whole range. Volume dips from the top: 20 log₁₀(1 − Depth) dB. Two LFOs on one share its room, never past its ends.`,
  },
  keyTrack: {
    formula: `fc = Cutoff × 2^(k·(n − ${KEY_TRACK_CENTRE})/12)`,
    where: `fc: the Cutoff at the Note n played (A4, ${A4_MIDI}, until one is; C4 is ${KEY_TRACK_CENTRE}); k: Key Track, 1 at 100 %. The Filter Envelope, the LFOs and Velocity move it from there.`,
  },
  noise: {
    formula: 'white: P(f) flat;  pink: P(f) ∝ 1/f, −3 dB per octave',
    where: 'P(f): the power at each frequency. Pink is white through Paul Kellet’s filter, −10 dB a decade, as loud overall.',
  },
} satisfies Record<string, Formula>;
