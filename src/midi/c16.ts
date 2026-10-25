import type { Control, Mapping, Target } from './mappings';

const param = (id: Extract<Target, { kind: 'param' }>['id']): Target => ({ kind: 'param', id });
const choice = (id: Extract<Target, { kind: 'choice' }>['id']): Target => ({ kind: 'choice', id });
const action = (id: Extract<Target, { kind: 'action' }>['id']): Target => ({ kind: 'action', id });

/** The first five buttons of every bank: the Actions, wherever the hands are. */
const ACTION_BUTTONS = [action('hold'), action('freeze'), action('snapshot'), action('previousPreset'), action('nextPreset')];

/**
 * One bank of the C16: what its 8 knobs, 4 faders and 12 buttons drive (null, or past the list's end: left free).
 * The banks play the page's sections in order: A the Oscillators, B the Filter, C the Amp, D the LFOs.
 */
interface Bank {
  knobs: (Target | null)[];
  faders: (Target | null)[];
  buttons: Target[];
}

const BANKS: Bank[] = [
  {
    knobs: [
      choice('waveform'), param('pulseWidth'), choice('osc2Waveform'), param('osc2Octave'),
      param('osc2Semitone'), param('osc2Detune'), param('osc2PulseWidth'), param('glide'),
    ],
    faders: [param('mixOsc1'), param('mixOsc2'), param('mixSub'), param('mixNoise')],
    buttons: ACTION_BUTTONS,
  },
  {
    knobs: [
      param('cutoff'), param('resonance'), param('filterEnvAmount'), param('velocityCutoff'),
      param('keyTrack'), choice('filterMode'), choice('filterSlope'), null,
    ],
    faders: [param('filterAttack'), param('filterDecay'), param('filterSustain'), param('filterRelease')],
    buttons: ACTION_BUTTONS,
  },
  {
    knobs: [choice('voices'), null, null, null, null, null, null, null],
    faders: [param('ampAttack'), param('ampDecay'), param('ampSustain'), param('ampRelease')],
    buttons: ACTION_BUTTONS,
  },
  {
    knobs: [
      choice('lfoWaveform'), param('lfoRate'), param('lfoAmount'), choice('lfoDestination'),
      choice('lfo2Waveform'), param('lfo2Rate'), param('lfo2Amount'), choice('lfo2Destination'),
    ],
    faders: [null, null, null, null],
    buttons: [...ACTION_BUTTONS, choice('lfoRetrigger'), choice('lfo2Retrigger')],
  },
];

/** The TempoPAD C16's factory CCs, on channel 1: each kind of control from its first CC, one bank after another. */
const KNOBS = { first: 1, perBank: 8 };
const FADERS = { first: 33, perBank: 4 };
const BUTTONS = { first: 49, perBank: 12 };
const ccOf = (kind: typeof KNOBS, bank: number, i: number) => kind.first + kind.perBank * bank + i;

/** The C16 layout as Mappings, on channel 1. */
export function c16Layout(): Mapping[] {
  const cc = (number: number) => ({ kind: 'cc' as const, channel: 1, number });
  return BANKS.flatMap((bank, b) => [
    // A knob finds its Encoder Mode on its first turn: the C16 can be set to send either Relative format.
    ...bank.knobs.flatMap((target, i) => (target ? [{ control: cc(ccOf(KNOBS, b, i)), target, mode: 'detect' as const }] : [])),
    ...bank.faders.flatMap((target, i) => (target ? [{ control: cc(ccOf(FADERS, b, i)), target, mode: 'absolute' as const }] : [])),
    ...bank.buttons.map((target, i) => ({ control: cc(ccOf(BUTTONS, b, i)), target, mode: 'toggle' as const })),
  ]);
}

/** The bank (0 for A … 3 for D) a C16 control belongs to, by its CC; undefined when it is not one of the C16's. */
export function c16Bank(control: Control): number | undefined {
  if (control.kind !== 'cc' || control.channel !== 1) return undefined;
  for (const kind of [KNOBS, FADERS, BUTTONS]) {
    const offset = control.number - kind.first;
    if (offset >= 0 && offset < kind.perBank * BANKS.length) return Math.floor(offset / kind.perBank);
  }
  return undefined;
}

/** Whether a MIDI device is a TempoPAD C16, by the name it gives. */
export const isC16 = (name: string) => /tempopad\s*c16/i.test(name);
