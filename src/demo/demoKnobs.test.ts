import { describe, expect, it } from 'vitest';
import { createLibrary } from '../patch/library';
import { setLfo, setParam } from '../patch/patch';
import { createPatchStore } from '../patch/patchStore';
import { PRESETS } from '../patch/presets';
import { memoryStorage } from '../test/memoryStorage';
import { createDemoKnobs } from './demoKnobs';

const setup = () => {
  const store = createPatchStore({ hash: '', library: createLibrary(memoryStorage()), apply: () => {} });
  return { store, knobs: createDemoKnobs(store) };
};

describe("The Demo's knobs (issue 73)", () => {
  it('turns a knob, as the Demo', () => {
    const { store, knobs } = setup();
    const by: string[] = [];
    store.subscribe((change) => by.push(change.by));
    knobs.turn('cutoff', 500);
    expect(store.get().patch.cutoff).toBe(500);
    expect(by).toEqual(['demo']);
  });

  it('leaves a knob turned by hand, or by a Controller, where it was put until the next part', () => {
    const { store, knobs } = setup();
    knobs.newPart(PRESETS[1]);
    store.change((p) => setParam(p, 'cutoff', 300), 'hand');
    store.change((p) => setParam(p, 'resonance', 0.9), 'controller');
    knobs.turn('cutoff', 5000);
    knobs.turn('resonance', 0.1);
    knobs.turn('glide', 0.3);
    expect(store.get().patch).toMatchObject({ cutoff: 300, resonance: 0.9, glide: 0.3 });
    knobs.newPart(PRESETS[2]);
    knobs.turn('cutoff', 5000);
    expect(store.get().patch.cutoff).toBe(5000);
  });

  it("does not count the Demo's own moves, a Tutorial's or a load as turned by hand", () => {
    const { store, knobs } = setup();
    knobs.turn('cutoff', 300);
    store.change((p) => setParam(p, 'resonance', 0.9), 'tutorial');
    store.load('Mine', setParam(store.get().patch, 'glide', 0.5));
    knobs.turn('cutoff', 5000);
    knobs.turn('resonance', 0.1);
    knobs.turn('glide', 0.1);
    expect(store.get().patch).toMatchObject({ cutoff: 5000, resonance: 0.1, glide: 0.1 });
  });

  it('counts only the Parameters a change by hand moved', () => {
    const { store, knobs } = setup();
    store.change((p) => setLfo(p, { destination: 'pitch' }), 'hand');
    knobs.turn('lfoAmount', 0.5);
    expect(store.get().patch.lfoAmount).toBe(0.5);
  });

  it('loads the next part, or keeps the Patch loaded now for a riff on a shared sound', () => {
    const { store, knobs } = setup();
    expect(knobs.newPart(PRESETS[4])).toBe(PRESETS[4].patch);
    expect(store.get().name).toBe(PRESETS[4].name);
    store.change((p) => setParam(p, 'cutoff', 300), 'hand');
    const now = store.get().patch;
    expect(knobs.newPart()).toBe(now);
    knobs.turn('cutoff', 5000);
    expect(store.get().patch.cutoff).toBe(5000); // a new part, so the hand's turn is forgotten
  });

  it('stops listening once the Demo stops', () => {
    const { store, knobs } = setup();
    knobs.stop();
    store.change((p) => setParam(p, 'cutoff', 300), 'hand');
    knobs.turn('cutoff', 5000);
    expect(store.get().patch.cutoff).toBe(5000);
  });
});
