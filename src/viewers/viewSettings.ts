import type { Overlays } from './overlays';

/** Settings the Viewers read every frame (React writes them; the render loop never re-mounts for them). */
export interface ViewSettings {
  /** Cycles of the Note shown in each Scope. */
  cycles: 1 | 2 | 4;
  /** Ideal Reference amplitudes per Harmonic (at the Oscillator Tap's level), or undefined to hide it. */
  ideal?: Float32Array;
  /** Which marks are switched on. */
  overlays: Overlays;
}
