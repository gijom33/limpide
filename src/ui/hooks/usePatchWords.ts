import { useEffect, useRef, useState } from 'react';
import { describePatch } from '../../patch/describe';
import { type Patch, sameSound } from '../../patch/patch';
import { PRESETS } from '../../patch/presets';

/** The line follows the knobs at most this often, in ms: a few times a second, so it reads while a knob turns. */
export const WORDS_EVERY = 250;

/**
 * The Patch in plain words under its name (issue 123), once it is not a Preset as loaded: after the first change to the
 * sound, or for a saved, imported or shared Patch or the last session. A Preset as loaded shows none: its own about
 * line says it (issue 153). The keyboard octave is no change: it says where the keys start, not the sound (issue 126),
 * so the octave buttons bring no words. Following the knobs, but not more often than `WORDS_EVERY`; gone at once on a
 * load.
 */
export function usePatchWords(name: string, patch: Patch, bpm: number): string {
  const preset = PRESETS.find((p) => p.name === name);
  const target = preset && sameSound(preset.patch, patch) ? '' : describePatch(patch, bpm);
  const [shown, setShown] = useState(target);
  const last = useRef(0);
  useEffect(() => {
    if (target === shown) return;
    if (!target) return setShown('');
    // Every change asks again by the same moment: the last showing plus the interval.
    const timer = setTimeout(
      () => {
        last.current = performance.now();
        setShown(target);
      },
      Math.max(0, last.current + WORDS_EVERY - performance.now()),
    );
    return () => clearTimeout(timer);
  }, [target, shown]);
  return shown;
}
