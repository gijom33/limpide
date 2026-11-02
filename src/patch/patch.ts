import type { LfoWaveform } from '../modulation/lfo';
import type { Waveform } from '../music/harmonics';
import { NOTE_VALUES, noteHz, noteIndex } from '../music/tempo';
import { decibelGrid, type Grid, linearGrid, pitchGrid, seriesGrid, steppedGrid } from './grid';
import type { Range } from './taper';

export type Unit = 'Hz' | 's' | '%' | 'oct' | 'st' | 'cents' | 'note';

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
  /** The round values a press, a wheel's notch or an encoder's tick lands on, in the control's own unit (issue 160). */
  grid: Grid;
  /**
   * The Parameter whose knob turns this one, where it has none of its own: an LFO's note value is turned by its Rate
   * knob while Sync is on (issue 112), so MIDI Learn and Quick Setup know the Rate alone.
   */
  knob?: ParamId;
}

export type ParamId =
  | 'pulseWidth'
  | 'osc1Octave'
  | 'osc2Octave'
  | 'osc2Semitone'
  | 'osc2Detune'
  | 'osc2PulseWidth'
  // FM's Parameter, named for cross-modulation: saved Patches and Share links carry the name, so it stays.
  | 'crossMod'
  | 'osc2EnvAmount'
  | 'mixOsc1'
  | 'mixOsc2'
  | 'mixRing'
  | 'mixNoise'
  | 'mixSub'
  | 'lfoRate'
  | 'lfoAmount'
  | 'lfoNote'
  | 'lfo2Rate'
  | 'lfo2Amount'
  | 'lfo2Note'
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
 * octave, or its Detune), the Pulse Width, FM (issue 97), the Filter, the Volume. Each with its name, its stage (whose colour it takes,
 * in the menu and on the Timeline) and the knob it moves (Pitch has none: it moves the Note). The one list the Patch's
 * type and choices, the Tutorials, the picker and the Timeline read (issue 68).
 */
export const LFO_DESTINATIONS = [
  { id: 'pitch', label: 'Pitch', stage: 'osc', param: null },
  { id: 'osc2Pitch', label: 'Osc 2 Pitch', stage: 'osc', param: 'osc2Semitone' },
  { id: 'detune', label: 'Detune', stage: 'osc', param: 'osc2Detune' },
  { id: 'pulseWidth', label: 'Pulse Width', stage: 'osc', param: 'pulseWidth' },
  { id: 'fm', label: 'FM', stage: 'osc', param: 'crossMod' },
  { id: 'cutoff', label: 'Cutoff', stage: 'filter', param: 'cutoff' },
  { id: 'resonance', label: 'Resonance', stage: 'filter', param: 'resonance' },
  { id: 'volume', label: 'Volume', stage: 'amp', param: 'volume' },
] as const satisfies readonly { id: string; label: string; stage: StageId; param: ParamId | null }[];
export type LfoDestination = (typeof LFO_DESTINATIONS)[number]['id'];
const DESTINATION_IDS = LFO_DESTINATIONS.map((d) => d.id);
/** Whether an LFO runs freely or starts its cycle again at every Note (retrigger, or key sync). */
export type LfoRetrigger = 'free' | 'note';
/** Whether an LFO's Rate is in Hz ('off') or a note value at the page's tempo, its cycle locked to the beat (issue 112). */
export type LfoSync = 'off' | 'on';
/** How far the Sub sits below Osc 1, in octaves, and its Waveform (issue 91). */
export type SubOctave = -1 | -2;
export type SubWaveform = 'square' | 'sine';
/** White Noise has equal energy at every frequency, pink equal energy per octave (issue 92). */
export type NoiseColour = 'white' | 'pink';
/**
 * With one Voice, whether a Note played over a key still held slides there without a new Attack: the Envelopes and
 * the retriggered LFOs carry on (issue 119). Off, or with every key up (Hold keeping the last Note or not), a Note
 * starts both Envelopes again.
 */
