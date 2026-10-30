import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { createLibrary } from './library';
import { defaultPatch, type Patch, setParam } from './patch';
import { createPatchStore } from './patchStore';
import { PRESETS } from './presets';
import { shareHash } from './serialize';

/** A store on a page opened at `hash`, with `lastSession` autosaved by an earlier visit, if any. */
const setup = ({ hash = '', lastSession }: { hash?: string; lastSession?: Patch } = {}) => {
  const heard: string[] = [];
  const applied: Patch[] = [];
  const library = createLibrary(memoryStorage());
  if (lastSession) library.saveCurrent(lastSession);
  const store = createPatchStore({
    hash,
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

  it('starts on a Share link’s Patch, and the engine hears it at once (the code review of issues 73 to 79)', () => {
    const { store, applied } = setup({ hash: `#${shareHash(PRESETS[3].patch, 'Dark & low')}`, lastSession: PRESETS[5].patch });
    expect(store.get()).toEqual({ patch: PRESETS[3].patch, name: 'Dark & low', changed: false });
    expect(store.shared).toBe(true);
    expect(applied).toEqual([PRESETS[3].patch]);
  });

  it('starts on the Last session without a Share link, and on Init on a first visit (the code review of issues 73 to 79)', () => {
    const last = setup({ lastSession: PRESETS[5].patch }).store;
    expect(last.get()).toMatchObject({ patch: PRESETS[5].patch, name: 'Last session' });
    expect(last.shared).toBe(false);
    expect(setup().store.get()).toMatchObject({ patch: defaultPatch(), name: 'Init' });
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

  it('does not count the keyboard octave alone as a change from the Patch loaded (issue 126)', () => {
    const { store } = setup();
    const bass = PRESETS.find((p) => p.patch.keyboardOctave === 2)!;
    store.load(bass.name, bass.patch);
    store.change((p) => ({ ...p, keyboardOctave: 4 }), 'hand');
    expect(store.get()).toMatchObject({ name: bass.name, changed: false, patch: { keyboardOctave: 4 } });
    store.change((p) => setParam(p, 'cutoff', 500), 'hand');
    expect(store.get().changed).toBe(true);
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
