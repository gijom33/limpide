import { CHOICES } from '../patch/patch';
import { type Control, type Mapping, sameControl, sameTarget, type Target } from './mappings';

const param = (id: Extract<Target, { kind: 'param' }>['id']): Target => ({ kind: 'param', id });
const choice = (id: Extract<Target, { kind: 'choice' }>['id']): Target => ({ kind: 'choice', id });
const action = (id: Extract<Target, { kind: 'action' }>['id']): Target => ({ kind: 'action', id });

/** A place on the C16 and what it drives, with the short name the printed card gives it; null: left free. */
export type C16Place = { target: Target; label: string } | null;
const at = (target: Target, label: string): C16Place => ({ target, label });

/** The C16's three rows of buttons under its faders, as printed on it. */
export const BUTTON_ROWS = ['M', 'S', 'R'] as const;
export type ButtonRow = (typeof BUTTON_ROWS)[number];

/**
 * One bank of the C16 (issue 145), as its panel lays them out: knobs K1–K4 over K5–K8, faders F1–F4 under them, and
 * under each fader the M, S and R buttons. Each strip of the panel (two knobs, a fader, three buttons) is a column of
 * its section on screen.
 */
export interface C16Bank {
  name: string;
  knobs: C16Place[];
  faders: C16Place[];
  buttons: Record<ButtonRow, C16Place[]>;
}

/** M1–M4 and S3, the same on every bank: the Preset arrows, Freeze and Hold under the fingers, Snapshot under Freeze. */
const SHARED_M = [at(action('previousPreset'), 'Previous Preset'), at(action('nextPreset'), 'Next Preset'), at(action('freeze'), 'Freeze'), at(action('hold'), 'Hold')];
const shared = (s: C16Place[], r: C16Place[]) => ({ M: SHARED_M, S: [s[0], s[1], at(action('snapshot'), 'Snapshot'), s[3]], R: r });
const FREE = [null, null, null, null];

/**
 * The four banks, the page's sections in order (issue 145, decided by the owner). Bank D's R2 and R4 are kept for
 * the LFOs' Sync (issue 112), bank C's R2 for Legato (issue 119).
 */
export const C16_BANKS: C16Bank[] = [
  {
    name: 'Oscillators',
    knobs: [
      at(param('osc1Octave'), 'Osc 1 Octave'), at(param('crossMod'), 'FM'), at(param('mixRing'), 'Ring'), at(param('pulseWidth'), 'Pulse Width'),
      at(param('osc2Octave'), 'Osc 2 Octave'), at(param('osc2Semitone'), 'Semitone'), at(param('osc2Detune'), 'Detune'), at(param('osc2EnvAmount'), 'Osc 2 Env Amount'),
    ],
    faders: [at(param('mixOsc1'), 'Osc 1 level'), at(param('mixOsc2'), 'Osc 2 level'), at(param('mixNoise'), 'Noise level'), at(param('mixSub'), 'Sub level')],
    buttons: shared(
      [null, null, null, at(choice('subOctave'), 'Sub Octave')],
      [at(choice('waveform'), 'Osc 1 Waveform'), at(choice('osc2Waveform'), 'Osc 2 Waveform'), at(choice('noiseColour'), 'Noise Colour'), at(choice('subWaveform'), 'Sub Waveform')],
    ),
  },
  {
    name: 'Filter',
    knobs: [
      at(param('cutoff'), 'Cutoff'), at(param('resonance'), 'Resonance'), at(param('velocityCutoff'), 'Velocity'), at(param('keyTrack'), 'Key Track'),
      at(param('filterEnvAmount'), 'Env Amount'), at(choice('filterMode'), 'Mode'), null, null,
    ],
    faders: [at(param('filterAttack'), 'Attack'), at(param('filterDecay'), 'Decay'), at(param('filterSustain'), 'Sustain'), at(param('filterRelease'), 'Release')],
    buttons: shared(FREE, [at(choice('filterSlope'), 'Slope'), null, null, null]),
  },
  {
    name: 'Amp',
    knobs: [at(choice('voices'), 'Voices'), at(param('glide'), 'Glide'), null, null, null, null, null, at(param('volume'), 'Volume')],
    faders: [at(param('ampAttack'), 'Attack'), at(param('ampDecay'), 'Decay'), at(param('ampSustain'), 'Sustain'), at(param('ampRelease'), 'Release')],
    buttons: shared(FREE, FREE),
  },
  {
    name: 'LFO & Envelopes',
    knobs: [
      at(choice('lfoWaveform'), 'LFO 1 Waveform'), at(choice('lfoDestination'), 'LFO 1 Destination'),
      at(choice('lfo2Waveform'), 'LFO 2 Waveform'), at(choice('lfo2Destination'), 'LFO 2 Destination'),
      at(param('lfoAmount'), 'LFO 1 Depth'), at(param('lfoRate'), 'LFO 1 Rate'), at(param('lfo2Amount'), 'LFO 2 Depth'), at(param('lfo2Rate'), 'LFO 2 Rate'),
    ],
    faders: FREE,
    buttons: shared(FREE, [at(choice('lfoRetrigger'), 'LFO 1 Retrigger'), null, at(choice('lfo2Retrigger'), 'LFO 2 Retrigger'), null]),
  },
];

