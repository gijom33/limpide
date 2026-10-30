import type { Library } from './library';
import type { Patch } from './patch';
import { initialPatch, presetAfter } from './presets';

/** Who made a change: the Demo's "turned by hand" listens for a hand's or a Controller's. */
export type ChangeBy = 'hand' | 'controller' | 'demo' | 'tutorial' | 'load';

/** The Patch being played, its name, and whether its sound differs from what it was when loaded or saved. */
export interface PatchNow {
  patch: Patch;
  name: string;
  changed: boolean;
}

export interface PatchChange {
  before: Patch;
  after: Patch;
  by: ChangeBy;
}

export type PatchStore = ReturnType<typeof createPatchStore>;

const AUTOSAVE_MS = 300;

/** The Patch as "changed" compares it: the keyboard octave left out, the octave buttons' to write (issue 126). */
const sound = ({ keyboardOctave: _, ...rest }: Patch) => JSON.stringify(rest);

/**
 * The Patch being played, outside React (ADR-0013). Every change goes to `apply` (the engine and the Note input) at
 * once, before any subscriber hears of it, so a Controller's move or the Demo's reaches the sound without waiting for a
 * render. It starts on the Share link's Patch in `hash`, else the Last session, else Init. The Last session is autosaved
 * a moment after the start and after each run of changes.
 */
export function createPatchStore({ hash, library, apply }: { hash: string; library: Library; apply(patch: Patch): void }) {
  const start = initialPatch(hash, library);
  let baseline = start.patch;
  let now: PatchNow = { patch: start.patch, name: start.name, changed: false };
  const listeners = new Set<(change: PatchChange) => void>();
  let autosave: ReturnType<typeof setTimeout> | undefined;
  const saveSoon = () => {
    clearTimeout(autosave);
    autosave = setTimeout(() => library.saveCurrent(now.patch), AUTOSAVE_MS);
  };

  const set = (after: Patch, name: string, by: ChangeBy) => {
    const before = now.patch;
    apply(after);
    now = { patch: after, name, changed: sound(after) !== sound(baseline) };
    saveSoon();
    for (const listener of listeners) listener({ before, after, by });
  };
  const load = (name: string, patch: Patch) => {
    baseline = patch;
    set(patch, name, 'load');
  };

  apply(start.patch);
  saveSoon();

  return {
    /** Whether the page opened on a Share link's Patch. */
    shared: start.shared,
    get: (): PatchNow => now,
    /** The Patch changed by one of the Patch module's functions (`setParam`, `setLfo`…), and who changed it. */
    change(edit: (patch: Patch) => Patch, by: Exclude<ChangeBy, 'load'>) {
      set(edit(now.patch), now.name, by);
    },
    /** A Patch loaded under a name, which becomes what "changed" compares against. */
    load,
    /** The next (+1) or previous (−1) Preset from the one loaded now, even twice before a render (a Controller's pads). */
    step(delta: number) {
      const preset = presetAfter(now.name, delta);
      load(preset.name, preset.patch);
    },
    subscribe(listener: (change: PatchChange) => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
