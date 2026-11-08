import { useState } from 'react';
import type { Patch } from '../../patch/patch';

/**
 * Whether the Song's line invites flipping the Presets or turning a knob (issue 260): while the Song plays, until the
 * person changes the sound, as it asks; started again, it asks again. Not while a Tutorial guides the page, where a
 * Preset flipped would undo the Steps.
 */
export function useSongInvite(playing: boolean, patch: Patch, tutorialOpen: boolean): boolean {
  // The sound the Song started on: the line goes once it changes.
  const [from, setFrom] = useState<Patch | null>(null);
  if (playing && from === null) setFrom(patch);
  if (!playing && from !== null) setFrom(null);
  return playing && !tutorialOpen && (from ?? patch) === patch;
}
