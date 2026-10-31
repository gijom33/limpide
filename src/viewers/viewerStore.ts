import { type DisplayValue, recall, remember } from '../app/displaySettings';
import type { KeyValueStorage } from '../app/storage';
import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { createCache } from '../music/cache';
import { type IdealPartial, idealFmKept, idealPartials } from '../music/idealReference';
import type { Patch } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import { type Overlay, toggleOverlay } from './overlays';
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

/** The Viewers' Display settings as they are kept (issue 85), besides the overlays. */
const savedOf = (settings: ViewSettings): DisplayValue<'viewer'> => ({
  cycles: settings.cycles,
  timelineSeconds: settings.timelineSeconds,
  frequencyScale: settings.viewer.frequencyScale,
  levelScale: settings.viewer.levelScale,
  tapSource: settings.viewer.tapSource,
});

/** Ideals kept per Patch, by the share of FM's depth their Note keeps and its Gate: a few Notes' worth. */
const KEPT_IDEALS = 16;

/**
 * The Ideal Reference at the Oscillator Tap's level: the same series the engine plays, scaled by the Nominal Level, at
 * the share of FM's depth the Note keeps (issue 103; to a thousandth, so a Note held reuses its Ideal every frame) and
 * whether its Gate is on, Osc 2 resting where the Filter Envelope holds it (issue 98).
 */
const idealOf = (patch: Patch): IdealAt => {
  const known = createCache<string, readonly IdealPartial[]>(KEPT_IDEALS);
  // The last Note's answer: every Spectrum asks every frame, and the kept depth is a search (fmDepthKept).
  let last: { fundamental: number; sampleRate: number; gateOn: boolean; ideal: readonly IdealPartial[] } | undefined;
  return (fundamental, sampleRate, gateOn = false) => {
    if (last?.fundamental === fundamental && last.sampleRate === sampleRate && last.gateOn === gateOn) return last.ideal;
    const kept = Math.round(idealFmKept(patch, fundamental, sampleRate) * 1000) / 1000;
    const ideal = known.get(`${kept} ${gateOn}`, () =>
      idealPartials(patch, IDEAL_HARMONICS, { fmKept: kept, gateOn }).map((p) => ({ ...p, level: p.level * OSCILLATOR_LEVEL })),
    );
    last = { fundamental, sampleRate, gateOn, ideal };
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
  const { cycles, timelineSeconds, frequencyScale, levelScale, tapSource } = recall(storage, 'viewer');
  let settings: ViewSettings = {
    cycles,
    timelineSeconds,
    ideal: idealOf(patches.get().patch),
    overlays: recall(storage, 'overlays'),
    viewer: { ...INITIAL_VIEWER_STATE, frequencyScale, levelScale, tapSource },
  };
  const listeners = new Set<() => void>();
  const set = (next: ViewSettings) => {
    const before = settings;
    settings = next;
    // Kept only when they change: the Ideal follows every turn of a knob, and storage need not.
    if (next.overlays !== before.overlays) remember(storage, 'overlays', next.overlays);
    const saved = savedOf(next);
    if (JSON.stringify(saved) !== JSON.stringify(savedOf(before))) remember(storage, 'viewer', saved);
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
