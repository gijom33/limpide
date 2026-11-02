import { useEffect, useState } from 'react';
import { samePatch, sameSound } from '../../patch/patch';
import type { PatchStore } from '../../patch/patchStore';
import { PRESETS } from '../../patch/presets';

/** A Preset's about line: `text` what was loaded, said once with its name; `shown` while it stays under the name. */
export interface PresetAbout {
  text: string;
  shown: boolean;
}

/**
 * A loaded Preset's about line under the Patch name (issue 109, decision 3; issue 153): shown when the person picks a
 * Preset in the Patches panel, until any change to the sound (the keyboard octave is none, issue 126), another load, or
 * the person closes it (its × or Escape). The arrows and a Controller step through sounds to hear them and show none (the panel's tooltips hold every
 * Preset's line); the Demo and a Tutorial show none either, as they say what they load in their own captions and cards.
 */
export function usePresetAbout(patches: PatchStore) {
  const [about, setAbout] = useState<PresetAbout>({ text: '', shown: false });
  // Every change to the sound hides it; a load forgets its text too, so a screen reader is told it only with the load
  // that shows it. The octave buttons leave it: they move the keys, not the sound.
  useEffect(
    () =>
      patches.subscribe(({ before, after, by }) => {
        if (by === 'load') setAbout({ text: '', shown: false });
        else if (!sameSound(before, after)) setAbout(hidden);
      }),
    [patches],
  );
  /** After the person's pick: the about line of the Preset loaded, if it is one, as it was. */
  const show = () => {
    const { name, patch } = patches.get();
    const preset = PRESETS.find((p) => p.name === name);
    if (preset && samePatch(preset.patch, patch)) setAbout({ text: preset.about, shown: true });
  };
  /** The person closes it. */
  const hide = () => setAbout(hidden);
  return { about, show, hide };
}

/** Hidden, its text kept: it was said once, with the load that showed it. */
const hidden = (a: PresetAbout): PresetAbout => (a.shown ? { ...a, shown: false } : a);
