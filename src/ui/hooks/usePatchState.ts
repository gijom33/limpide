import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyValueStorage } from '../../app/storage';
import { createLibrary } from '../../patch/library';
import type { Patch } from '../../patch/patch';
import { initialPatch, presetAfter } from '../../patch/presets';

/**
 * The Patch being played, its name, and what it was when loaded or saved ("changed" against that); the library it is
 * saved to, autosaved as you play. A Share link's Patch, else last session's, else Init.
 *
 * `patchRef` is always the Patch now, even between renders: MIDI messages and the players read and write it there.
 */
export function usePatchState(storage: KeyValueStorage) {
  const library = useMemo(() => createLibrary(storage), [storage]);
  const [start] = useState(() => initialPatch(location.hash, library));
  const [patch, setPatch] = useState(start.patch);
  const [patchName, setPatchName] = useState(start.name);
  const [baseline, setBaseline] = useState(start.patch);
  const patchRef = useRef(patch);
  patchRef.current = patch;
  const patchNameRef = useRef(patchName);
  patchNameRef.current = patchName;

  /** Load a Patch and make it the new baseline for "changed". */
  const loadPatch = (name: string, next: Patch) => {
    setPatch(next);
    setPatchName(name);
    setBaseline(next);
  };
  /** The next or previous Preset, from the one just chosen, even before React has re-rendered (a Controller's pads). */
  const stepPreset = (delta: number) => {
    const preset = presetAfter(patchNameRef.current, delta);
    patchNameRef.current = preset.name;
    patchRef.current = preset.patch;
    loadPatch(preset.name, preset.patch);
  };

  useEffect(() => {
    // A share link has done its job once loaded; drop it so a reload keeps later edits (autosaved).
    if (location.hash.startsWith('#p=')) history.replaceState(null, '', location.pathname + location.search);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => library.saveCurrent(patch), 300);
    return () => clearTimeout(timer);
  }, [library, patch]);

  const changed = JSON.stringify(patch) !== JSON.stringify(baseline);
  return { library, start, patch, setPatch, patchRef, patchName, loadPatch, stepPreset, changed };
}
