import { CHOICES, type ChoiceId, PARAMS, type ParamId, SWITCHES } from '../patch/patch';
import type { EncoderMode } from './encoderMode';

/** A momentary command that is not a Parameter. */
export type ActionId = 'hold' | 'freeze' | 'snapshot' | 'nextPreset' | 'previousPreset' | 'tapTempo';
export const ACTIONS: Record<ActionId, string> = {
  hold: 'Hold',
  freeze: 'Freeze',
  snapshot: 'Snapshot',
  nextPreset: 'Next Preset',
  previousPreset: 'Previous Preset',
  // The tempo's button (issue 112), "Tap" on screen; Tap Tempo, not to be taken for a Tap's listening point (issue 223).
  tapTempo: 'Tap Tempo',
};

/** One control on a Controller: a channel plus a CC or note number. */
export interface Control {
  kind: 'cc' | 'note';
  channel: number;
  number: number;
}

/**
 * The pitch bend wheel as a control: the number after the 128 CCs, so MIDI Learn can map it like a knob (its value
 * scaled to 0–127, Absolute) (issue 52).
 */
export const PITCH_BEND = 128;

/**
 * The known Controllers, by the tag a Mapping of a built-in layout is stored with (issue 145). Each has its facts
 * in the Controller module (`controller.ts`), which TypeScript holds to one per tag; the list is here, with the
 * Mapping's stored shape, so that reading stored Mappings needs nothing of a Controller's layout.
 */
export const CONTROLLER_IDS = ['c16'] as const;
export type ControllerId = (typeof CONTROLLER_IDS)[number];

export const CHOICE_LABELS: Record<ChoiceId, string> = {
  waveform: 'Osc 1 Waveform',
  osc2Waveform: 'Osc 2 Waveform',
  subOctave: 'Sub Octave',
  subWaveform: 'Sub Waveform',
  noiseColour: 'Noise Colour',
  filterMode: 'Filter Mode',
  filterSlope: 'Slope',
  lfoWaveform: 'LFO 1 Waveform',
  lfoDestination: 'LFO 1 Destination',
  lfo2Waveform: 'LFO 2 Waveform',
  lfo2Destination: 'LFO 2 Destination',
  lfoRetrigger: 'LFO 1 Retrigger',
  lfo2Retrigger: 'LFO 2 Retrigger',
  lfoSync: 'LFO 1 Sync',
  lfo2Sync: 'LFO 2 Sync',
  voices: 'Voices',
  legato: 'Legato',
};

/** What a Mapping drives: a Parameter, a choice, an Action, or the page's tempo, outside the Patch (issue 112). */
export type Target =
  | { kind: 'param'; id: ParamId }
  | { kind: 'choice'; id: ChoiceId }
  | { kind: 'action'; id: ActionId }
  | { kind: 'tempo'; id: 'bpm' };

const switches: ReadonlySet<ChoiceId> = new Set(SWITCHES);
/**
 * Whether MIDI Learn hears a control on this target as a button (an Action, a Switch), not a knob: a button learned on a
 * Switch flips it on each press, as one on an Action fires it, momentary or toggle (the owner, issue 223), where a
 * knob's turn would read as a knob's.
 */
export const learnsAsButton = (target: Target) => target.kind === 'action' || (target.kind === 'choice' && switches.has(target.id));

/** A button's mode: momentary ('trigger') or toggle, as a Mapping says below. */
export type ButtonMode = 'trigger' | 'toggle';

/**
 * A link from a Controller control to a Parameter (by Encoder Mode) or an Action. A knob whose Encoder Mode is not
 * known yet ('detect') finds it on its first turn: only the first C16 layout's knobs (issue 34) still stored, kept so
 * that layout loads until upgradeC16Layout replaces it, and going with it. A button either sends a press and a release ('trigger': it acts
 * on the press) or, as a toggle, one value per press, each the other ('toggle': it acts on every message). A
 * Mapping of a known Controller's built-in layout carries its tag and answers that Controller alone (issue 145); any
 * other answers every Controller, but the one it was learned away from (`except`, issue 255). Which input a Mapping answers is the Controller module's to say.
 */
export interface Mapping {
  control: Control;
  target: Target;
  mode: EncoderMode | 'detect' | ButtonMode;
  device?: ControllerId;
  /**
   * The known Controller a Mapping answers every Controller but: one MIDI Learn heard from another input on a control
   * that Controller's layout had (issue 255), so the C16's knob it took turns nothing, not its new target the wrong way.
   */
  except?: ControllerId;
}

/** A Mapping MIDI Learn just made, and those it replaced, sharing its control or its target (`took`, issue 255). */
export interface Learned {
  mapping: Mapping;
  took: readonly Mapping[];
}

