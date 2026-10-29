import type { LfoWaveform } from '../modulation/lfo';
import type { Waveform } from '../music/harmonics';
import type { Range } from './taper';

export type Unit = 'Hz' | 's' | '%' | 'oct' | 'st' | 'cents';

/** How a Parameter is turned (ADR-0008): a big knob if worth turning while playing, a small one if set and
 *  forgotten, a fader for levels and envelope stages. */
export type Control = 'play' | 'set' | 'fader';

export interface ParamDef extends Range {
  id: ParamId;
  label: string;
  unit: Unit;
  default: number;
  control: Control;
  /** Values snap to multiples of this (e.g. whole octaves). */
  step?: number;
}

export type ParamId =
  | 'pulseWidth'
  | 'osc1Octave'
  | 'osc2Octave'
  | 'osc2Semitone'
  | 'osc2Detune'
  | 'osc2PulseWidth'
  | 'crossMod'
  | 'osc2EnvAmount'
  | 'mixOsc1'
  | 'mixOsc2'
  | 'mixRing'
  | 'mixNoise'
  | 'mixSub'
  | 'lfoRate'
  | 'lfoAmount'
  | 'lfo2Rate'
  | 'lfo2Amount'
  | 'glide'
  | 'velocityCutoff'
  | 'keyTrack'
  | 'cutoff'
  | 'resonance'
  | 'filterEnvAmount'
  | 'filterAttack'
  | 'filterDecay'
  | 'filterSustain'
  | 'filterRelease'
  | 'ampAttack'
  | 'ampDecay'
  | 'ampSustain'
  | 'ampRelease'
  | 'volume';

export type FilterMode = 'lowpass' | 'highpass' | 'bandpass' | 'notch';
export type FilterSlope = 12 | 24;
/** The sound's three stages, in the signal's order, with their sections' names; each has its colour. */
export const STAGES = [
  { id: 'osc', name: 'Oscillators' },
  { id: 'filter', name: 'Filter' },
  { id: 'amp', name: 'Amp' },
] as const;
export type StageId = (typeof STAGES)[number]['id'];

/**
 * Where an LFO goes, in the order the arrows step and the menu lists them: the Oscillators' pitch, Osc 2's alone (an
 * octave, or its Detune), the Pulse Width, the Filter, the Volume. Each with its name, its stage (whose colour it takes,
 * in the menu and on the Timeline) and the knob it moves (Pitch has none: it moves the Note). The one list the Patch's
 * type and choices, the Tutorials, the picker and the Timeline read (issue 68).
 */
export const LFO_DESTINATIONS = [
  { id: 'pitch', label: 'Pitch', stage: 'osc', param: null },
  { id: 'osc2Pitch', label: 'Osc 2 Pitch', stage: 'osc', param: 'osc2Semitone' },
  { id: 'detune', label: 'Detune', stage: 'osc', param: 'osc2Detune' },
  { id: 'pulseWidth', label: 'Pulse Width', stage: 'osc', param: 'pulseWidth' },
  { id: 'cutoff', label: 'Cutoff', stage: 'filter', param: 'cutoff' },
  { id: 'resonance', label: 'Resonance', stage: 'filter', param: 'resonance' },
  { id: 'volume', label: 'Volume', stage: 'amp', param: 'volume' },
] as const satisfies readonly { id: string; label: string; stage: StageId; param: ParamId | null }[];
export type LfoDestination = (typeof LFO_DESTINATIONS)[number]['id'];
const DESTINATION_IDS = LFO_DESTINATIONS.map((d) => d.id);
/** Whether an LFO runs freely or starts its cycle again at every Note (retrigger, or key sync). */
export type LfoRetrigger = 'free' | 'note';
/** How far the Sub sits below Osc 1, in octaves, and its Waveform (issue 91). */
export type SubOctave = -1 | -2;
export type SubWaveform = 'square' | 'sine';
/** White Noise has equal energy at every frequency, pink equal energy per octave (issue 92). */
export type NoiseColour = 'white' | 'pink';
/** How many Notes can sound at once. 1 is monophonic (last-note priority, Glide); more play chords (ADR-0007). */
export type Voices = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Patch = Record<ParamId, number> & {
  waveform: Waveform;
  osc2Waveform: Waveform;
  subOctave: SubOctave;
  subWaveform: SubWaveform;
  noiseColour: NoiseColour;
  filterMode: FilterMode;
  filterSlope: FilterSlope;
  lfoWaveform: LfoWaveform;
  lfoDestination: LfoDestination;
  lfo2Waveform: LfoWaveform;
  lfo2Destination: LfoDestination;
  lfoRetrigger: LfoRetrigger;
  lfo2Retrigger: LfoRetrigger;
  voices: Voices;
};

