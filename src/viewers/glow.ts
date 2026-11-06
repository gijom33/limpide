import { createFreezeLatch } from './freezeLatch';

/** Display's Glow (issue 229, decided by the owner): none, on the Scopes alone, or on the Scopes and the Spectrums. */
export const GLOWS = ['off', 'scopes', 'all'] as const;
export type Glow = (typeof GLOWS)[number];

/** Whether a Viewer's past traces glow: a Scope's under Scopes or All, a Spectrum's under All alone. */
export const glows = (glow: Glow, viewer: 'scope' | 'spectrum'): boolean => (viewer === 'scope' ? glow !== 'off' : glow === 'all');

// Glow (issue 180, decision 5; the Spectrums since issue 199): each trace fades as on an analogue scope, by 0.85 every
// 60th of a second whatever the screen's rate (halving in about 70 ms), and is dropped a quarter of a second old, at
// under a tenth. One trace is kept per 60th of a second, so a 120 Hz screen draws no more. Redrawn rather than faded
// on a layer, where rounding leaves a haze of every trace ever drawn.
const GLOW_DECAY = 0.85;
const GLOW_STEP_MS = 1000 / 60;
/** How long a trace glows: a Viewer silent for longer shows no trace of the sound before (issue 214). */
export const GLOW_MS = 250;

/**
 * A Viewer's Glow: called once a frame with its newest trace, it returns the past traces to draw under it, oldest
 * first, each with the opacity its age gives it. Off, it keeps none; frozen, it keeps the ones it had at the moment
 * of freezing, faded as they were then, so the frozen frame keeps its glow. `key` says what a trace was drawn for (a
 * Scope's cycles, a Spectrum's axis and width): one drawn for another is passed over, not drawn across the new width
 * (issues 199 and 228).
 */
export function createGlow<T>() {
  // Newest first, with when and what for.
  const ghosts: { value: T; at: number; key: string }[] = [];
  const frozenTime = createFreezeLatch<number>();
  return function glow({ on, frozen, now, newest, key }: { on: boolean; frozen: boolean; now: () => number; newest: T; key: string }) {
    const time = frozenTime(frozen, now);
    const stale = on ? ghosts.findIndex(({ at }) => time - at > GLOW_MS) : 0;
    if (stale >= 0) ghosts.splice(stale);
    const past = ghosts
      .filter((ghost) => ghost.key === key)
      .map(({ value, at }) => ({ value, alpha: GLOW_DECAY ** ((time - at) / GLOW_STEP_MS) }))
      .reverse();
    if (on && !frozen && (!ghosts.length || time - ghosts[0].at >= GLOW_STEP_MS * 0.9)) ghosts.unshift({ value: newest, at: time, key });
    return past;
  };
}
