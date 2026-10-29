import type { IdealPartial } from '../music/idealReference';
import type { Overlays } from './overlays';
import type { ViewerState } from './viewerState';

/** Settings the Viewers read every frame, kept by the Viewer settings store (issue 77): the render loop reads them, React subscribes. */
export interface ViewSettings {
  /** Cycles of the Note shown in each Scope. */
  cycles: 1 | 2 | 4;
  /** Seconds of the Envelope Timeline, "now" at its right edge (the owner, 2026-10-28: 2 by default). */
  timelineSeconds: 1 | 2 | 3 | 4;
  /** The Ideal Reference: each Oscillator's Harmonics at the Oscillator Tap's level, or undefined to hide it. */
  ideal?: readonly IdealPartial[];
  /** Which marks are switched on. */
  overlays: Overlays;
  /** Freeze, axes and Snapshot. */
  viewer: ViewerState;
}