export type Legato = 'off' | 'on';
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
  lfoSync: LfoSync;
  lfo2Sync: LfoSync;
  voices: Voices;
  legato: Legato;
  /**
   * The octave the computer keyboard and the on-screen piano start in when the Patch is loaded (issue 125): 2 for a
   * bass, its first key C2. Absent, they start on C4. The octave buttons move them after, and write the octave here, so
   * a saved or shared Patch keeps the one the player last chose (issue 126).
   */
  keyboardOctave?: number;
};

/**
 * The Patch's fields that make its sound: all but the keyboard octave, which says where the keys start (issue 126).
 * What compares sounds (a Patch changed, a Tutorial's differences, the mascot's answers) and the choices go by them.
 */
export type SoundField = Exclude<keyof Patch, 'keyboardOctave'>;
export const soundFields = (patch: Patch) => (Object.keys(patch) as (keyof Patch)[]).filter((key): key is SoundField => key !== 'keyboardOctave');
/** Whether two Patches sound the same: every sound field equal, whatever order their fields were written in. */
export const sameSound = (a: Patch, b: Patch) => soundFields(a).length === soundFields(b).length && soundFields(a).every((key) => a[key] === b[key]);
/** Whether two Patches are the same, field for field, the keyboard octave too. */
export const samePatch = (a: Patch, b: Patch) => sameSound(a, b) && a.keyboardOctave === b.keyboardOctave;

/** The octaves the keyboard reaches: C0 to C7, by the octave buttons. */
export const KEYBOARD_OCTAVES = { lowest: 0, highest: 7 } as const;
/** Whether the keyboard can start in this octave: a whole one the octave buttons reach. */
export const isKeyboardOctave = (octave: unknown): octave is number =>
  Number.isInteger(octave) && (octave as number) >= KEYBOARD_OCTAVES.lowest && (octave as number) <= KEYBOARD_OCTAVES.highest;

/** Glide at its minimum is off: Notes change pitch at once. */
export const GLIDE_OFF = 0.001;

/** Every control shown in %: 1 % a press, Shift 0.1 %, Page 10 % (issue 160). */
const PERCENT = linearGrid(0.01, 0.001, 0.1, { unit: '1 %', fine: '0.1 %', coarse: '10 %' });
/** A frequency or a pitch in semitones: a semitone a press, Shift 10 cents, Page an octave. */
const SEMITONE_WORDS = { unit: 'a semitone', fine: '10 cents', coarse: 'an octave' };
/** The Envelopes' times and Glide: the round series, Page doubling or halving. */
const TIMES = seriesGrid({ unit: 'the next round time', fine: '1 %', coarse: 'double or half' });
/** The lowest dB step of a Mixer fader, about one MIDI step up its travel: one press below it is silence. */
const LOWEST_DB = -40;
/** An LFO's free Rate: the times' round series, in Hz. */
const RATES = seriesGrid({ unit: 'the next round rate', fine: '1 %', coarse: 'double or half' });
/** An Octave: a whole octave a press. */
const OCTAVES = steppedGrid(1, 1, { unit: 'an octave' });
/** The Mixer's faders, by their dB (issue 160). */
const MIXER = decibelGrid(LOWEST_DB, { unit: '0.5 dB', fine: '0.1 dB', coarse: '6 dB' });

const level = (id: ParamId, label: string, dflt: number, control: Control, grid = PERCENT): ParamDef => ({
  id, label, unit: '%', min: 0, max: 1, taper: 'linear', default: dflt, control, grid,
});

const time = (id: ParamId, label: string, dflt: number, control: Control): ParamDef => ({
  id, label, unit: 's', min: 0.001, max: 10, taper: 'log', default: dflt, control, grid: TIMES,
});

