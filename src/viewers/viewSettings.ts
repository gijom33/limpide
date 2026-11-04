import type { IdealPartial } from '../music/idealReference';
import type { Glow } from './glow';
import type { Overlays } from './overlays';
import type { ViewerState } from './viewerState';

/** The Ideal for a Note of `fundamental` Hz on a device of `sampleRate`, while its Gate is on or after (issue 98). */
export type IdealAt = (fundamental: number, sampleRate: number, gateOn?: boolean) => readonly IdealPartial[];

/** Settings the Viewers read every frame, kept by the Viewer settings store (issue 77): the render loop reads them, React subscribes. */
export interface ViewSettings {
  /** Cycles of the Note shown in each Scope. */
  cycles: 1 | 2 | 4;
  /**
   * Past traces fade over a quarter of a second, as on an analogue scope (issue 180, decision 5): none Off, each
   * Scope's under Scopes, each Scope's and each Spectrum's outline under All (issues 199, 229).
   */
  glow: Glow;
  /** Seconds of the Envelope Timeline, "now" at its right edge (the owner, 2026-10-28: 2 by default). */
  timelineSeconds: 1 | 2 | 3 | 4;
  /**
   * The Ideal Reference on a Note whose fundamental is `fundamental` Hz, on a device of `sampleRate` (FM's depth kept
   * under the top as the engine keeps it, issue 103): each Oscillator's Harmonics at the Oscillator Tap's level.
   */
  ideal?: IdealAt;
  /** Where the Scopes' Guides stand: the level the Mixer sends (guideLevel), following the Patch. */
  guideLevel: number;
  /** Which marks are switched on. */
  overlays: Overlays;
  /** Freeze, axes and Snapshot. */
  viewer: ViewerState;
}
