import { NOISE_PEAK, OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { MIXER_LEVELS, type Patch } from '../patch/patch';

/**
 * Where the Scopes' Guides stand (issue 159): the level the Mixer sends, every source at its fader's level added, as
 * the engine scales each by the Nominal Level, the Noise at its colour's peak. One Oscillator at full puts them at the
 * Nominal Level; they never go past full scale, and with nothing up they stay at the Nominal Level rather than vanish.
 */
export function guideLevel(patch: Patch): number {
  const peak = (id: (typeof MIXER_LEVELS)[number]) => (id === 'mixNoise' ? NOISE_PEAK[patch.noiseColour] : 1);
  const sum = MIXER_LEVELS.reduce((total, id) => total + patch[id] * peak(id), 0) * OSCILLATOR_LEVEL;
  return sum > 0 ? Math.min(1, sum) : OSCILLATOR_LEVEL;
}

// The Guides' glide: a time constant short enough to follow a fader's drag, long enough to be seen moving.
const GLIDE_MS = 35;
// Closer than this, a fraction of a pixel on any Scope, they are there.
const ARRIVED = 0.001;

/**
 * The Guides' level frame by frame (issue 159): from where they stand to the Mixer's level, smoothly, as a value
 * moves, arriving in about a fifth of a second; with reduced motion asked for (`still`) they jump. `now` in ms.
 */
export function createGuideGlide() {
  let level: number | null = null;
  let at = 0;
  return (target: number, now: number, still: boolean): number => {
    const dt = Math.max(0, now - at);
    at = now;
    if (level === null || still) level = target;
    else level = target + (level - target) * Math.exp(-dt / GLIDE_MS);
    if (Math.abs(level - target) < ARRIVED) level = target;
    return level;
  };
}
