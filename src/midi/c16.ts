import { CHOICES } from '../patch/patch';
import type { KnownController, PlaceKind } from './controller';
import { targetKey } from './describe';
import { type ButtonMode, type Control, clash, type Mapping, type Target } from './mappings';

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
 * The four banks, the page's sections in order (issue 145, decided by the owner). Bank D's R row has each LFO's
 * Retrigger and Sync side by side (issue 112); bank C's R2, under Glide, switches Legato (issue 119).
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
    buttons: shared(FREE, [null, at(choice('legato'), 'Legato'), null, null]),
  },
  {
    name: 'LFO & Envelopes',
    knobs: [
      at(choice('lfoWaveform'), 'LFO 1 Waveform'), at(choice('lfoDestination'), 'LFO 1 Destination'),
      at(choice('lfo2Waveform'), 'LFO 2 Waveform'), at(choice('lfo2Destination'), 'LFO 2 Destination'),
      at(param('lfoAmount'), 'LFO 1 Depth'), at(param('lfoRate'), 'LFO 1 Rate'), at(param('lfo2Amount'), 'LFO 2 Depth'), at(param('lfo2Rate'), 'LFO 2 Rate'),
    ],
    faders: FREE,
    buttons: shared(FREE, [
      at(choice('lfoRetrigger'), 'LFO 1 Retrigger'), at(choice('lfoSync'), 'LFO 1 Sync'),
      at(choice('lfo2Retrigger'), 'LFO 2 Retrigger'), at(choice('lfo2Sync'), 'LFO 2 Sync'),
    ]),
  },
];

/** A bank's letter on the C16, 0 for A … 3 for D. */
export const bankLetter = (bank: number) => 'ABCD'[bank];

/** The C16's factory CCs, on channel 1: knobs and faders across their rows, buttons down each strip (M, S, R) and then across. */
export const C16_CHANNEL = 1;
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
export const buttonMode = (target: Target): ButtonMode =>
  target.kind === 'choice' && CHOICES[target.id].length === 2 ? 'toggle' : 'trigger';
/** A free button's mode: the C16's own setting, left as it is. */
export const FREE_BUTTON_MODE: ButtonMode = 'toggle';

/** A button the same on every bank, by its name on the C16 ("M1", "S3"), and what it drives. */
export interface SharedButton {
  name: string;
  place: NonNullable<C16Place>;
}

const samePlace = (a: C16Place, b: C16Place) => !!a && !!b && a.label === b.label && targetKey(a.target) === targetKey(b.target);

/** The buttons that drive the same on every bank, row by row (M, S, R) and strip by strip: what the printed card's foot lists. */
export function sharedButtons(banks: readonly C16Bank[] = C16_BANKS): SharedButton[] {
  return BUTTON_ROWS.flatMap((row) =>
    banks[0].buttons[row].flatMap((place, strip) =>
      place && banks.every((bank) => samePlace(bank.buttons[row][strip], place)) ? [{ name: `${row}${strip + 1}`, place }] : [],
    ),
  );
}

/** The shared buttons as one line: "M1 Previous Preset, M2 Next Preset, …". */
export const describeSharedButtons = (banks?: readonly C16Bank[]) => sharedButtons(banks).map((s) => `${s.name} ${s.place.label}`).join(', ');

/** The C16's tag on its Mappings, its record's id: written once (issue 196). */
const C16_ID = 'c16' as const;

/**
 * The C16 layout as Mappings, on channel 1, answering a C16 only (issue 145). The knobs are endless and set to the
 * editor's Relative #1 (64-centred: 65 or 66 up, 63 or 62 down); the faders send positions.
 */
export function c16Layout(): Mapping[] {
  const cc = (number: number): Control => ({ kind: 'cc', channel: C16_CHANNEL, number });
  const device = C16_ID;
  return C16_BANKS.flatMap((bank, b) => [
    ...bank.knobs.flatMap((p, i) => (p ? [{ control: cc(knobCc(b, i)), target: p.target, mode: 'relative-centred' as const, device }] : [])),
    ...bank.faders.flatMap((p, i) => (p ? [{ control: cc(faderCc(b, i)), target: p.target, mode: 'absolute' as const, device }] : [])),
    ...BUTTON_ROWS.flatMap((row) =>
      bank.buttons[row].flatMap((p, strip) => (p ? [{ control: cc(buttonCc(b, row, strip)), target: p.target, mode: buttonMode(p.target), device }] : [])),
    ),
  ]);
}

/** Each kind of the C16's controls, and its CCs. */
const KINDS = [
  ['knob', KNOBS],
  ['fader', FADERS],
  ['button', BUTTONS],
] as const;

/**
 * Where a C16 control sits, by its CC: its bank (0 for A … 3 for D), its kind, and its offset among that bank's
 * controls of its kind; undefined when it is not one of the C16's.
 */
function c16Spot(control: Control): { bank: number; kind: PlaceKind; offset: number } | undefined {
  if (control.kind !== 'cc' || control.channel !== C16_CHANNEL) return undefined;
  for (const [kind, { first, perBank }] of KINDS) {
    const offset = control.number - first;
    if (offset >= 0 && offset < perBank * C16_BANKS.length) return { bank: Math.floor(offset / perBank), kind, offset: offset % perBank };
  }
  return undefined;
}