/** Glide at its minimum is off: Notes change pitch at once. */
export const GLIDE_OFF = 0.001;

const level = (id: ParamId, label: string, dflt: number, control: Control): ParamDef => ({
  id, label, unit: '%', min: 0, max: 1, taper: 'linear', default: dflt, control,
});

const time = (id: ParamId, label: string, dflt: number, control: Control): ParamDef => ({
  id, label, unit: 's', min: 0.001, max: 10, taper: 'log', default: dflt, control,
});

export const PARAMS: Record<ParamId, ParamDef> = {
  pulseWidth: { id: 'pulseWidth', label: 'Pulse Width', unit: '%', min: 0.05, max: 0.95, taper: 'linear', default: 0.25, control: 'set' },
  // Osc 1's range (issue 90): the Sub follows it; Osc 2's offsets count from the Note played.
  osc1Octave: { id: 'osc1Octave', label: 'Octave', unit: 'oct', min: -2, max: 2, taper: 'linear', default: 0, step: 1, control: 'set' },
  osc2Octave: { id: 'osc2Octave', label: 'Octave', unit: 'oct', min: -2, max: 2, taper: 'linear', default: 0, step: 1, control: 'set' },
  osc2Semitone: { id: 'osc2Semitone', label: 'Semitone', unit: 'st', min: -12, max: 12, taper: 'linear', default: 0, step: 1, control: 'set' },
  osc2Detune: { id: 'osc2Detune', label: 'Detune', unit: 'cents', min: -50, max: 50, taper: 'linear', default: 0, control: 'play' },
  osc2PulseWidth: { id: 'osc2PulseWidth', label: 'Pulse Width', unit: '%', min: 0.05, max: 0.95, taper: 'linear', default: 0.25, control: 'set' },
  // How far Osc 2 swings Osc 1's frequency (issue 89): at full, four times Osc 2's own frequency.
  crossMod: level('crossMod', 'Cross Mod', 0, 'play'),
  // How far the Filter Envelope moves Osc 2's pitch at its peak (issue 93), as a Prophet's Poly Mod does.
  osc2EnvAmount: { id: 'osc2EnvAmount', label: 'Env Amount', unit: 'st', min: -24, max: 24, taper: 'linear', default: 0, control: 'set' },
  mixOsc1: level('mixOsc1', 'Osc 1', 1, 'fader'),
  mixOsc2: level('mixOsc2', 'Osc 2', 0, 'fader'),
  // Osc 1 times Osc 2 (issue 88), whatever their own levels.
  mixRing: level('mixRing', 'Ring', 0, 'fader'),
  mixNoise: level('mixNoise', 'Noise', 0, 'fader'),
  mixSub: level('mixSub', 'Sub', 0, 'fader'),
  lfoRate: { id: 'lfoRate', label: 'Rate', unit: 'Hz', min: 0.05, max: 20, taper: 'log', default: 2, control: 'play' },
  lfoAmount: level('lfoAmount', 'Depth', 0, 'play'),
  lfo2Rate: { id: 'lfo2Rate', label: 'Rate', unit: 'Hz', min: 0.05, max: 20, taper: 'log', default: 2, control: 'play' },
  lfo2Amount: level('lfo2Amount', 'Depth', 0, 'play'),
  // Up to 2 s, slowly at first: a fifth of the travel is about 80 ms, a slide you hear (on a log taper to 10 s it was
  // 6 ms, review 2).
  glide: { id: 'glide', label: 'Glide', unit: 's', min: GLIDE_OFF, max: 2, taper: 'square', default: GLIDE_OFF, control: 'set' },
  velocityCutoff: level('velocityCutoff', 'Velocity', 0, 'set'),
  keyTrack: level('keyTrack', 'Key Track', 0, 'set'),
  cutoff: { id: 'cutoff', label: 'Cutoff', unit: 'Hz', min: 20, max: 20000, taper: 'log', default: 2000, control: 'play' },
  resonance: { id: 'resonance', label: 'Resonance', unit: '%', min: 0, max: 1, taper: 'linear', default: 0.2, control: 'play' },
  filterEnvAmount: { id: 'filterEnvAmount', label: 'Amount', unit: 'oct', min: -5, max: 5, taper: 'linear', default: 0, control: 'play' },
  filterAttack: time('filterAttack', 'Attack', 0.005, 'fader'),
  filterDecay: time('filterDecay', 'Decay', 0.25, 'fader'),
  filterSustain: { id: 'filterSustain', label: 'Sustain', unit: '%', min: 0, max: 1, taper: 'linear', default: 0.3, control: 'fader' },
  filterRelease: time('filterRelease', 'Release', 0.4, 'fader'),
  ampAttack: time('ampAttack', 'Attack', 0.01, 'fader'),
  ampDecay: time('ampDecay', 'Decay', 0.3, 'fader'),
  ampSustain: { id: 'ampSustain', label: 'Sustain', unit: '%', min: 0, max: 1, taper: 'linear', default: 0.7, control: 'fader' },
  ampRelease: time('ampRelease', 'Release', 0.4, 'fader'),
  // The Amp's level, after its Envelope (issue 62): full by default, so no Preset changes; an LFO on Volume dips it.
  volume: level('volume', 'Volume', 1, 'play'),
};

