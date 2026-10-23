import type { FrequencyScale, LevelScale } from './axes';

export type TapSource = 'newest' | 'all';

export interface ViewerState {
  /** Viewers hold their last frame while the sound keeps playing. */
  frozen: boolean;
  /** The Taps show the newest Note's Voice alone (the default), or every Voice summed (ADR-0007). */
  tapSource: TapSource;
  frequencyScale: FrequencyScale;
  levelScale: LevelScale;
  /**
   * Identifies the current Snapshot (null when none). Each Spectrum copies its own frame when this changes,
   * so the state stays small and the spectra never pass through React.
   */
  snapshot: number | null;
}

export type ViewerAction =
  | { type: 'toggleFreeze' }
  | { type: 'setFrequencyScale'; scale: FrequencyScale }
  | { type: 'setLevelScale'; scale: LevelScale }
  | { type: 'takeSnapshot' }
  | { type: 'clearSnapshot' }
  | { type: 'setTapSource'; source: TapSource };

export const INITIAL_VIEWER_STATE: ViewerState = { frozen: false, tapSource: 'newest', frequencyScale: 'log', levelScale: 'db', snapshot: null };

export function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case 'toggleFreeze':
      return { ...state, frozen: !state.frozen };
    case 'setFrequencyScale':
      return { ...state, frequencyScale: action.scale };
    case 'setTapSource':
      return { ...state, tapSource: action.source };
    case 'setLevelScale':
      return { ...state, levelScale: action.scale };
    case 'takeSnapshot':
      return { ...state, snapshot: (state.snapshot ?? 0) + 1 };
    case 'clearSnapshot':
      return { ...state, snapshot: null };
  }
}
