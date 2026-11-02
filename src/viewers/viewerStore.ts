import { type RememberedValue, recall, remember } from '../app/rememberedSettings';
import type { KeyValueStorage } from '../app/storage';
import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { createCache } from '../music/cache';
import { type IdealNote, type IdealPartial, idealFmKept, idealPartials } from '../music/idealReference';
import type { Patch } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import { SPECTRUM_TOP } from './axes';
import { guideLevel } from './guides';
import { type Overlay, toggleOverlay } from './overlays';
import { INITIAL_VIEWER_STATE, type TapSource, type ViewerAction, viewerReducer } from './viewerState';
import type { IdealAt, ViewSettings } from './viewSettings';

/** Every way the Viewer settings change: the reducer's, and the Scope's cycles and Glow, the Timeline's length, the overlays. */
export type ViewSettingsAction =
  | ViewerAction
  | { type: 'setCycles'; cycles: ViewSettings['cycles'] }
  | { type: 'setGlow'; glow: boolean }
  | { type: 'setTimelineSeconds'; seconds: ViewSettings['timelineSeconds'] }
  | { type: 'toggleOverlay'; overlay: Overlay }
  /** A Tutorial's Display Step, done for the person: the overlay on, whatever it was. */
  | { type: 'showOverlay'; overlay: Overlay }
  /** A Tutorial's Display Step coming with its overlay on: off, for the person to turn on (issue 158). */
  | { type: 'hideOverlay'; overlay: Overlay };

export type ViewerStore = ReturnType<typeof createViewerStore>;

/** How many Harmonics of the Note the Ideal Reference counts. */
const IDEAL_HARMONICS = 256;

/** The Viewers' Display settings as they are kept (issue 85), besides the overlays. */
const savedOf = (settings: ViewSettings): RememberedValue<'viewer'> => ({
  cycles: settings.cycles,
  timelineSeconds: settings.timelineSeconds,
  glow: settings.glow,
  frequencyScale: settings.viewer.frequencyScale,
  levelScale: settings.viewer.levelScale,
  tapSource: settings.viewer.tapSource,
});

/** Ideals kept per Patch, by the share of FM's depth their Note keeps and its Gate: a few Notes' worth. */
const KEPT_IDEALS = 16;
/** What an Ideal is kept by, for one Patch: its Note's share of FM's depth kept, its Gate and the top worked out to. */
type IdealKey = `${number} ${boolean} ${number}`;
const idealKey = ({ fmKept, gateOn, top }: Required<IdealNote>): IdealKey => `${fmKept} ${gateOn} ${top}`;

/**
 * The Ideal Reference at the Oscillator Tap's level: the same series the engine plays, scaled by the Nominal Level, at
 * the share of FM's depth the Note keeps (issue 103; to a thousandth, so a Note held reuses its Ideal every frame) and
 * whether its Gate is on, Osc 2 resting where the Filter Envelope holds it (issue 98). FM and Ring are worked out up
 * to the Harmonic the Spectrum's top reaches, and no further (issue 166): Notes whose top is the same Harmonic share it.
 */
const idealOf = (patch: Patch): IdealAt => {
  const known = createCache<IdealKey, readonly IdealPartial[]>(KEPT_IDEALS);
  // The last Note's answer: every Spectrum asks every frame, and the kept depth is a search (fmDepthKept).
  let last: { fundamental: number; sampleRate: number; gateOn: boolean; ideal: readonly IdealPartial[] } | undefined;
  return (fundamental, sampleRate, gateOn = false) => {
    if (last?.fundamental === fundamental && last.sampleRate === sampleRate && last.gateOn === gateOn) return last.ideal;
    const kept = Math.round(idealFmKept(patch, fundamental, sampleRate) * 1000) / 1000;
    const top = Math.min(IDEAL_HARMONICS, Math.ceil(SPECTRUM_TOP / fundamental));
    const note = { fmKept: kept, gateOn, top };
    const ideal = known.get(idealKey(note), () => idealPartials(patch, IDEAL_HARMONICS, note).map((p) => ({ ...p, level: p.level * OSCILLATOR_LEVEL })));
    last = { fundamental, sampleRate, gateOn, ideal };
    return ideal;
  };
};

function reduce(settings: ViewSettings, action: ViewSettingsAction): ViewSettings {
  switch (action.type) {
    case 'setCycles':
      return { ...settings, cycles: action.cycles };
    case 'setGlow':
      return { ...settings, glow: action.glow };
    case 'setTimelineSeconds':
      return { ...settings, timelineSeconds: action.seconds };
    case 'toggleOverlay':
      return { ...settings, overlays: toggleOverlay(settings.overlays, action.overlay) };
    case 'showOverlay':
      return settings.overlays[action.overlay] ? settings : { ...settings, overlays: { ...settings.overlays, [action.overlay]: true } };
    case 'hideOverlay':
      return settings.overlays[action.overlay] ? { ...settings, overlays: { ...settings.overlays, [action.overlay]: false } } : settings;
    default:
      return { ...settings, viewer: viewerReducer(settings.viewer, action) };
  }
}

/**
 * The settings the Viewers read every frame (issue 77), outside React as the Patch is (ADR-0013): the render loop
 * reads `get`, React subscribes, and `dispatch` is the one way to change them. Every Display setting is saved and a new
 * page starts from it (issue 85), never Freeze or the Snapshot, which are moments; the Amp Tap's source goes to the
 * engine as soon as it changes; the Ideal Reference and the Guides follow every change to the Patch.
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
  const { cycles, timelineSeconds, glow, frequencyScale, levelScale, tapSource } = recall(storage, 'viewer');
  let settings: ViewSettings = {
    cycles,
    timelineSeconds,
    glow,
    ideal: idealOf(patches.get().patch),
    guideLevel: guideLevel(patches.get().patch),
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
  patches.subscribe(({ after }) => set({ ...settings, ideal: idealOf(after), guideLevel: guideLevel(after) }));

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
