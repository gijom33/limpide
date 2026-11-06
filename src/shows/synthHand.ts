import { type LfoNumber, type ParamId, type Patch, setLfo, setParam } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import type { Preset } from '../patch/presets';

/** The Patch with these values, a knob's kept in its range. */
export function withValues(patch: Patch, values: Partial<Patch>): Patch {
  let next = { ...patch, ...values };
  for (const [id, value] of Object.entries(values)) if (typeof value === 'number') next = setParam(next, id as ParamId, value);
  return next;
}

/**
 * The synth's hand on the Patch, the Demo's knobs and the Tour's controls alike (issue 243, decision 6). A control
 * turned by hand or by a Controller while its Show plays stays where it was put until the next part or card: the
 * synth's own moves skip it. Made when the Show starts or its card comes up, stopped when it stops.
 */
export function createSynthHand(store: PatchStore, by: 'demo' | 'tour') {
  const taken = new Set<keyof Patch>();
  const stop = store.subscribe(({ before, after, by: who }) => {
    if (who !== 'hand' && who !== 'controller') return;
    for (const key of Object.keys(after) as (keyof Patch)[]) if (before[key] !== after[key]) taken.add(key);
  });
  return {
    /**
     * A new part: every control is the synth's again. Loads the part's Preset, if it has one, with Sync on for the LFOs
     * it plays in note values (issue 112); returns the Patch now.
     */
    newPart(preset?: Preset, synced: readonly LfoNumber[] = []): Patch {
      taken.clear();
      if (preset) store.load(preset.name, preset.patch);
      if (synced.length) store.change((p) => synced.reduce((q, lfo) => setLfo(q, { sync: 'on' }, lfo), p), by);
      return store.get().patch;
    },
    /** The controls moved to these values in one change, but those the person has taken. */
    turn(values: Partial<Patch>) {
      const patch = store.get().patch;
      const due = Object.fromEntries(Object.entries(values).filter(([id, value]) => !taken.has(id as keyof Patch) && patch[id as keyof Patch] !== value));
      if (Object.keys(due).length) store.change((p) => withValues(p, due), by);
    },
    stop,
  };
}
