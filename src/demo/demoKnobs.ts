import { PARAMS, type ParamId, type Patch, setParam } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import type { Preset } from '../patch/presets';

const PARAM_IDS = Object.keys(PARAMS) as ParamId[];

/**
 * The Demo's hand on the Patch. A knob turned by hand or by a Controller while the Demo plays stays where it was put
 * until the Demo's next part: the Demo's own moves skip it. Made when the Demo starts, stopped when it stops.
 */
export function createDemoKnobs(store: PatchStore) {
  const turned = new Set<ParamId>();
  const stop = store.subscribe(({ before, after, by }) => {
    if (by !== 'hand' && by !== 'controller') return;
    for (const id of PARAM_IDS) if (before[id] !== after[id]) turned.add(id);
  });
  return {
    /** A new part: every knob is the Demo's again. Loads the part's Preset, if it has one; returns the Patch now. */
    newPart(preset?: Preset): Patch {
      turned.clear();
      if (preset) store.load(preset.name, preset.patch);
      return store.get().patch;
    },
    turn(id: ParamId, value: number) {
      if (!turned.has(id)) store.change((p) => setParam(p, id, value), 'demo');
    },
    stop,
  };
}