/** The C16's factory CCs, on channel 1: knobs and faders across their rows, buttons down each strip (M, S, R) and then across. */
const CHANNEL = 1;
const KNOBS = { first: 1, perBank: 8 };
const FADERS = { first: 33, perBank: 4 };
const BUTTONS = { first: 49, perBank: 12 };
export const knobCc = (bank: number, i: number) => KNOBS.first + KNOBS.perBank * bank + i;
export const faderCc = (bank: number, i: number) => FADERS.first + FADERS.perBank * bank + i;
export const buttonCc = (bank: number, row: ButtonRow, strip: number) => BUTTONS.first + BUTTONS.perBank * bank + 3 * strip + BUTTON_ROWS.indexOf(row);

/**
 * How a button sends, set on the C16 for each (issue 145): momentary (127 pressed, 0 let go) for what a press does,
 * an Action or a step through a choice of more than two; toggle (one message a press, its light the state) for a
 * two-way switch.
 */
export const buttonMode = (target: Target): 'trigger' | 'toggle' =>
  target.kind === 'choice' && CHOICES[target.id].length === 2 ? 'toggle' : 'trigger';

/**
 * The C16 layout as Mappings, on channel 1, answering a C16 only (issue 145). The knobs are endless and set to the
 * editor's Relative #1 (64-centred: 65 or 66 up, 63 or 62 down); the faders send positions.
 */
export function c16Layout(): Mapping[] {
  const cc = (number: number): Control => ({ kind: 'cc', channel: CHANNEL, number });
  const device = 'c16' as const;
  return C16_BANKS.flatMap((bank, b) => [
    ...bank.knobs.flatMap((p, i) => (p ? [{ control: cc(knobCc(b, i)), target: p.target, mode: 'relative-centred' as const, device }] : [])),
    ...bank.faders.flatMap((p, i) => (p ? [{ control: cc(faderCc(b, i)), target: p.target, mode: 'absolute' as const, device }] : [])),
    ...BUTTON_ROWS.flatMap((row) =>
      bank.buttons[row].flatMap((p, strip) => (p ? [{ control: cc(buttonCc(b, row, strip)), target: p.target, mode: buttonMode(p.target), device }] : [])),
    ),
  ]);
}

/** The bank (0 for A … 3 for D) a C16 control belongs to, by its CC; undefined when it is not one of the C16's. */
export function c16Bank(control: Control): number | undefined {
  if (control.kind !== 'cc' || control.channel !== CHANNEL) return undefined;
  for (const kind of [KNOBS, FADERS, BUTTONS]) {
    const offset = control.number - kind.first;
    if (offset >= 0 && offset < kind.perBank * C16_BANKS.length) return Math.floor(offset / kind.perBank);
  }
  return undefined;
}

/** Whether a MIDI device is a TempoPAD C16, by the name it gives (over USB, or Bluetooth: "… C16 BT Bluetooth"). */
export const isC16 = (name: string) => /tempopad\s*c16/i.test(name);

/**
 * The first layout (issue 34, 2026-10-25), CC by CC, to recognise it among a person's stored Mappings: its knobs on
 * CC 1–32, its faders on 33–48, its Actions on each bank's first five buttons and the Retriggers on bank D's next two.
 */
const FIRST_LAYOUT: [number, string][] = (() => {
  const knobs = [
    ['choice:waveform', 'param:pulseWidth', 'choice:osc2Waveform', 'param:osc2Octave', 'param:osc2Semitone', 'param:osc2Detune', 'param:osc2PulseWidth', 'param:glide'],
    ['param:cutoff', 'param:resonance', 'param:filterEnvAmount', 'param:velocityCutoff', 'param:keyTrack', 'choice:filterMode', 'choice:filterSlope'],
    ['choice:voices'],
    ['choice:lfoWaveform', 'param:lfoRate', 'param:lfoAmount', 'choice:lfoDestination', 'choice:lfo2Waveform', 'param:lfo2Rate', 'param:lfo2Amount', 'choice:lfo2Destination'],
  ];
  const faders = [
    ['param:mixOsc1', 'param:mixOsc2', 'param:mixSub', 'param:mixNoise'],
    ['param:filterAttack', 'param:filterDecay', 'param:filterSustain', 'param:filterRelease'],
    ['param:ampAttack', 'param:ampDecay', 'param:ampSustain', 'param:ampRelease'],
    [],
  ];
  const actions = ['action:hold', 'action:freeze', 'action:snapshot', 'action:previousPreset', 'action:nextPreset'];
  return [0, 1, 2, 3].flatMap((b) => [
    ...knobs[b].map((t, i): [number, string] => [1 + 8 * b + i, t]),
    ...faders[b].map((t, i): [number, string] => [33 + 4 * b + i, t]),
    ...[...actions, ...(b === 3 ? ['choice:lfoRetrigger', 'choice:lfo2Retrigger'] : [])].map((t, i): [number, string] => [49 + 12 * b + i, t]),
  ]);
})();

/**
 * Stored Mappings brought to today's C16 layout (issue 145): when any is the first layout's, those go and the new
 * layout comes in, a person's own Mappings kept wherever they do not share a control or a target with it. Null when
 * none is the first layout's (nothing to bring over).
 */
export function upgradeC16Layout(stored: readonly Mapping[]): Mapping[] | null {
  const first = (m: Mapping) =>
    !m.device && m.control.kind === 'cc' && m.control.channel === CHANNEL &&
    FIRST_LAYOUT.some(([cc, target]) => cc === m.control.number && target === `${m.target.kind}:${m.target.id}`);
  if (!stored.some(first)) return null;
  const layout = c16Layout();
  const own = stored.filter((m) => !first(m) && !layout.some((l) => sameControl(l.control, m.control) || sameTarget(l.target, m.target)));
  return [...own, ...layout];
}
