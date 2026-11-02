import { NO_PRESSURE } from '../modulation/modulationModel';
import { TEMPO } from '../music/tempo';
import { LFO_DESTINATIONS } from '../patch/patch';
import { DEFAULT_OVERLAYS, OVERLAYS, type Overlay } from '../viewers/overlays';
import { INITIAL_VIEWER_STATE } from '../viewers/viewerState';
import type { KeyValueStorage } from './storage';

/** The values a setting may take, and the one a new page starts at when nothing (or nothing valid) was saved. */
interface Choice<T> {
  allowed: readonly T[];
  fallback: T;
}

const choice = <const T>(allowed: readonly T[], fallback: NoInfer<T>): Choice<T> => ({ allowed, fallback });

/** The one read-back check: a saved value is kept if the setting may take it, else the setting starts at its default. */
const checked = <T>(saved: unknown, { allowed, fallback }: Choice<T>): T =>
  (allowed as readonly unknown[]).includes(saved) ? (saved as T) : fallback;
/** The same for a single setting, kept as its own text: a number is kept as its digits. */
const checkedText = <T>(text: string | null, { allowed, fallback }: Choice<T>): T => allowed.find((value) => String(value) === text) ?? fallback;

const ON_OFF = choice(['on', 'off'], 'on');
/** A docked card's fold (issue 59): '1' folded to its top row, '0' open, as it has always been kept. */
const FOLD = choice(['0', '1'], '0');

/** How far a keyboard's bend wheel may take the pitch, in semitones each way: a whole tone (the usual), a fifth, an octave. */
export const BEND_RANGES = [2, 7, 12] as const;
export type BendRange = (typeof BEND_RANGES)[number];

/**
 * Every Display setting a new page starts from (issues 85, 87), and the page's other remembered settings, each docked
 * card's fold and the MIDI keyboard's bend range and aftertouch (issue 139): where each is kept, and the values it may
 * take. A group is kept as one JSON object under its key, a single setting as its own text. Freeze and the Snapshot are
 * moments and are never kept. A key or its form never changes: a browser that saved under it must find it again.
 * The one exception, decided by the owner: the Maths Layer's choice, now the Synth Geek Layer's, moved from `maths`
 * to `geek` within the overlays (issue 165), a choice saved under the old name being let go.
 */
const DISPLAY = {
  viewer: {
    key: 'limpide.viewSettings',
    fields: {
      cycles: choice([1, 2, 4], 2),
      timelineSeconds: choice([1, 2, 3, 4], 2),
      frequencyScale: choice(['log', 'linear'], INITIAL_VIEWER_STATE.frequencyScale),
      levelScale: choice(['db', 'linear'], INITIAL_VIEWER_STATE.levelScale),
      tapSource: choice(['all', 'newest'], INITIAL_VIEWER_STATE.tapSource),
    },
  },
  overlays: {
    key: 'limpide.overlays',
    fields: Object.fromEntries(OVERLAYS.map((o) => [o, choice([true, false], DEFAULT_OVERLAYS[o])])) as Record<Overlay, Choice<boolean>>,
  },
  letterKeys: { key: 'limpide.letterKeys', value: ON_OFF },
  tooltips: { key: 'limpide.tooltips', value: ON_OFF },
  theme: { key: 'limpide.theme', value: choice(['dark', 'light'], 'dark') },
  /**
   * Bead's switch (issues 115, 150), the lasting setting the Notes never turn: on by default, so any other stored value
   * (such as "unmet") reads as on.
   */
  bead: { key: 'limpide.bead', value: ON_OFF },
  /** The tempo (issue 112): the page's, never a Patch's, kept as the Display is; a whole BPM. */
  tempo: {
    key: 'limpide.tempo',
    fields: { bpm: choice(Array.from({ length: TEMPO.max - TEMPO.min + 1 }, (_, i) => TEMPO.min + i), TEMPO.default) },
  },
  /** Folded or not, for each kind of docked card; where it was dragged is never kept (issue 59). */
  'cardFolded.demo': { key: 'limpide.cardFolded.demo', value: FOLD },
  'cardFolded.tutorial': { key: 'limpide.cardFolded.tutorial', value: FOLD },
  'cardFolded.tour': { key: 'limpide.cardFolded.tour', value: FOLD },
  /** How far a keyboard's bend wheel takes the pitch (issue 52), kept as its digits. */
  bendRange: { key: 'limpide.bendRange', value: choice(BEND_RANGES, 2) },
  /** The Destination a keyboard's aftertouch moves (issue 132), with the MIDI settings, not in the Patch: the Cutoff at first. */
  aftertouch: { key: 'limpide.aftertouch', value: choice(LFO_DESTINATIONS.map((d) => d.id), NO_PRESSURE.destination) },
} as const;

type Display = typeof DISPLAY;
type Fields = Record<string, Choice<unknown>>;
type ValueOf<S> = S extends { fields: infer F extends Fields }
  ? { -readonly [K in keyof F]: F[K] extends Choice<infer T> ? T : never }
  : S extends { value: Choice<infer T> }
    ? T
    : never;

/** A remembered Display setting, by name. */
export type DisplaySetting = keyof Display;
export type DisplayValue<K extends DisplaySetting> = ValueOf<Display[K]>;
export type Theme = DisplayValue<'theme'>;

/** A saved JSON object, or nothing if the text is missing or garbled. */
function savedObject(text: string | null): Record<string, unknown> {
  try {
    const saved: unknown = JSON.parse(text ?? '{}');
    return saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** What an earlier visit saved for a Display setting, each value checked: a missing or garbled one starts at its default. */
export function recall<K extends DisplaySetting>(storage: KeyValueStorage, name: K): DisplayValue<K> {
  const setting: { key: string; fields: Fields } | { key: string; value: Choice<unknown> } = DISPLAY[name];
  const text = storage.getItem(setting.key);
  if ('value' in setting) return checkedText(text, setting.value) as DisplayValue<K>;
  const saved = savedObject(text);
  const fields = Object.entries(setting.fields).map(([field, allowed]) => [field, checked(saved[field], allowed)]);
  return Object.fromEntries(fields) as DisplayValue<K>;
}

/** Keeps a Display setting for the next visit. */
export function remember<K extends DisplaySetting>(storage: KeyValueStorage, name: K, value: DisplayValue<K>): void {
  const setting = DISPLAY[name];
  storage.setItem(setting.key, 'value' in setting ? String(value) : JSON.stringify(value));
}