/** The bank (0 for A … 3 for D) a C16 control belongs to, by its CC; undefined when it is not one of the C16's. */
export const c16Bank = (control: Control): number | undefined => c16Spot(control)?.bank;

/** A C16 control's place, by its bank's letter, its kind and its name on the panel ("K1", "F4", "M4"); undefined off the C16. */
function c16Place(control: Control): { bankLetter: string; kind: PlaceKind; name: string } | undefined {
  const spot = c16Spot(control);
  if (!spot) return undefined;
  const { bank, kind, offset } = spot;
  const name =
    kind === 'knob'
      ? `K${offset + 1}`
      : kind === 'fader'
        ? `F${offset + 1}`
        : `${BUTTON_ROWS[offset % BUTTON_ROWS.length]}${Math.floor(offset / BUTTON_ROWS.length) + 1}`;
  return { bankLetter: bankLetter(bank), kind, name };
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
  // Its buttons counted from each bank's first, down each strip and then across, as today's are.
  return [0, 1, 2, 3].flatMap((b) => [
    ...knobs[b].map((t, i): [number, string] => [knobCc(b, i), t]),
    ...faders[b].map((t, i): [number, string] => [faderCc(b, i), t]),
    ...[...actions, ...(b === 3 ? ['choice:lfoRetrigger', 'choice:lfo2Retrigger'] : [])].map((t, i): [number, string] => [buttonCc(b, 'M', 0) + i, t]),
  ]);
})();

/**
 * Stored Mappings brought to today's C16 layout (issue 145): when any is the first layout's, those go and the new
 * layout comes in, a person's own Mappings kept wherever they do not share a control or a target with it. Null when
 * none is the first layout's (nothing to bring over).
 */
export function upgradeC16Layout(stored: readonly Mapping[]): Mapping[] | null {
  const first = (m: Mapping) =>
    !m.device && m.control.kind === 'cc' && m.control.channel === C16_CHANNEL &&
    FIRST_LAYOUT.some(([cc, target]) => cc === m.control.number && target === targetKey(m.target));
  if (!stored.some(first)) return null;
  const layout = c16Layout();
  const own = stored.filter((m) => !first(m) && !layout.some((l) => clash(l, m)));
  return [...own, ...layout];
}

/** The places today's layout has that issue 145's left free, by target: each LFO's Sync (issue 112), Legato (issue 119). */
const ADDED_SINCE_145 = ['choice:lfoSync', 'choice:lfo2Sync', 'choice:legato'];

/**
 * Stored Mappings with the places added to the layout since issue 145's (each LFO's Sync, issue 112; Legato, issue
 * 119), where the person's Mappings leave both the control and the target free: a C16 set up with issue 145's layout
 * gets them, and a place the person has used since stays theirs. Null when there is nothing to add, or when none of
 * the Mappings is the layout's: a person who removed it meant to (ADR-0009).
 */
export function addC16Places(stored: readonly Mapping[]): Mapping[] | null {
  if (!stored.some((m) => m.device === C16_ID)) return null;
  const added = c16Layout().filter((l) => ADDED_SINCE_145.includes(targetKey(l.target)) && !stored.some((m) => clash(l, m)));
  return added.length ? [...stored, ...added] : null;
}

/**
 * A C16 knob's 66 (or 62) as a share of a step of the Parameter's Grid (issues 145 and 160): a bit of turning sends
 * one 65 (or 63) turned slowly and, past a speed, a burst of eight 66s, which reach the page split and merged, so they
 * are counted by message, not by time. The C16 sends fewer bursts than bits when turned fast, so a 66 counts more than
 * an eighth (the owner, 2026-10-31).
 */
const FAST_TURN_STEP = 1 / 3;

/**
 * What is recorded once today's layout is in place, applied or brought over from an earlier one: 2 for issue 145's,
 * 3 since each LFO's Sync (issue 112).
 */
const LAYOUT_VERSION = '3';

/** The TempoPAD C16 as a known Controller (issue 149): the one place the rest of the MIDI code learns of it. */
export const C16: KnownController = {
  id: C16_ID,
  label: 'C16',
  named: isC16,
  layout: c16Layout,
  // Set once the layout has come in, so it never comes in again unasked.
  applied: { key: 'limpide.c16Layout', version: LAYOUT_VERSION },
  // The first layout, stored before issue 145, becomes today's, a person's own Mappings kept, and so is anything
  // learned since on a place it had; issue 145's gains the places added since, where the person's leave them free.
  upgrade(stored, recorded) {
    const upgraded = upgradeC16Layout(stored) ?? stored;
    const added = recorded === '2' ? addC16Places(upgraded) : null;
    const mappings = added ?? upgraded;
    return mappings === stored ? null : mappings;
  },
  section: c16Bank,
  place: c16Place,
  banks: C16_BANKS.length,
  fastTurnStep: FAST_TURN_STEP,
};
