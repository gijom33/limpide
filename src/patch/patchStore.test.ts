import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { createLibrary } from './library';
import { defaultPatch, type Patch, setParam } from './patch';
import { createPatchStore } from './patchStore';
import { PRESETS } from './presets';

const setup = (start = { patch: defaultPatch(), name: 'Init' }) => {
  const heard: string[] = [];
  const applied: Patch[] = [];
  const library = createLibrary(memoryStorage());
  const store = createPatchStore({
    start,
    library,
    apply: (patch) => {
      applied.push(patch);
      heard.push('engine');
    },
  });
  store.subscribe(() => heard.push('subscriber'));
  return { store, applied, heard, library };
};

describe('The Patch store (issue 73)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts on the Patch it is given, and the engine hears it at once', () => {
    const start = { patch: PRESETS[3].patch, name: PRESETS[3].name };
    const { store, applied } = setup(start);
    expect(store.get()).toEqual({ patch: start.patch, name: start.name, changed: false });
    expect(applied).toEqual([start.patch]);
  });

  it('hands every change to the engine before its subscribers, whoever made it', () => {
    const { store, applied, heard } = setup();
    heard.length = 0;
    store.change((p) => setParam(p, 'cutoff', 500), 'hand');
    store.change((p) => setParam(p, 'resonance', 0.5), 'controller');
    store.change((p) => setParam(p, 'glide', 0.2), 'demo');
    store.change((p) => setParam(p, 'osc2Detune', 7), 'tutorial');
    store.load(PRESETS[1].name, PRESETS[1].patch);
    expect(heard).toEqual(Array.from({ length: 5 }, () => ['engine', 'subscriber']).flat());
    expect(applied.at(-2)).toMatchObject({ cutoff: 500, resonance: 0.5, glide: 0.2, osc2Detune: 7 });
    expect(applied.at(-1)).toBe(PRESETS[1].patch);
  });

  it("gives a Controller's move to the engine and to the next read without waiting for a render", () => {
    const { store, applied } = setup();
    store.change((p) => setParam(p, 'cutoff', 300), 'controller');
    store.change((p) => setParam(p, 'cutoff', store.get().patch.cutoff * 2), 'controller');
    expect(applied.at(-1)?.cutoff).toBe(600);
    expect(store.get().patch.cutoff).toBe(600);
  });

  it("steps twice when a Controller's pad steps twice before a render", () => {
    const { store, applied } = setup();
    store.step(1);
    store.step(1);
    expect(store.get().name).toBe(PRESETS[2].name);
    expect(applied.at(-1)).toBe(PRESETS[2].patch);
    store.step(-3);
    expect(store.get().name).toBe(PRESETS.at(-1)?.name);
  });

  it('says the Patch has changed after a change, and not after a load', () => {
    const { store } = setup();
    store.change((p) => setParam(p, 'cutoff', 500), 'hand');
    expect(store.get().changed).toBe(true);
    store.change((p) => setParam(p, 'cutoff', defaultPatch().cutoff), 'hand');
    expect(store.get().changed).toBe(false); // back to what was loaded
    store.change((p) => setParam(p, 'cutoff', 500), 'hand');
    store.load('Mine', store.get().patch);
    expect(store.get()).toMatchObject({ name: 'Mine', changed: false });
  });

  it('keeps the same read between changes, as React needs, and a new one after', () => {
    const { store } = setup();
    const first = store.get();
    expect(store.get()).toBe(first);
    store.change((p) => setParam(p, 'cutoff', 500), 'hand');
    expect(store.get()).not.toBe(first);
  });

  it('reports who made each change, with the Patch before and after', () => {
    const { store } = setup();
    const changes: unknown[] = [];
    store.subscribe((change) => changes.push(change));
    const before = store.get().patch;
    store.change((p) => setParam(p, 'cutoff', 500), 'controller');
    store.load(PRESETS[1].name, PRESETS[1].patch);
    expect(changes).toEqual([
      { before, after: setParam(before, 'cutoff', 500), by: 'controller' },
      { before: setParam(before, 'cutoff', 500), after: PRESETS[1].patch, by: 'load' },
    ]);
  });

  it('autosaves the Last session a moment after the start and after changes, not on every change', () => {
    const { store, library } = setup();
    expect(library.loadCurrent()).toBeUndefined();
    vi.advanceTimersByTime(300);
    expect(library.loadCurrent()).toEqual(defaultPatch());
    for (let cutoff = 100; cutoff <= 1000; cutoff += 100) {
      store.change((p) => setParam(p, 'cutoff', cutoff), 'hand');
      vi.advanceTimersByTime(100);
    }
    expect(library.loadCurrent()?.cutoff).toBe(defaultPatch().cutoff);
    vi.advanceTimersByTime(300);
    expect(library.loadCurrent()?.cutoff).toBe(1000);
  });

  it('stops telling a subscriber that unsubscribed', () => {
    const { store } = setup();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.change((p) => setParam(p, 'cutoff', 500), 'hand');
    expect(listener).not.toHaveBeenCalled();
  });
});