/** A knob's Mapping as the MIDI panel shows it and switches it (issue 186): Absolute, or Relative of either kind. */
export type KnobMode = 'absolute' | 'relative';
/** Whether a Mapping's mode is a Relative knob's, of either kind. */
export const isRelative = (mode: Mapping['mode']): mode is 'relative-twos' | 'relative-centred' => mode === 'relative-twos' || mode === 'relative-centred';
/** A Mapping's knob mode; null for a button's, or a knob's still to be turned ('detect'). */
export const knobModeOf = (mode: Mapping['mode']): KnobMode | null => (mode === 'absolute' ? 'absolute' : isRelative(mode) ? 'relative' : null);

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEY = 'limpide.mappings';
const MODES = ['absolute', 'relative-twos', 'relative-centred', 'detect', 'trigger', 'toggle'];

/** A control as one string, for maps and React keys: "cc:1:74". */
export const controlKey = (c: Control) => `${c.kind}:${c.channel}:${c.number}`;
export const sameControl = (a: Control, b: Control) =>
  a.kind === b.kind && a.channel === b.channel && a.number === b.number;
export const sameTarget = (a: Target, b: Target) => a.kind === b.kind && a.id === b.id;
/** Whether two Mappings would take one place: the same control, or the same target (one each, issue 34). */
export const clash = (a: Mapping, b: Mapping) => sameControl(a.control, b.control) || sameTarget(a.target, b.target);

/** A Mapping stored before Tap Tempo's Action was renamed from `tap` (issue 223), on its new name; any other as it is. */
const renamed = (m: unknown): unknown => {
  const t = (m as Partial<Mapping> | null)?.target as { kind?: unknown; id?: unknown } | undefined;
  return t?.kind === 'action' && t.id === 'tap' ? { ...(m as Mapping), target: { kind: 'action', id: 'tapTempo' } } : m;
};

const isMapping = (m: unknown): m is Mapping => {
  const { control: c, target: t, mode, device, except } = (m ?? {}) as Partial<Mapping>;
  const byte = (n: unknown, min: number, max: number) =>
    Number.isInteger(n) && (n as number) >= min && (n as number) <= max;
  return (
    !!c &&
    (c.kind === 'cc' || c.kind === 'note') &&
    byte(c.channel, 1, 16) &&
    // A CC up to the bend wheel's 128, which MIDI Learn maps like a knob (issue 255); a Note up to 127.
    byte(c.number, 0, c.kind === 'cc' ? PITCH_BEND : 127) &&
    !!t &&
    ((t.kind === 'param' && Object.hasOwn(PARAMS, t.id)) ||
      (t.kind === 'choice' && Object.hasOwn(CHOICES, t.id)) ||
      (t.kind === 'action' && Object.hasOwn(ACTIONS, t.id)) ||
      (t.kind === 'tempo' && t.id === 'bpm')) &&
    MODES.includes(mode as string) &&
    (device === undefined || CONTROLLER_IDS.includes(device)) &&
    (except === undefined || CONTROLLER_IDS.includes(except))
  );
};

/**
 * The Mappings, kept in browser storage. One control drives one target and a target has one control, so a new
 * Mapping replaces any that shares either. What is read back is checked; unusable or unavailable storage
 * behaves as empty and never throws (Mappings then last for this visit).
 */
export function createMappingStore(storage: KeyValueStorage) {
  let mappings: Mapping[] = [];
  try {
    const stored: unknown = JSON.parse(storage.getItem(KEY) ?? '[]');
    if (Array.isArray(stored)) mappings = stored.map(renamed).filter(isMapping);
  } catch {
    // Garbled or unavailable: start empty.
  }
  const listeners = new Set<() => void>();
  const changed = () => {
    try {
      storage.setItem(KEY, JSON.stringify(mappings));
    } catch {
      // Storage unavailable: keep them for this visit.
    }
    for (const listener of listeners) listener();
  };

  return {
    list: (): readonly Mapping[] => mappings,
    find: (control: Control) => mappings.find((m) => sameControl(m.control, control)),
    findTarget: (target: Target) => mappings.find((m) => sameTarget(m.target, target)),
    set(mapping: Mapping) {
      mappings = [...mappings.filter((m) => !clash(m, mapping)), mapping];
      changed();
    },
    /** The Mapping on the same control, replaced (its mode found, say), leaving every other Mapping as it is. */
    replace(mapping: Mapping) {
      mappings = mappings.map((m) => (sameControl(m.control, mapping.control) ? mapping : m));
      changed();
    },
    /** The Mapping on one control removed (an Action on several buttons keeps the others). */
    remove(control: Control) {
      mappings = mappings.filter((m) => !sameControl(m.control, control));
      changed();
    },
    restore(earlier: readonly Mapping[]) {
      mappings = [...earlier];
      changed();
    },
    clear() {
      mappings = [];
      changed();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export type MappingStore = ReturnType<typeof createMappingStore>;