/**
 * An LFO's note value while Sync is on (issue 112): its place among `NOTE_VALUES`, slowest first, turned by the Rate
 * knob a step at a time. A quarter Note by default, the Rate's own 2 Hz at 120 BPM.
 */
const noteValue = (id: ParamId, knob: ParamId): ParamDef => ({
  id, label: 'Rate', unit: 'note', min: 0, max: NOTE_VALUES.length - 1, taper: 'linear', default: noteIndex('1/4'), step: 1, control: 'play', knob,
  grid: steppedGrid(1, 2, { unit: 'a note value', coarse: '2 note values' }),
});

/** FM at full: Osc 2 swings Osc 1's frequency by four times its own (a modulation index of 4, issue 89). */
export const FM_INDEX = 4;
/** FM's modulation index at an FM of `fm` (0 to 1, the knob's or an LFO's swing of it), worked out here alone. */
export const fmIndex = (fm: number) => FM_INDEX * fm;

export const PARAMS: Record<ParamId, ParamDef> = {
  pulseWidth: { id: 'pulseWidth', label: 'Pulse Width', unit: '%', min: 0.05, max: 0.95, taper: 'linear', default: 0.25, control: 'set', grid: PERCENT },
  // Osc 1's range (issue 90): the Sub follows it; Osc 2's offsets count from the Note played.
  osc1Octave: { id: 'osc1Octave', label: 'Octave', unit: 'oct', min: -2, max: 2, taper: 'linear', default: 0, step: 1, control: 'set', grid: OCTAVES },
  osc2Octave: { id: 'osc2Octave', label: 'Octave', unit: 'oct', min: -2, max: 2, taper: 'linear', default: 0, step: 1, control: 'set', grid: OCTAVES },
  osc2Semitone: {
    id: 'osc2Semitone', label: 'Semitone', unit: 'st', min: -12, max: 12, taper: 'linear', default: 0, step: 1, control: 'set',
    grid: steppedGrid(1, 2, { unit: 'a semitone', coarse: '2 semitones' }),
  },
  osc2Detune: {
    id: 'osc2Detune', label: 'Detune', unit: 'cents', min: -50, max: 50, taper: 'linear', default: 0, control: 'play',
    grid: linearGrid(1, 0.1, 10, { unit: '1 cent', fine: '0.1 cent', coarse: '10 cents' }),
  },
  osc2PulseWidth: { id: 'osc2PulseWidth', label: 'Pulse Width', unit: '%', min: 0.05, max: 0.95, taper: 'linear', default: 0.25, control: 'set', grid: PERCENT },
  // FM (issue 89): how far Osc 2 swings Osc 1's frequency, at full FM_INDEX times Osc 2's own frequency. Its id keeps
  // cross-modulation's name (see ParamId).
  crossMod: level('crossMod', 'FM', 0, 'set'),
  // How far the Filter Envelope moves Osc 2's pitch at its peak (issue 93), as a Prophet's Poly Mod does.
  osc2EnvAmount: {
    id: 'osc2EnvAmount', label: 'Env Amount', unit: 'st', min: -24, max: 24, taper: 'linear', default: 0, control: 'set',
    grid: linearGrid(1, 0.1, 12, SEMITONE_WORDS),
  },
  mixOsc1: level('mixOsc1', 'Osc 1', 1, 'fader', MIXER),
  mixOsc2: level('mixOsc2', 'Osc 2', 0, 'fader', MIXER),
  // Osc 1 times Osc 2 (issue 88), whatever their own levels.
  mixRing: level('mixRing', 'Ring', 0, 'fader', MIXER),
  mixNoise: level('mixNoise', 'Noise', 0, 'fader', MIXER),
  mixSub: level('mixSub', 'Sub', 0, 'fader', MIXER),
  lfoRate: { id: 'lfoRate', label: 'Rate', unit: 'Hz', min: 0.05, max: 20, taper: 'log', default: 2, control: 'play', grid: RATES },
  lfoAmount: level('lfoAmount', 'Depth', 0, 'play'),
  lfoNote: noteValue('lfoNote', 'lfoRate'),
  lfo2Rate: { id: 'lfo2Rate', label: 'Rate', unit: 'Hz', min: 0.05, max: 20, taper: 'log', default: 2, control: 'play', grid: RATES },
  lfo2Amount: level('lfo2Amount', 'Depth', 0, 'play'),
  lfo2Note: noteValue('lfo2Note', 'lfo2Rate'),
  // Up to 2 s, slowly at first: a fifth of the travel is about 80 ms, a slide you hear (on a log taper to 10 s it was
  // 6 ms, review 2).
  glide: { id: 'glide', label: 'Glide', unit: 's', min: GLIDE_OFF, max: 2, taper: 'square', default: GLIDE_OFF, control: 'set', grid: TIMES },
  velocityCutoff: level('velocityCutoff', 'Velocity', 0, 'set'),
  keyTrack: level('keyTrack', 'Key Track', 0, 'set'),
  cutoff: { id: 'cutoff', label: 'Cutoff', unit: 'Hz', min: 20, max: 20000, taper: 'log', default: 2000, control: 'play', grid: pitchGrid(SEMITONE_WORDS) },
  resonance: { id: 'resonance', label: 'Resonance', unit: '%', min: 0, max: 1, taper: 'linear', default: 0.2, control: 'play', grid: PERCENT },
  filterEnvAmount: {
    id: 'filterEnvAmount', label: 'Amount', unit: 'oct', min: -5, max: 5, taper: 'linear', default: 0, control: 'play',
    grid: linearGrid(0.1, 0.01, 1, { unit: '0.1 octave', fine: '0.01 octave', coarse: '1 octave' }),
  },
  filterAttack: time('filterAttack', 'Attack', 0.005, 'fader'),
  filterDecay: time('filterDecay', 'Decay', 0.25, 'fader'),
  filterSustain: { id: 'filterSustain', label: 'Sustain', unit: '%', min: 0, max: 1, taper: 'linear', default: 0.3, control: 'fader', grid: PERCENT },
  filterRelease: time('filterRelease', 'Release', 0.4, 'fader'),
  ampAttack: time('ampAttack', 'Attack', 0.01, 'fader'),
  ampDecay: time('ampDecay', 'Decay', 0.3, 'fader'),
  ampSustain: { id: 'ampSustain', label: 'Sustain', unit: '%', min: 0, max: 1, taper: 'linear', default: 0.7, control: 'fader', grid: PERCENT },
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
    // Rates in Hz, so a Patch from before the tempo (issue 112) sounds as it did.
    lfoSync: 'off',
    lfo2Sync: 'off',
    voices: 1,
    // Each Note starts its Envelopes, so a Patch from before Legato (issue 119) sounds as it did.
    legato: 'off',
  };
}

