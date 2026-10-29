import { describe, expect, it } from 'vitest';
import { createLibrary } from '../patch/library';
import { setParam } from '../patch/patch';
import { createPatchStore } from '../patch/patchStore';
import { memoryStorage } from '../test/memoryStorage';
import { DEFAULT_OVERLAYS } from './overlays';
import type { TapSource } from './viewerState';
import { createViewerStore } from './viewerStore';

const setup = (storage = memoryStorage()) => {
  const patches = createPatchStore({ hash: '', library: createLibrary(memoryStorage()), apply: () => {} });
  const sources: TapSource[] = [];
  const viewers = createViewerStore({ storage, patches, setTapSource: (source) => sources.push(source) });
  return { storage, patches, viewers, sources };
};

describe('the Viewer settings store (issue 77)', () => {
  it('starts as the Viewers always have: 2 cycles, 2 seconds, the overlays by default, nothing frozen', () => {
    const { viewers, sources } = setup();
    expect(viewers.get()).toMatchObject({ cycles: 2, timelineSeconds: 2, overlays: DEFAULT_OVERLAYS, viewer: { frozen: false, snapshot: null, tapSource: 'all' } });
    expect(sources).toEqual(['all']);
  });

  it('changes by its actions, keeping the same read between changes', () => {
    const { viewers } = setup();
    const first = viewers.get();
    expect(viewers.get()).toBe(first);
    viewers.dispatch({ type: 'setCycles', cycles: 4 });
    viewers.dispatch({ type: 'setTimelineSeconds', seconds: 3 });
    viewers.dispatch({ type: 'toggleFreeze' });
    viewers.dispatch({ type: 'toggleOverlay', overlay: 'guides' });
    viewers.dispatch({ type: 'showOverlay', overlay: 'maths' });
    viewers.dispatch({ type: 'showOverlay', overlay: 'maths' });
    expect(viewers.get()).toMatchObject({ cycles: 4, timelineSeconds: 3, viewer: { frozen: true }, overlays: { guides: true, maths: true } });
    expect(viewers.get()).not.toBe(first);
  });

  it('saves the overlays, and only them: a new page starts from them, unfrozen and on its defaults', () => {
    const { storage, viewers } = setup();
    viewers.dispatch({ type: 'toggleOverlay', overlay: 'curve' });
    viewers.dispatch({ type: 'setCycles', cycles: 4 });
    viewers.dispatch({ type: 'setFrequencyScale', scale: 'linear' });
    viewers.dispatch({ type: 'toggleFreeze' });
    viewers.dispatch({ type: 'takeSnapshot' });
    expect(Object.keys(storage.data)).toEqual(['limpide.overlays']);
    const next = setup(storage).viewers.get();
    expect(next.overlays.curve).toBe(false);
    expect(next).toMatchObject({ cycles: 2, viewer: { frozen: false, snapshot: null, frequencyScale: 'log' } });
  });

  it('hands the Amp Tap its source as soon as it changes, and tells its subscribers after', () => {
    const { viewers, sources } = setup();
    const heard: string[] = [];
    viewers.subscribe(() => heard.push(`subscriber ${sources.at(-1)}`));
    viewers.dispatch({ type: 'setTapSource', source: 'newest' });
    expect(sources).toEqual(['all', 'newest']);
    expect(heard).toEqual(['subscriber newest']);
    viewers.dispatch({ type: 'toggleFreeze' });
    expect(sources).toEqual(['all', 'newest']); // no change, nothing handed
  });

  it("follows the Patch with the Ideal Reference, Osc 2's level and tuning included (the bug found grilling issue 77)", () => {
    const { patches, viewers } = setup();
    const osc2 = () => (viewers.get().ideal ?? []).filter((p) => p.source === 'osc2');
    expect(osc2()).toEqual([]);
    patches.change((p) => setParam(p, 'mixOsc2', 1), 'hand');
    expect(osc2().length).toBeGreaterThan(0);
    const fundamental = osc2()[0].ratio;
    patches.change((p) => setParam(p, 'osc2Octave', 1), 'hand');
    expect(osc2()[0].ratio).toBeCloseTo(fundamental * 2);
  });
});