export function defaultPatch(): Patch {
  const params = Object.fromEntries(Object.values(PARAMS).map((d) => [d.id, d.default])) as Record<ParamId, number>;
  return {
    ...params,
    waveform: 'saw',
    osc2Waveform: 'saw',
    // The Sub a square an octave down, as it always was.
    subOctave: -1,
    subWaveform: 'square',
    noiseColour: 'white',
    filterMode: 'lowpass',
    filterSlope: 12,
    lfoWaveform: 'sine',
    lfoDestination: 'cutoff',
    // LFO 2 starts silent, so a Patch from before it sounds as it did; on Pitch, for vibrato beside LFO 1's sweep.
    lfo2Waveform: 'sine',
    lfo2Destination: 'pitch',
    // Both run freely, so a Patch from before retrigger sounds as it did.
    lfoRetrigger: 'free',
    lfo2Retrigger: 'free',
    voices: 1,
  };
}

/** Whether Osc 2 is heard: mixed in, through Ring (issue 88), or moving Osc 1 (issue 89). */
export const osc2Heard = (patch: Patch) => patch.mixOsc2 > 0 || patch.mixRing > 0 || patch.crossMod > 0;

export function setFilter(patch: Patch, { mode, slope }: { mode?: FilterMode; slope?: FilterSlope }): Patch {
  return { ...patch, filterMode: mode ?? patch.filterMode, filterSlope: slope ?? patch.filterSlope };
}

/** The allowed values of every choice in a Patch, in the order they are offered (defaultPatch gives the defaults). */
export const CHOICES = {
  waveform: ['saw', 'sine', 'triangle', 'square', 'pulse'],
  osc2Waveform: ['saw', 'sine', 'triangle', 'square', 'pulse'],
  subOctave: [-1, -2],
  subWaveform: ['square', 'sine'],
  noiseColour: ['white', 'pink'],
  filterMode: ['lowpass', 'highpass', 'bandpass', 'notch'],
  filterSlope: [12, 24],
  lfoWaveform: ['sine', 'triangle', 'square', 'saw', 'sawDown'],
  lfoDestination: DESTINATION_IDS,
  lfo2Waveform: ['sine', 'triangle', 'square', 'saw', 'sawDown'],
  lfo2Destination: DESTINATION_IDS,
  lfoRetrigger: ['free', 'note'],
  lfo2Retrigger: ['free', 'note'],
  voices: [1, 2, 3, 4, 5, 6, 7, 8],
} as const satisfies { [K in Exclude<keyof Patch, ParamId>]: readonly Patch[K][] };

/** A Patch setting picked from a list (a Waveform, the Filter Mode…), rather than turned like a Parameter. */
export type ChoiceId = keyof typeof CHOICES;

/** Which LFO: 1 or 2. */
export type LfoNumber = 1 | 2;

