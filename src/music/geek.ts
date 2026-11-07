import { filterStages, isMadeUp, isPeaked, MAKE_UP_RISES_FROM, makeUp } from '../engine/filterDesign';
import { type EnvelopeStage, STAGE_SHARPNESS, stageTimeConstant } from '../modulation/envelope';
import { GLIDE_SHARPNESS } from '../modulation/lfo';
import { destinationSwings, effectiveCutoff, KEY_TRACK_CENTRE, LFO_LAWS, type LfoLaw } from '../modulation/modulationModel';
import {
  type FilterMode, type FilterSlope, FM_INDEX, fmIndex, formatParam, LFO_DESTINATIONS, LFO_KEYS, type LfoNumber, type NoiseColour,
  PARAMS, type ParamId, type Patch, rateOf, secondsText,
} from '../patch/patch';
import { harmonicSeries, WAVEFORM_NAMES, type Waveform } from './harmonics';
import { besselJ, osc2Ratio } from './idealReference';
import { A4_MIDI, noteToFrequency, preciseFrequencyText } from './pitch';
import { NOTE_VALUES, noteHz } from './tempo';

/**
 * The Synth Geek Layer's content (issue 14): the quantities behind the sound, as data. The formulas are the ones the
 * Viewers already compute from (the Harmonic series of each Waveform, a biquad's gain per frequency), written out.
 */

/**
 * A formula, and what its letters mean; in a tip, with what it says in plain words before it where it needs saying
 * (issue 235).
 */
export interface Formula {
  says?: string;
  formula: string;
  where: string;
}

/** "2nd", "3rd", "4th", "21st". */
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
/** The Harmonics a Pulse's gaps are said up to: the first ones the Spectrum shows apart. */
const PULSE_GAPS_SAID = 20;

/** The letters every Harmonic series shares. */
const N_IS = 'n: the Harmonic’s number, 1 the fundamental';
const B_IS = 'bₙ: its amplitude, the wave’s peak being 1';
/** The letters of the Saw's, the Square's and the Triangle's series. */
const SERIES_WHERE = `${N_IS}; ${B_IS}; π: 3.14…`;

/**
 * The Harmonic series of a Waveform, as the Ideal Reference draws it, for its tip (issue 235): what it says, then the
 * formula, its letters named; a Pulse's gaps worked out at its width.
 */
export function harmonicFormula(waveform: Waveform, pulseWidth: number): Formula {
  switch (waveform) {
    case 'sine':
      return { says: 'A Sine is its fundamental alone: no other Harmonic.', formula: 'b₁ = 1,  bₙ = 0 for n > 1', where: `${N_IS}; ${B_IS}.` };
    case 'saw':
      return {
        says: 'A Saw has every Harmonic, each its number times quieter than the first: the 2nd at half, the 3rd at a third.',
        formula: 'bₙ = 2 / (π n)',
        where: SERIES_WHERE,
      };
    case 'square':
      return {
        says: 'A Square has the odd Harmonics only, each its number times quieter than the first: the 3rd at a third, the 5th at a fifth.',
        formula: 'bₙ = 4 / (π n),  odd n only',
        where: SERIES_WHERE,
      };
    case 'triangle':
      return {
        says: 'A Triangle has the odd Harmonics only, falling by the square of their number: the 3rd at a ninth, the 5th at a twenty-fifth, every other one upside down.',
        formula: 'bₙ = 8 / (π² n²),  odd n only',
        where: SERIES_WHERE,
      };
    case 'pulse': {
      const percent = Math.round(pulseWidth * 100);
      const every = 100 / gcd(percent, 100);
      const gaps = every <= PULSE_GAPS_SAID ? `: every ${ordinal(every)} Harmonic missing` : '';
      // The one played keeps no offset and is low for d of a cycle, its series scaled to a peak of 1 as every wave's
      // (fact-checked for 1.26.0).
      return {
        says: 'A Pulse’s Harmonics follow its width: one is missing wherever a whole number of its cycles fits the high part exactly. At 50 % it is a Square.',
        formula: 'aₙ = 4 sin(π n d) / (π n)',
        where: `${N_IS}; aₙ: its amplitude for a Pulse 2 from its low to its high; the one played is low for d of each cycle and high for the rest, centred on 0 and scaled so its peak is 1, so its Harmonics are smaller by one factor, in the same pattern; d: the Pulse Width, ${percent} % now${gaps}; π: 3.14…. aₙ is 0 wherever n d is whole.`,
      };
    }
  }
}

