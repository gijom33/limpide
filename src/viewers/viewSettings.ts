import type { IdealPartial } from '../music/idealReference';
import type { Overlays } from './overlays';
import type { ViewerState } from './viewerState';

/** Settings the Viewers read every frame (React writes them; the render loop never re-mounts for them). */
export interface ViewSettings {
  /** Cycles of the Note shown in each Scope. */
  cycles: 1 | 2 | 4;
  /** The Ideal Reference: each Oscillator's Harmonics at the Oscillator Tap's level, or undefined to hide it. */
  ideal?: readonly IdealPartial[];
  /** Which marks are switched on. */
  overlays: Overlays;
  /** Freeze, axes and Snapshot. */
  viewer: ViewerState;
}