/** The Mixer's sources' levels, in the panel's order: what the Mixer adds up. */
export const MIXER_LEVELS = ['mixOsc1', 'mixOsc2', 'mixRing', 'mixNoise', 'mixSub'] as const satisfies readonly ParamId[];

/** Whether Osc 1 is heard: mixed in, or through Ring (issue 88). */
export const osc1Heard = (patch: Patch) => patch.mixOsc1 > 0 || patch.mixRing > 0;

/** Whether Osc 2 is heard: mixed in, through Ring (issue 88), or moving Osc 1 (issue 89) while Osc 1 is heard (the owner). */
export const osc2Heard = (patch: Patch) => patch.mixOsc2 > 0 || patch.mixRing > 0 || (patch.crossMod > 0 && osc1Heard(patch));

/** Whether the Sub or the Noise is heard: either fader up. */
export const subNoiseHeard = (patch: Patch) => patch.mixSub > 0 || patch.mixNoise > 0;

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
  lfoSync: ['off', 'on'],
  lfo2Sync: ['off', 'on'],
  voices: [1, 2, 3, 4, 5, 6, 7, 8],
  legato: ['off', 'on'],
} as const satisfies { [K in Exclude<SoundField, ParamId>]: readonly Patch[K][] };

/** A Patch setting picked from a list (a Waveform, the Filter Mode…), rather than turned like a Parameter. */
export type ChoiceId = keyof typeof CHOICES;