/** A ratio as the Synth Geek Layer writes it: "1", "2.38". */
const ratioText = (r: number) => String(Number(r.toFixed(2)));

/**
 * FM's rule, for its tip (issues 109 and 235): the partials it adds around each of Osc 1's
 * Harmonics, with the figures for the knobs as they are: β, J₀ to J₃ of it, and where the partials land.
 */
export function fmFormula(patch: Patch): Formula {
  const r = osc2Ratio(patch);
  const index = fmIndex(patch.crossMod);
  const j = Array.from(besselJ(index, 3), (v) => Math.abs(v).toFixed(2)).join(' ');
  const landing = Math.abs(r - Math.round(r)) < 1e-6 && r >= 1 ? 'on the Harmonics' : 'between the Harmonics';
  // The Bessel figures hold for a Sine swinging Osc 1's pitch; Osc 2's other Harmonics swing it too, and a Pulse's
  // missing Harmonics still gain partials (fact-checked for 1.25.0).
  const osc2 = patch.osc2Waveform === 'sine' ? '' : ` Osc 2 a ${WAVEFORM_NAMES[patch.osc2Waveform]}: its other Harmonics swing Osc 1 too, adding partials, so these figures hold for a Sine.`;
  const osc1 = patch.waveform === 'pulse' ? ' Osc 1 a Pulse: partials come even around its missing Harmonics.' : '';
  return {
    says: 'FM adds partials on each side of each of Osc 1’s Harmonics, a step of Osc 2’s frequency apart; how loud each is follows a Bessel function of how far FM swings the pitch.',
    formula: `n f₁ + k f₂:  bₙ |Jₖ(n β)|,  β = ${FM_INDEX} × FM = ${index.toFixed(2)}`,
    where: `n: Osc 1’s Harmonic’s number; f₁, f₂: Osc 1’s and Osc 2’s frequencies, f₂ / f₁ = ${ratioText(r)} now: ${landing}; bₙ: the Harmonic’s amplitude before FM; k: how many steps of f₂ from the Harmonic, either side (0 the Harmonic itself); Jₖ: the Bessel function of order k, |J₀…J₃(β)| ${j} now; β: the modulation index, how far FM swings the pitch, over f₂. On high Notes FM is kept smaller, β with it, so few of its partials pass the top of what the browser plays.${osc2}${osc1}`,
  };
}

/** Ring's sums and differences, for its tip (issues 109 and 235), its first pair at the knobs. */
export function ringFormula(patch: Patch): Formula {
  const r = osc2Ratio(patch);
  const difference = Math.abs(r - 1);
  return {
    says: 'Ring multiplies the two waves: each pair of Harmonics, one of Osc 1’s and one of Osc 2’s, becomes two partials, at their sum and at their difference, in place of the pitches themselves.',
    formula: 'n f₁ ± m f₂,  ½ bₙ cₘ',
    where: `n, m: Osc 1’s and Osc 2’s Harmonics’ numbers; f₁, f₂: their frequencies; bₙ, cₘ: those Harmonics’ amplitudes, so each partial is half their product. The first pair, n = m = 1, at ${difference < 1e-6 ? '0 (taken out)' : ratioText(difference)} and ${ratioText(r + 1)} × f₁ now.`,
  };
}

