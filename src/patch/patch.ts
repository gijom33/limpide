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
  | 'osc2Octave'
  | 'osc2Semitone'
  | 'osc2Detune'
  | 'osc2PulseWidth'
  | 'mixOsc1'
  | 'mixOsc2'
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
  | 'ampRelease';

export type FilterMode = 'lowpass' | 'highpass' | 'bandpass' | 'notch';
export type FilterSlope = 12 | 24;
/** Where an LFO goes: the Oscillators' pitch, Osc 2's alone (an octave, or its Detune), the Pulse Width, the Filter. */
export type LfoDestination = 'pitch' | 'osc2Pitch' | 'detune' | 'pulseWidth' | 'cutoff' | 'resonance';
/** How many Notes can sound at once. 1 is monophonic (last-note priority, Glide); more play chords (ADR-0007). */
export type Voices = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Patch = Record<ParamId, number> & {
  waveform: Waveform;
  osc2Waveform: Waveform;
  filterMode: FilterMode;
  filterSlope: FilterSlope;
  lfoWaveform: LfoWaveform;
  lfoDestination: LfoDestination;
  lfo2Waveform: LfoWaveform;
  lfo2Destination: LfoDestination;
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
  osc2Octave: { id: 'osc2Octave', label: 'Octave', unit: 'oct', min: -2, max: 2, taper: 'linear', default: 0, step: 1, control: 'set' },
  osc2Semitone: { id: 'osc2Semitone', label: 'Semitone', unit: 'st', min: -12, max: 12, taper: 'linear', default: 0, step: 1, control: 'set' },
  osc2Detune: { id: 'osc2Detune', label: 'Detune', unit: 'cents', min: -50, max: 50, taper: 'linear', default: 0, control: 'play' },
  osc2PulseWidth: { id: 'osc2PulseWidth', label: 'Pulse Width', unit: '%', min: 0.05, max: 0.95, taper: 'linear', default: 0.25, control: 'set' },
  mixOsc1: level('mixOsc1', 'Osc 1', 1, 'fader'),
  mixOsc2: level('mixOsc2', 'Osc 2', 0, 'fader'),
  mixNoise: level('mixNoise', 'Noise', 0, 'fader'),
  mixSub: level('mixSub', 'Sub', 0, 'fader'),
  lfoRate: { id: 'lfoRate', label: 'Rate', unit: 'Hz', min: 0.05, max: 20, taper: 'log', default: 2, control: 'play' },
  lfoAmount: level('lfoAmount', 'Depth', 0, 'play'),
  lfo2Rate: { id: 'lfo2Rate', label: 'Rate', unit: 'Hz', min: 0.05, max: 20, taper: 'log', default: 2, control: 'play' },
  lfo2Amount: level('lfo2Amount', 'Depth', 0, 'play'),
  glide: time('glide', 'Glide', GLIDE_OFF, 'set'),
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
};

export function defaultPatch(): Patch {
  const params = Object.fromEntries(Object.values(PARAMS).map((d) => [d.id, d.default])) as Record<ParamId, number>;
  return {
    ...params,
    waveform: 'saw',
    osc2Waveform: 'saw',
    filterMode: 'lowpass',
    filterSlope: 12,
    lfoWaveform: 'sine',
    lfoDestination: 'cutoff',
    // LFO 2 starts silent, so a Patch from before it sounds as it did; on Pitch, for vibrato beside LFO 1's sweep.
    lfo2Waveform: 'sine',
    lfo2Destination: 'pitch',
    voices: 1,
  };
}

export function setFilter(patch: Patch, { mode, slope }: { mode?: FilterMode; slope?: FilterSlope }): Patch {
  return { ...patch, filterMode: mode ?? patch.filterMode, filterSlope: slope ?? patch.filterSlope };
}

/** The allowed values of every choice in a Patch, in the order they are offered (defaultPatch gives the defaults). */
export const CHOICES = {
  waveform: ['saw', 'sine', 'triangle', 'square', 'pulse'],
  osc2Waveform: ['saw', 'sine', 'triangle', 'square', 'pulse'],
  filterMode: ['lowpass', 'highpass', 'bandpass', 'notch'],
  filterSlope: [12, 24],
  lfoWaveform: ['sine', 'triangle', 'square', 'saw', 'sawDown'],
  lfoDestination: ['pitch', 'osc2Pitch', 'detune', 'pulseWidth', 'cutoff', 'resonance'],
  lfo2Waveform: ['sine', 'triangle', 'square', 'saw', 'sawDown'],
  lfo2Destination: ['pitch', 'osc2Pitch', 'detune', 'pulseWidth', 'cutoff', 'resonance'],
  voices: [1, 2, 3, 4, 5, 6, 7, 8],
} as const satisfies { [K in Exclude<keyof Patch, ParamId>]: readonly Patch[K][] };

/** A Patch setting picked from a list (a Waveform, the Filter Mode…), rather than turned like a Parameter. */
export type ChoiceId = keyof typeof CHOICES;

/** Which LFO: 1 or 2. */
export type LfoNumber = 1 | 2;

/** The Patch's names for one LFO's settings. */
export const LFO_KEYS = {
  1: { rate: 'lfoRate', amount: 'lfoAmount', waveform: 'lfoWaveform', destination: 'lfoDestination' },
  2: { rate: 'lfo2Rate', amount: 'lfo2Amount', waveform: 'lfo2Waveform', destination: 'lfo2Destination' },
} as const;

/** One LFO's settings. */
export interface Lfo {
  rate: number;
  amount: number;
  waveform: LfoWaveform;
  destination: LfoDestination;
}

/** Both LFOs' settings, LFO 1 first. */
export const lfos = (patch: Patch): [Lfo, Lfo] =>
  ([1, 2] as const).map((n) => {
    const k = LFO_KEYS[n];
    return { rate: patch[k.rate], amount: patch[k.amount], waveform: patch[k.waveform], destination: patch[k.destination] };
  }) as [Lfo, Lfo];

export function setLfo(patch: Patch, { waveform, destination }: { waveform?: LfoWaveform; destination?: LfoDestination }, lfo: LfoNumber = 1): Patch {
  const k = LFO_KEYS[lfo];
  return { ...patch, [k.waveform]: waveform ?? patch[k.waveform], [k.destination]: destination ?? patch[k.destination] };
}

export function setWaveform(patch: Patch, waveform: Waveform, oscillator: 'osc1' | 'osc2' = 'osc1'): Patch {
  return oscillator === 'osc1' ? { ...patch, waveform } : { ...patch, osc2Waveform: waveform };
}

export function setParam(patch: Patch, id: ParamId, value: number): Patch {
  const { min, max, step } = PARAMS[id];
  const snapped = step ? Math.round(value / step) * step : value;
  return { ...patch, [id]: Math.min(max, Math.max(min, snapped)) };
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