/** Which LFO: 1 or 2. */
export type LfoNumber = 1 | 2;

/** The Patch's names for one LFO's settings. */
export const LFO_KEYS = {
  1: { rate: 'lfoRate', amount: 'lfoAmount', note: 'lfoNote', waveform: 'lfoWaveform', destination: 'lfoDestination', retrigger: 'lfoRetrigger', sync: 'lfoSync' },
  2: { rate: 'lfo2Rate', amount: 'lfo2Amount', note: 'lfo2Note', waveform: 'lfo2Waveform', destination: 'lfo2Destination', retrigger: 'lfo2Retrigger', sync: 'lfo2Sync' },
} as const;

/** One LFO's settings. */
export interface Lfo {
  /** In Hz, while Sync is off. */
  rate: number;
  amount: number;
  /** The note value (an index of `NOTE_VALUES`), while Sync is on. */
  note: number;
  waveform: LfoWaveform;
  destination: LfoDestination;
  retrigger: LfoRetrigger;
  sync: LfoSync;
}

/** Both LFOs' settings, LFO 1 first. */
export const lfos = (patch: Patch): [Lfo, Lfo] =>
  ([1, 2] as const).map((n) => {
    const k = LFO_KEYS[n];
    return {
      rate: patch[k.rate], amount: patch[k.amount], note: patch[k.note], waveform: patch[k.waveform], destination: patch[k.destination],
      retrigger: patch[k.retrigger], sync: patch[k.sync],
    };
  }) as [Lfo, Lfo];

/** How fast an LFO repeats at `bpm`, in Hz: its Rate, or with Sync on its note value at the tempo (issue 112). */
export const lfoHz = (lfo: Lfo, bpm: number) => (lfo.sync === 'on' ? noteHz(lfo.note, bpm) : lfo.rate);

/** The Parameter an LFO's Rate knob turns now: its Hz, or with Sync on its note value (issue 112). */
export const rateKnob = (patch: Patch, lfo: LfoNumber): ParamId => {
  const k = LFO_KEYS[lfo];
  return patch[k.sync] === 'on' ? k.note : k.rate;
};

/** The Parameter a control mapped to `id` turns now: an LFO's Rate turns its note value while Sync is on. */
export const knobTurns = (patch: Patch, id: ParamId): ParamId => (id === 'lfoRate' ? rateKnob(patch, 1) : id === 'lfo2Rate' ? rateKnob(patch, 2) : id);

export function setLfo(
  patch: Patch,
  { waveform, destination, retrigger, sync }: { waveform?: LfoWaveform; destination?: LfoDestination; retrigger?: LfoRetrigger; sync?: LfoSync },
  lfo: LfoNumber = 1,
): Patch {
  const k = LFO_KEYS[lfo];
  return {
    ...patch,
    [k.waveform]: waveform ?? patch[k.waveform],
    [k.destination]: destination ?? patch[k.destination],
    [k.retrigger]: retrigger ?? patch[k.retrigger],
    [k.sync]: sync ?? patch[k.sync],
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
    case 'note':
      return NOTE_VALUES[Math.round(value)].name;
  }
}

/** "+2 oct", "−1.3 oct", "0 ¢": signed with a true minus, no sign on zero. */
function signed(value: number, decimals: number, unit: string): string {
  const shown = Number(Math.abs(value).toFixed(decimals));
  if (shown === 0) return `0 ${unit}`;
  return `${value > 0 ? '+' : '−'}${shown.toFixed(decimals)} ${unit}`;
}