/** The 12 dB core of each Filter Mode's gain, over x = f / fc. */
const CORE: Record<FilterMode, string> = {
  lowpass: '1',
  highpass: 'x²',
  bandpass: 'x / Q',
  notch: '|1 − x²|',
};

/** What each Filter Mode's response says, in plain words (issue 235). */
const RESPONSE_SAYS: Record<FilterMode, string> = {
  lowpass: 'Low-pass: the gain is 1 well below the Cutoff, so those Harmonics pass unchanged, and falls ever further above it; the higher Q, the higher a peak at the Cutoff.',
  highpass: 'High-pass, low-pass turned around: the gain is 1 well above the Cutoff and falls ever further below it; the higher Q, the higher a peak at the Cutoff.',
  bandpass: 'Band-pass: the gain is G right at the Cutoff and falls either side of it; the higher Q, the narrower the band, and the higher G, up to its ceiling, so the band passes about as much as a low-pass would short of the highest Resonance.',
  notch: 'Notch: the gain is 0 right at the Cutoff, where 1 − x² is, and 1 away from it; the higher Q, the narrower the gap.',
};

/**
 * The Response Curve's gain per frequency for a Filter Mode and Slope: one biquad, or two in a row at 24 dB; for the
 * Mode's and the Slope's tips (issue 235), what it says before it.
 */
export function responseFormula(mode: FilterMode, slope: FilterSlope): Formula {
  const one = `${CORE[mode]} / √((1 − x²)² + (x / Q)²)`;
  const top = slope === 12 ? '−44.8 dB at 16 kHz, against −36.1 dB here' : '−89.5 dB at 16 kHz, against −72.2 dB here';
  // A band-pass's make-up (issue 231), outside the stages: the 0 dB band raised to about a low-pass's level.
  const gained = isMadeUp(mode) ? 'G · ' : '';
  const where = `x = f / fc, 1 at the Cutoff; |H|: the gain at the frequency f, 1 unchanged, 0 silent; fc: the Cutoff; Q: the Resonance as the Filter’s Q, which its knob reads in this layer${isMadeUp(mode) ? `; ${makeUpWords(slope)}` : ''}. This is the analogue Filter’s formula: the browser’s digital one falls faster near the top, a low-pass at a 2 kHz Cutoff and a flat Q (${slope === 12 ? '0.71' : '0.84 a stage'}) ${top} (at 48 kHz).`;
  return slope === 12
    ? { says: RESPONSE_SAYS[mode], formula: `|H| = ${gained}${one}`, where }
    : { says: `${RESPONSE_SAYS[mode]} At 24 dB, two of these Filters in a row: the gain squared, falling twice as fast.`, formula: `|H| = ${gained}(${one})²`, where };
}

/** The band-pass's make-up, G, in words: its dB at Init's Resonance and under, and at most (issue 231). */
function makeUpWords(slope: FilterSlope): string {
  const db = (resonance: number) => Math.round(20 * Math.log10(makeUp('bandpass', slope, resonance)));
  return `G: the make-up, ${db(0)} dB up to ${MAKE_UP_RISES_FROM * 100} % Resonance, rising as √Q above it to ${db(1)} dB at most, as a narrower band lets less of a saw through`;
}

/**
 * The Filter's Q (centre over bandwidth; 0.71 is flat) at a Resonance, per stage, and how many stages there are.
 * Low- and high-pass biquads take their Q in dB in Web Audio, so it is converted back to a ratio.
 */