/** The Patch's names for one LFO's settings. */
export const LFO_KEYS = {
  1: { rate: 'lfoRate', amount: 'lfoAmount', waveform: 'lfoWaveform', destination: 'lfoDestination', retrigger: 'lfoRetrigger' },
  2: { rate: 'lfo2Rate', amount: 'lfo2Amount', waveform: 'lfo2Waveform', destination: 'lfo2Destination', retrigger: 'lfo2Retrigger' },
} as const;

/** One LFO's settings. */
export interface Lfo {
  rate: number;
  amount: number;
  waveform: LfoWaveform;
  destination: LfoDestination;
  retrigger: LfoRetrigger;
}

/** Both LFOs' settings, LFO 1 first. */
export const lfos = (patch: Patch): [Lfo, Lfo] =>
  ([1, 2] as const).map((n) => {
    const k = LFO_KEYS[n];
    return { rate: patch[k.rate], amount: patch[k.amount], waveform: patch[k.waveform], destination: patch[k.destination], retrigger: patch[k.retrigger] };
  }) as [Lfo, Lfo];

export function setLfo(
  patch: Patch,
  { waveform, destination, retrigger }: { waveform?: LfoWaveform; destination?: LfoDestination; retrigger?: LfoRetrigger },
  lfo: LfoNumber = 1,
): Patch {
  const k = LFO_KEYS[lfo];
  return {
    ...patch,
    [k.waveform]: waveform ?? patch[k.waveform],
    [k.destination]: destination ?? patch[k.destination],
    [k.retrigger]: retrigger ?? patch[k.retrigger],
  };
}

export function setWaveform(patch: Patch, waveform: Waveform, oscillator: 'osc1' | 'osc2' = 'osc1'): Patch {
  return oscillator === 'osc1' ? { ...patch, waveform } : { ...patch, osc2Waveform: waveform };
}

export function setParam(patch: Patch, id: ParamId, value: number): Patch {
  const { min, max, step } = PARAMS[id];
  const snapped = step ? Math.round(value / step) * step : value;
  return { ...patch, [id]: Math.min(max, Math.max(min, snapped)) };
}

/**
 * A Parameter's full name, where its label alone could be mistaken: "Attack" is the Filter Envelope's or the Amp's,
 * "Rate" either LFO's. Screen readers read it (issue 51); the visible label stays short, and is part of it.
 */
export function paramName(id: ParamId): string {
  const { label } = PARAMS[id];
  if (id === 'filterEnvAmount') return 'Filter Envelope Amount';
  if (/^(filter|amp)(Attack|Decay|Sustain|Release)$/.test(id)) return `${id.startsWith('amp') ? 'Amp' : 'Filter'} ${label}`;
  if (id.startsWith('lfo2')) return `LFO 2 ${label}`;
  if (id.startsWith('lfo')) return `LFO 1 ${label}`;
  if (id.startsWith('osc1')) return `Osc 1 ${label}`;
  if (id.startsWith('osc2')) return `Osc 2 ${label}`;
  return label;
}

/** A Parameter value in real units, e.g. "2.50 kHz", "12.3 ms", "70 %". */
export function formatParam(id: ParamId, value: number): string {
  switch (PARAMS[id].unit) {
    case 'Hz':
      if (value >= 1000) return `${(value / 1000).toFixed(2)} kHz`;
      return value < 10 ? `${value.toFixed(2)} Hz` : `${Math.round(value)} Hz`;
    case 's':
      if (id === 'glide' && value <= GLIDE_OFF * 1.001) return 'Off';
      return value >= 1 ? `${value.toFixed(2)} s` : `${(value * 1000).toPrecision(3)} ms`;
    case '%':
      return `${Math.round(value * 100)} %`;
    case 'oct':
      return signed(value, PARAMS[id].step ? 0 : 1, 'oct');
    case 'st':
      return signed(value, 0, 'st');
    case 'cents':
      return signed(value, 0, '¢');
  }
}

/** "+2 oct", "−1.3 oct", "0 ¢": signed with a true minus, no sign on zero. */
function signed(value: number, decimals: number, unit: string): string {
  const shown = Number(Math.abs(value).toFixed(decimals));
  if (shown === 0) return `0 ${unit}`;
  return `${value > 0 ? '+' : '−'}${shown.toFixed(decimals)} ${unit}`;
}
