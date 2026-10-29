import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { idealPartials } from '../music/idealReference';
import type { Patch } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import { loadOverlays, type Overlay, saveOverlays, toggleOverlay } from './overlays';
import { INITIAL_VIEWER_STATE, type TapSource, type ViewerAction, viewerReducer } from './viewerState';
import type { ViewSettings } from './viewSettings';

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
/** The Ideal Reference at the Oscillator Tap's level: the same series the engine plays, scaled by the Nominal Level. */
const idealOf = (patch: Patch) => idealPartials(patch, IDEAL_HARMONICS).map((p) => ({ ...p, level: p.level * OSCILLATOR_LEVEL }));

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
 * reads `get`, React subscribes, and `dispatch` is the one way to change them. Only the overlays are saved; the Amp
 * Tap's source goes to the engine as soon as it changes; the Ideal Reference follows every change to the Patch.
 */
export function createViewerStore({
  storage,
  patches,
  setTapSource,
}: {
  storage: Parameters<typeof loadOverlays>[0];
  patches: Pick<PatchStore, 'get' | 'subscribe'>;
  setTapSource(source: TapSource): void;
}) {
  let settings: ViewSettings = {
    cycles: 2,
    timelineSeconds: 2,
    ideal: idealOf(patches.get().patch),
    overlays: loadOverlays(storage),
    viewer: INITIAL_VIEWER_STATE,
  };
  const listeners = new Set<() => void>();
  const set = (next: ViewSettings) => {
    const before = settings;
    settings = next;
    if (next.overlays !== before.overlays) saveOverlays(storage, next.overlays);
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