export function filterQ(mode: FilterMode, slope: FilterSlope, resonance: number): { q: number; stages: 1 | 2 } {
  const [stage] = filterStages(mode, slope, resonance);
  return { q: isPeaked(mode) ? 10 ** (stage.Q / 20) : stage.Q, stages: slope === 12 ? 1 : 2 };
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
/** Where a readout is worked out: at the Note played (A4 before any). */
export interface GeekAt {
  note?: GeekNote;
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

/** The highest Harmonic of either Oscillator whose beats Detune's readout counts (issue 256). */
const BEATING_HARMONICS = 8;
/** How near two Harmonics must be to nearly coincide, in cents: a quarter-tone, Detune's reach. */
const COINCIDING_CENTS = 50;
/** Beats this fast or faster are heard as roughness, no longer as beats (issue 256). */
const BEATS_HEARD_BELOW_HZ = 20;
/** The top of what is heard: Harmonics above it beat unheard. */
const HEARD_UP_TO_HZ = 20000;
/** Whether a Waveform has its nth Harmonic, n up to BEATING_HARMONICS: a Square none of its even ones. */
const hasHarmonic = (waveform: Waveform, pulseWidth: number) => {
  const { magnitudes } = harmonicSeries(waveform, pulseWidth, BEATING_HARMONICS + 1);
  return (n: number) => magnitudes[n] > 1e-4;
};

/**
 * How fast Osc 2 beats against Osc 1, in Hz (issue 256): the beats of the lowest pair of their Harmonics that nearly
 * coincide, Osc 1's pth against Osc 2's qth, f₂ / f₁ near p / q, Δf = |p f₁ − q f₂|; f₁ and f₂ at the Note played, Osc 2
 * tuned by its knobs as the engine tunes it (osc2Ratio), c the cents of Detune. Undefined where no pair is heard
 * beating: none up to the 8th Harmonics within a quarter-tone and under what is heard, or the lowest beating at 20 Hz
 * or faster.
 */
export function detuneBeatsHz(patch: Patch, cents: number, note: GeekNote): number | undefined {
  const f1 = geekNoteHz(note) * 2 ** patch.osc1Octave;
  const ratio = osc2Ratio({ ...patch, osc2Detune: cents });
  const osc1Has = hasHarmonic(patch.waveform, patch.pulseWidth);
  const osc2Has = hasHarmonic(patch.osc2Waveform, patch.osc2PulseWidth);
  for (let p = 1; p <= BEATING_HARMONICS && p * f1 < HEARD_UP_TO_HZ; p++) {
    const q = Math.round(p / ratio);
    if (q < 1 || q > BEATING_HARMONICS || Math.abs(1200 * Math.log2((q * ratio) / p)) > COINCIDING_CENTS + 1e-9) continue;
    if (!osc1Has(p) || !osc2Has(q)) continue;
    const beats = Math.abs(p - q * ratio) * f1;
    return beats < BEATS_HEARD_BELOW_HZ ? beats : undefined;
  }
  return undefined;
}
/** What Detune reads where no pair of Harmonics is heard beating (issue 256). */
const NO_BEATS = 'no beats';
/** A rate in Hz to three figures: "2.55 Hz", "25.5 Hz", "981 Hz". */
const hzText = (hz: number) => `${hz < 10 ? hz.toFixed(2) : hz < 100 ? hz.toFixed(1) : Math.round(hz)} Hz`;

/** A period in seconds, to two or three figures: "0.50 s", "0.050 s", "20.0 s". */
const periodText = (seconds: number) => `${seconds < 0.1 ? seconds.toFixed(3) : twoPlaces(seconds)} s`;

/** A swing each way in a unit: "±0.80 oct", "±12.0 st"; a share of a knob's travel in %, "±12 %". */
const swingText = (swing: number, unit: string) => (unit === '%' ? `±${Math.round(swing * 100)} %` : `±${twoPlaces(swing)} ${unit}`);

/**
 * How far LFO `lfo` swings its Destination at a Depth of `depth` (issue 169), in the Destination's own unit, as the
 * engine does: by its law, both LFOs on one sharing its room. Volume's wave tops at the Envelope's level and dips: its
 * foot in dB below the top.
 */
function depthSwingText(patch: Patch, lfo: LfoNumber, depth: number): string {
  const keys = LFO_KEYS[lfo];
  const destination = patch[keys.destination];
  const law: LfoLaw = LFO_LAWS[destination];
  const swung = { ...patch, [keys.amount]: depth };
  const swing = destinationSwings(swung, destination, law.roomFrom?.(patch))[lfo - 1];
  return destination === 'volume' ? levelDb(1 - 2 * swing) : swingText(swing, law.unit);
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
 * One control of the Synth Geek Layer: what it reads instead of its everyday value, in its parts, and the widest it can
 * read, to size its column while the layer is on (several where which is widest depends on the font; in their parts,
 * as where the name's place shows the figure alone, the figure's width is the one it must fit, issue 207). One table,
 * so a readout and its widest are written side by side (issue 196).
 */
interface GeekControl {
  /** `at` with its defaults filled in. */
  read(value: number, patch: Patch, at: Required<GeekAt>): GeekReadout;
  widest: readonly GeekReadout[];
}

const figures = (...all: string[]): GeekReadout[] => all.map((figure) => ({ figure }));
const gain: GeekControl = { read: (value) => ({ figure: levelDb(value) }), widest: figures('−99.9 dB') };
const multiple = (ratio: (value: number) => number): GeekControl => ({ read: (value) => ({ figure: multipleText(ratio(value)) }), widest: figures('×0.000') });
// Issue 169: an LFO's swing. Its Rate reads as without the layer, its period in its tip (issue 202).
const lfoControls = (lfo: LfoNumber): [ParamId, GeekControl][] => [
  [LFO_KEYS[lfo].amount, { read: (value, patch) => ({ figure: depthSwingText(patch, lfo, value) }), widest: figures('±12.0 st', '±2.00 oct', '±50.0 ¢', '±40 %', '−99.9 dB') }],
];

const GEEK_CONTROLS: Partial<Record<ParamId, GeekControl>> = {
  resonance: { read: (value, patch) => ({ figure: qText(patch.filterMode, patch.filterSlope, value) }), widest: figures('Q 15.8 ×2') },
  ...Object.fromEntries(GAINS.map((id) => [id, gain])),
  osc2Octave: multiple((value) => 2 ** value),
  osc2Semitone: multiple((value) => 2 ** (value / 12)),
  // Issue 256: under 20 Hz, or no beats said.
  osc2Detune: {
    read: (value, patch, { note }) => {
      const beats = detuneBeatsHz(patch, value, note);
      const atA4 = note === null ? BEFORE_ANY_NOTE : undefined;
      return beats === undefined ? { figure: NO_BEATS, words: atA4 } : { figure: hzText(beats), words: atA4 ?? 'beats' };
    },
    widest: [{ figure: '20.0 Hz', words: 'beats' }, { figure: NO_BEATS, words: BEFORE_ANY_NOTE }],
  },
  ...Object.fromEntries([...lfoControls(1), ...lfoControls(2)]),
  // Issue 169: the Cutoff at the Note under Key Track.
  keyTrack: { read: (value, patch, { note }) => ({ figure: formatParam('cutoff', keyTrackedCutoff({ ...patch, keyTrack: value }, note)) }), widest: figures('20.00 kHz') },
};

/**
 * What a knob or fader reads in the Synth Geek Layer instead of its everyday value, if anything, in its parts; `at`
 * the last Note played, for the readouts that depend on it.
 */
export function geekReadoutParts(id: ParamId, value: number, patch: Patch, { note = null }: GeekAt = {}): GeekReadout | undefined {
  return GEEK_CONTROLS[id]?.read(value, patch, { note });
}

/** A readout's whole text: "2.55 Hz beats". */
export const readoutText = ({ figure, words }: GeekReadout) => (words ? `${figure} ${words}` : figure);

/** What a knob or fader reads in the Synth Geek Layer, as a whole: "Q 0.71", "2.55 Hz beats". */
export function geekReadout(id: ParamId, value: number, patch: Patch, at: GeekAt = {}): string | undefined {
  const parts = geekReadoutParts(id, value, patch, at);
  return parts && readoutText(parts);
}

/** The widest readouts a Parameter can show in the Synth Geek Layer: see `GeekControl`. */
export const widestGeekReadout = (id: ParamId): readonly GeekReadout[] => GEEK_CONTROLS[id]?.widest ?? [];

/**
 * Each Destination's reach at full Depth, by its law: "Pitch ±1 st", "Pulse Width ±40 %"; those whose reach is their
 * whole range (FM, the Resonance) and Volume, which dips, are said apart.
 */
const REACH = LFO_DESTINATIONS.flatMap(({ id, label }) => {
  if (id === 'volume') return [];
  const { unit, perDepth: reach }: LfoLaw = LFO_LAWS[id];
  if (unit === '%' && reach === 1) return [];
  return [`${label} ±${unit === '%' ? Math.round(reach * 100) : reach} ${unit}`];
}).join(', ');

/** How far a curve has gone after `n` time constants, in %: "95 %", "98 %", "99.75 %". */
const wayAfter = (n: number) => {
  const way = (1 - Math.exp(-n)) * 100;
  return `${Number(way.toFixed(way > 99 ? 2 : 0))} %`;
};

/** A Spectrum's Harmonics (issue 170), in each Spectrum's tip under the hood. */
const SPECTRUM: Formula = {
  formula: 'fₙ = n × f₀',
  where: 'n: the Harmonic’s number, which the hover readout adds when on one; f₀: the fundamental, the 1st.',
};

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
  // Issue 256: the lowest pair of Harmonics that nearly coincide, as detuneBeatsHz.
  osc2Detune: {
    formula: 'Δf = |p f₁ − q f₂|',
    where: `Δf: the beats per second; f₁, f₂: Osc 1’s and Osc 2’s frequencies on the Note played (A4 until one is), with their Octaves, Semitone and Detune; p, q: the lowest pair of their Harmonics within a quarter-tone of each other, Osc 1’s pth and Osc 2’s qth, so f₂ / f₁ is near p / q: 1/1 in unison, 1/2 an octave down, 3/2 a fifth up. Up to the ${ordinal(BEATING_HARMONICS)} Harmonics the Waveforms have; past ${BEATS_HEARD_BELOW_HZ} a second, beats blur into roughness, and with no pair, none: there it reads no beats.`,
  },
  // Issue 169: the LFOs and Key Track.
  lfoRate: { formula: 'T = 1 / f', where: 'T: the period, one cycle, in seconds; f: the Rate in Hz.' },
  lfoNote: {
    formula: 'T = beats × 60 / BPM',
    where: 'T: the period, one cycle, in seconds, so the Hz is 1 / T = BPM ÷ 60 ÷ beats; BPM: the tempo, beats a minute (÷ 60, beats a second); beats: the note value’s length (1/4 is one, D half as long again, T two thirds).',
  },
  lfoDepth: {
    formula: 'swing = Depth × its reach',
    where: `each way, in the Destination’s unit. The reach at full Depth: ${REACH}; FM and Resonance their whole range. Volume dips from the top: 20 log₁₀(1 − Depth) dB. Two LFOs on one share its room, never past its ends.`,
  },
  keyTrack: {
    formula: `fc = Cutoff × 2^(k·(n − ${KEY_TRACK_CENTRE})/12)`,
    where: `fc: the Cutoff at the Note n played (A4, ${A4_MIDI}, until one is; C4 is ${KEY_TRACK_CENTRE}); k: Key Track, 1 at 100 %. The Filter Envelope, the LFOs and Velocity move it from there.`,
  },
  // Issue 168: Glide's slide, with no live number (issue 133, decision 10).
  glide: {
    formula: 'f = f₂ + (f₁ − f₂)·e^(−t/τ)',
    where: `τ = Glide ÷ ${GLIDE_SHARPNESS}. f: the pitch in Hz, sliding from f₁, where it was, to f₂, the Note played; t: the time since that Note. 63 % of the way in each τ, ${wayAfter(GLIDE_SHARPNESS)} by the Glide time. Off, the pitch jumps; with one Voice only.`,
  },
  // Issue 170: the Viewers.
  scope: {
    formula: 'T = 1 / f₀',
    where: 'T: one cycle, the period, written top left; f₀: the fundamental the Scope holds still: the Note played at Osc 1’s Octave, the Sub’s pitch with the Sub up (A4 until a Note is played).',
  },
  spectrum: SPECTRUM,
  oscillatorSpectrum: {
    formula: SPECTRUM.formula,
    where: `${SPECTRUM.where} With the Noise up, its slope top right: white, P(f) flat; pink, P(f) ∝ 1/f, −3 dB per octave.`,
  },
  noise: {
    formula: 'white: P(f) flat;  pink: P(f) ∝ 1/f, −3 dB per octave',
    where: 'P(f): the power at each frequency. Pink is white through Paul Kellet’s filter, −10 dB a decade, as loud overall.',
  },
} satisfies Record<string, Formula>;

/**
 * How many note values fit in a beat, as the conversion writes it (issue 137): "× 2" for an 1/8, "÷ 4" for a bar,
 * "× 2/3" for a dotted 1/4, "× 3/2" for a triplet one.
 */
function perBeatText(beats: number): string {
  const perBeat = 1 / beats;
  let denominator = 1;
  while (Math.abs(perBeat * denominator - Math.round(perBeat * denominator)) > 1e-9) denominator++;
  const numerator = Math.round(perBeat * denominator);
  if (denominator === 1) return `× ${numerator}`;
  return numerator === 1 ? `÷ ${denominator}` : `× ${numerator}/${denominator}`;
}

/**
 * A synced Rate's conversion to Hz at the tempo, with the live numbers (issue 137): the beats a second, BPM ÷ 60, times
 * the note values in a beat: "1/8 at 120 BPM: 120 ÷ 60 × 2 = 4 Hz".
 */
export function syncedRateConversion(index: number, bpm: number): string {
  // Worked out to three figures, as a calculation is, where the readout rounds to the Rate's ("0.0625 Hz", "0.06 Hz").
  const hz = `${Number(noteHz(index, bpm).toPrecision(3))} Hz`;
  return `${NOTE_VALUES[index].name} at ${bpm} BPM: ${bpm} ÷ 60 ${perBeatText(NOTE_VALUES[index].beats)} = ${hz}`;
}

/** A synced Rate's formula under the hood, worked out at the tempo: its conversion, then its period (issue 202). */
export function syncedRateUnderTheHood(index: number, bpm: number): Formula {
  const { formula, where } = UNDER_THE_HOOD.lfoNote;
  return { formula, where: `${syncedRateConversion(index, bpm)}, one cycle every ${periodText(1 / noteHz(index, bpm))}. ${where}` };
}

// Issue 170: the Viewers' numbers (issue 133, decision 11).

/** A time in ms to three figures: "2.27 ms", "36.4 ms", "582 ms", "0.239 ms". */
const msText = (ms: number) => `${ms < 1 ? ms.toFixed(3) : ms < 10 ? ms.toFixed(2) : ms < 100 ? ms.toFixed(1) : Math.round(ms)} ms`;

/**
 * What each Scope writes in its corner: the period and frequency of `fundamental` (the Note played, at Osc 1's Octave,
 * the Sub's pitch with the Sub up), held still through a vibrato, where Cycle Lock follows the pitch as played (issue
 * 180): "2.27 ms · 440 Hz"; before any Note, A4's, said.
 */
export function scopeReadout(fundamental: number, note: GeekNote): string {
  const hz = Number(fundamental.toFixed(fundamental < 10 ? 2 : 1));
  return `${msText(1000 / fundamental)} · ${hz} Hz${note === null ? ` ${BEFORE_ANY_NOTE}` : ''}`;
}

/** How close to n f₀ a peak must be to be on the nth Harmonic: a twentieth of the spacing, or half an FFT bin. */
const ON_A_HARMONIC = 0.05;
/** Harmonics closer than this many FFT bins are not told apart on the Spectrum: none is numbered. */
const PARTED_BY_BINS = 4;

/**
 * The number of the Harmonic of `fundamental` a Spectrum's peak at `frequency` is on (issue 170): n where it is n f₀,
 * within what the Spectrum's bins of `binHz` can tell; undefined between two, or where they are too close to part.
 */
export function harmonicNumber(frequency: number, fundamental: number, binHz: number): number | undefined {
  if (!(fundamental >= PARTED_BY_BINS * binHz)) return undefined;
  const n = Math.round(frequency / fundamental);
  if (n < 1) return undefined;
  return Math.abs(frequency - n * fundamental) <= Math.max(ON_A_HARMONIC * fundamental, binHz / 2) ? n : undefined;
}

/** Each Noise Colour's slope, in dB per octave: white is flat, pink falls as 1/f (UNDER_THE_HOOD.noise). */
const NOISE_SLOPE_DB: Record<NoiseColour, number> = { white: 0, pink: -3 };

/** What the Oscillator Spectrum writes in its corner while the Noise is up (issue 170): "pink: −3 dB/oct". */
export function noiseSlope(patch: Patch): string | undefined {
  if (!(patch.mixNoise > 0)) return undefined;
  const slope = NOISE_SLOPE_DB[patch.noiseColour];
  return `${patch.noiseColour}: ${slope < 0 ? '−' : ''}${Math.abs(slope)} dB/oct`;
}

/** Each Envelope fader's stage. */
const STAGE_OF: Partial<Record<ParamId, EnvelopeStage>> = {
  ampAttack: 'attack', filterAttack: 'attack', ampDecay: 'decay', filterDecay: 'decay', ampRelease: 'release', filterRelease: 'release',
};
/** Each stage's curve, the level x as a share of the peak, t the time since the stage began; and its letters. */
const STAGE_CURVES: Record<EnvelopeStage, Formula> = {
  attack: { formula: 'x = 1 − (1 − x₀)·e^(−t/τ)', where: 'x₀ the level the key found (0 from silence), rising towards the peak. A curve, not a straight rise: it' },
  decay: { formula: 'x = S + (x₀ − S)·e^(−t/τ)', where: 'x₀ the level the Attack reached, falling towards S, the Sustain level. It' },
  release: { formula: 'x = x₀·e^(−t/τ)', where: 'x₀ the level when the key came up, falling towards silence. It' },
};

/**
 * The formulas under the hood worked out at a control's setting (issue 168), where the tip shows a live number: each
 * Envelope stage's curve and its time constant τ as the engine sets it, a free Rate's period (issue 202); undefined for
 * the others.
 */
export function underTheHoodAt(id: ParamId, value: number): Formula | undefined {
  if (rateOf(id)?.sync === 'off') {
    const { formula, where } = UNDER_THE_HOOD.lfoRate;
    return { formula, where: `T = 1 / ${preciseFrequencyText(value)} = ${periodText(1 / value)} now. ${where}` };
  }
  const stage = STAGE_OF[id];
  if (!stage) return undefined;
  const { label } = PARAMS[id];
  const sharpness = STAGE_SHARPNESS[stage];
  const { formula, where } = STAGE_CURVES[stage];
  return {
    formula,
    where: `τ = ${label} ÷ ${sharpness} = ${secondsText(stageTimeConstant(stage, value))} now. x: the level, as a share of the peak; t: the time since the ${label} began; ${where} goes 63 % of what is left of the way in each τ, ${wayAfter(sharpness)} by the ${label} time.`,
  };
}
