import { CHOICES, type ChoiceId, PARAMS, type ParamId } from '../patch/patch';
import type { EncoderMode } from './encoderMode';

/** A momentary command that is not a Parameter. */
export type ActionId = 'hold' | 'freeze' | 'snapshot' | 'nextPreset' | 'previousPreset';
export const ACTIONS: Record<ActionId, string> = {
  hold: 'Hold',
  freeze: 'Freeze',
  snapshot: 'Snapshot',
  nextPreset: 'Next Preset',
  previousPreset: 'Previous Preset',
};

/** One control on a Controller: a channel plus a CC or note number. */
export interface Control {
  kind: 'cc' | 'note';
  channel: number;
  number: number;
}

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
  voices: 'Voices',
};

export type Target = { kind: 'param'; id: ParamId } | { kind: 'choice'; id: ChoiceId } | { kind: 'action'; id: ActionId };

/**
 * A link from a Controller control to a Parameter (by Encoder Mode) or an Action. A knob whose Encoder Mode is not
 * known yet ('detect') finds it on its first turn. A button either sends a press and a release ('trigger': it acts
 * on the press) or, as a toggle, one value per press, each the other ('toggle': it acts on every message).
 */
export interface Mapping {
  control: Control;
  target: Target;
  mode: EncoderMode | 'detect' | 'trigger' | 'toggle';
}

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

const isMapping = (m: unknown): m is Mapping => {
  const { control: c, target: t, mode } = (m ?? {}) as Partial<Mapping>;
  const byte = (n: unknown, min: number, max: number) =>
    Number.isInteger(n) && (n as number) >= min && (n as number) <= max;
  return (
    !!c &&
    (c.kind === 'cc' || c.kind === 'note') &&
    byte(c.channel, 1, 16) &&
    byte(c.number, 0, 127) &&
    !!t &&
    ((t.kind === 'param' && Object.hasOwn(PARAMS, t.id)) ||
      (t.kind === 'choice' && Object.hasOwn(CHOICES, t.id)) ||
      (t.kind === 'action' && Object.hasOwn(ACTIONS, t.id))) &&
    MODES.includes(mode as string)
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
    if (Array.isArray(stored)) mappings = stored.filter(isMapping);
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
      mappings = [
        ...mappings.filter((m) => !sameControl(m.control, mapping.control) && !sameTarget(m.target, mapping.target)),
        mapping,
      ];
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
