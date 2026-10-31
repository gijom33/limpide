import { useEffect, useState } from 'react';
import type { PatchStore } from '../../patch/patchStore';
import { PRESETS } from '../../patch/presets';

/** A Preset's about line: `text` what was loaded, said once with its name; `shown` while it stays under the name. */
export interface PresetAbout {
  text: string;
  shown: boolean;
}

/**
 * A loaded Preset's about line under the Patch name (issue 109, decision 3): shown when the person loads a Preset (the
 * arrows, the Patches panel, a Controller), until any change to the sound or another load. The Demo's and a Tutorial's
 * loads show none: they say what they load in their own captions and cards.
 */
export function usePresetAbout(patches: PatchStore) {
  const [about, setAbout] = useState<PresetAbout>({ text: '', shown: false });
  // Every change hides it; a load forgets its text too, so a screen reader is told it only with the load that shows it.
  useEffect(
    () => patches.subscribe(({ by }) => setAbout((a) => (by === 'load' ? { text: '', shown: false } : a.shown ? { ...a, shown: false } : a))),
    [patches],
  );
  /** After the person's load: the about line of the Preset loaded, if it is one, as it was. */
  const show = () => {
    const { name, patch } = patches.get();
    const preset = PRESETS.find((p) => p.name === name);
    if (preset && JSON.stringify(preset.patch) === JSON.stringify(patch)) setAbout({ text: preset.about, shown: true });
  };
  return { about, show };
}
