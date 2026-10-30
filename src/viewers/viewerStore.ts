import type { KeyValueStorage } from '../app/storage';
import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { type IdealPartial, idealFmKept, idealPartials } from '../music/idealReference';
import type { Patch } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import { loadOverlays, type Overlay, saveOverlays, toggleOverlay } from './overlays';
import { INITIAL_VIEWER_STATE, type TapSource, type ViewerAction, viewerReducer } from './viewerState';
import type { IdealAt, ViewSettings } from './viewSettings';

/** Every way the Viewer settings change: the reducer's, and the Scope's cycles, the Timeline's length, the overlays. */
export type ViewSettingsAction =
  | ViewerAction
  | { type: 'setCycles'; cycles: ViewSettings['cycles'] }
  | { type: 'setTimelineSeconds'; seconds: ViewSettings['timelineSeconds'] }
  | { type: 'toggleOverlay'; overlay: Overlay }
  /** A Tutorial's Display Step, done for the person: the overlay on, whatever it was. */
  | { type: 'showOverlay'; overlay: Overlay };

export type ViewerStore = ReturnType<typeof createViewerStore>;

const IDEAL_HARMONICS = 256;
const KEY = 'limpide.viewSettings';

/** The Display settings saved besides the overlays (issue 85), each with the values it may take. */
const SAVED = {
  cycles: [1, 2, 4],
  timelineSeconds: [1, 2, 3, 4],
  frequencyScale: ['log', 'linear'],
  levelScale: ['db', 'linear'],
  tapSource: ['all', 'newest'],
} as const;
type Saved = { [K in keyof typeof SAVED]: (typeof SAVED)[K][number] };

const savedOf = (settings: ViewSettings): Saved => ({
  cycles: settings.cycles,
  timelineSeconds: settings.timelineSeconds,
  frequencyScale: settings.viewer.frequencyScale,
  levelScale: settings.viewer.levelScale,
  tapSource: settings.viewer.tapSource,
});

/** What an earlier visit saved, each value checked: a missing, garbled or unknown one is left out. */
function loadSaved(storage: KeyValueStorage): Partial<Saved> {
  try {
    const stored: unknown = JSON.parse(storage.getItem(KEY) ?? '{}');
    if (!stored || typeof stored !== 'object') return {};
    const values = stored as Record<string, unknown>;
    const valid = Object.entries(SAVED).filter(([key, allowed]) => (allowed as readonly unknown[]).includes(values[key]));
    return Object.fromEntries(valid.map(([key]) => [key, values[key]]));
  } catch {
    return {};
  }
}

/** Ideals kept per Patch, by the share of FM's depth their Note keeps: a few Notes' worth. */
const KEPT_IDEALS = 16;

/**
 * The Ideal Reference at the Oscillator Tap's level: the same series the engine plays, scaled by the Nominal Level, at
 * the share of FM's depth the Note keeps (issue 103; to a thousandth, so a Note held reuses its Ideal every frame).
 */
const idealOf = (patch: Patch): IdealAt => {
  const known = new Map<number, readonly IdealPartial[]>();
  return (fundamental, sampleRate) => {
    const kept = Math.round(idealFmKept(patch, fundamental, sampleRate) * 1000) / 1000;
    const ideal = known.get(kept) ?? idealPartials(patch, IDEAL_HARMONICS, kept).map((p) => ({ ...p, level: p.level * OSCILLATOR_LEVEL }));
    if (!known.has(kept)) {
      if (known.size >= KEPT_IDEALS) known.clear();
      known.set(kept, ideal);
    }
    return ideal;
  };
};

function reduce(settings: ViewSettings, action: ViewSettingsAction): ViewSettings {
  switch (action.type) {
    case 'setCycles':
      return { ...settings, cycles: action.cycles };
    case 'setTimelineSeconds':
      return { ...settings, timelineSeconds: action.seconds };
    case 'toggleOverlay':
      return { ...settings, overlays: toggleOverlay(settings.overlays, action.overlay) };
    case 'showOverlay':
      return settings.overlays[action.overlay] ? settings : { ...settings, overlays: { ...settings.overlays, [action.overlay]: true } };
    default:
      return { ...settings, viewer: viewerReducer(settings.viewer, action) };
  }
}

/**
 * The settings the Viewers read every frame (issue 77), outside React as the Patch is (ADR-0013): the render loop
 * reads `get`, React subscribes, and `dispatch` is the one way to change them. Every Display setting is saved and a new
 * page starts from it (issue 85), never Freeze or the Snapshot, which are moments; the Amp Tap's source goes to the
 * engine as soon as it changes; the Ideal Reference follows every change to the Patch.
 */
export function createViewerStore({
  storage,
  patches,
  setTapSource,
}: {
  storage: KeyValueStorage;
  patches: Pick<PatchStore, 'get' | 'subscribe'>;
  setTapSource(source: TapSource): void;
}) {
  const { cycles = 2, timelineSeconds = 2, frequencyScale, levelScale, tapSource } = loadSaved(storage);
  let settings: ViewSettings = {
    cycles,
    timelineSeconds,
    ideal: idealOf(patches.get().patch),
    overlays: loadOverlays(storage),
    viewer: {
      ...INITIAL_VIEWER_STATE,
      frequencyScale: frequencyScale ?? INITIAL_VIEWER_STATE.frequencyScale,
      levelScale: levelScale ?? INITIAL_VIEWER_STATE.levelScale,
      tapSource: tapSource ?? INITIAL_VIEWER_STATE.tapSource,
    },
  };
  const listeners = new Set<() => void>();
  const set = (next: ViewSettings) => {
    const before = settings;
    settings = next;
    if (next.overlays !== before.overlays) saveOverlays(storage, next.overlays);
    const saved = JSON.stringify(savedOf(next));
    if (saved !== JSON.stringify(savedOf(before))) {
      try {
        storage.setItem(KEY, saved);
      } catch {
        // Storage unavailable: the settings still apply for this visit.
      }
    }
    if (next.viewer.tapSource !== before.viewer.tapSource) setTapSource(next.viewer.tapSource);
    for (const listener of listeners) listener();
  };

  setTapSource(settings.viewer.tapSource);
  patches.subscribe(({ after }) => set({ ...settings, ideal: idealOf(after) }));

  return {
    get: (): ViewSettings => settings,
    dispatch(action: ViewSettingsAction) {
      set(reduce(settings, action));
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
