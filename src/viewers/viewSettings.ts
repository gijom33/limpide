import type { IdealPartial } from '../music/idealReference';
import type { Overlays } from './overlays';
import type { ViewerState } from './viewerState';

export type IdealAt = (fundamental: number, sampleRate: number) => readonly IdealPartial[];

/** Settings the Viewers read every frame, kept by the Viewer settings store (issue 77): the render loop reads them, React subscribes. */
export interface ViewSettings {
  /** Cycles of the Note shown in each Scope. */
  cycles: 1 | 2 | 4;
  /** Seconds of the Envelope Timeline, "now" at its right edge (the owner, 2026-10-28: 2 by default). */
  timelineSeconds: 1 | 2 | 3 | 4;
  /**
   * The Ideal Reference on a Note whose fundamental is `fundamental` Hz, on a device of `sampleRate` (FM's depth kept
   * under the top as the engine keeps it, issue 103): each Oscillator's Harmonics at the Oscillator Tap's level.
   */
  ideal?: IdealAt;
  /** Which marks are switched on. */
  overlays: Overlays;
  /** Freeze, axes and Snapshot. */
  viewer: ViewerState;
}
