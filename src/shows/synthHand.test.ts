import { describe, expect, it } from 'vitest';
import { createLibrary } from '../patch/library';
import { setLfo, setParam } from '../patch/patch';
import { createPatchStore } from '../patch/patchStore';
import { PRESETS } from '../patch/presets';
import { memoryStorage } from '../test/memoryStorage';
import { createSynthHand } from './synthHand';

const setup = (by: 'demo' | 'tour' = 'demo') => {
  const store = createPatchStore({ hash: '', library: createLibrary(memoryStorage()), apply: () => {} });
  return { store, hand: createSynthHand(store, by) };
};

describe("The synth's hand, the Demo's knobs and the Tour's (issues 73, 128, 243)", () => {
  it('turns a knob, as the Show it is for', () => {
    for (const show of ['demo', 'tour'] as const) {
      const { store, hand } = setup(show);
      const by: string[] = [];
      store.subscribe((change) => by.push(change.by));
      hand.turn({ cutoff: 500 });
      expect(store.get().patch.cutoff).toBe(500);
      expect(by).toEqual([show]);
    }
  });

  it('turns a choice, as a Tour card does with a Waveform', () => {
    const { store, hand } = setup('tour');
    hand.turn({ waveform: 'square' });
    expect(store.get().patch.waveform).toBe('square');
  });

  it('turns Sync on for the LFOs a part plays in note values (issue 112)', () => {
    const { store, hand } = setup();
    const wobble = PRESETS.find((p) => p.name === 'Wobble')!;
    expect(hand.newPart(wobble, [1])).toMatchObject({ lfoSync: 'on', lfo2Sync: 'off', lfoRetrigger: 'note' });
    expect(hand.newPart(PRESETS[1])).toMatchObject({ lfoSync: 'off', lfo2Sync: 'off' });
    expect(store.get().name).toBe(PRESETS[1].name);
  });

  it('leaves a control turned by hand, or by a Controller, where it was put until the next part or card', () => {
    const { store, hand } = setup();
    hand.newPart(PRESETS[1]);
    store.change((p) => setParam(p, 'cutoff', 300), 'hand');
    store.change((p) => setParam(p, 'resonance', 0.9), 'controller');
    hand.turn({ cutoff: 5000, resonance: 0.1, glide: 0.3 });
    expect(store.get().patch).toMatchObject({ cutoff: 300, resonance: 0.9, glide: 0.3 });
    hand.newPart(PRESETS[2]);
    hand.turn({ cutoff: 5000 });
    expect(store.get().patch.cutoff).toBe(5000);
  });

  it("does not count the synth's own moves, a Tutorial's or a load as turned by hand", () => {
    const { store, hand } = setup();
    hand.turn({ cutoff: 300 });
    store.change((p) => setParam(p, 'resonance', 0.9), 'tutorial');
    store.load('Mine', setParam(store.get().patch, 'glide', 0.5));
    hand.turn({ cutoff: 5000, resonance: 0.1, glide: 0.1 });
    expect(store.get().patch).toMatchObject({ cutoff: 5000, resonance: 0.1, glide: 0.1 });
  });

  it('counts only the controls a change by hand moved', () => {
    const { store, hand } = setup();
    store.change((p) => setLfo(p, { destination: 'pitch' }), 'hand');
    hand.turn({ lfoAmount: 0.5 });
    expect(store.get().patch.lfoAmount).toBe(0.5);
  });

  it('changes nothing when the controls are where it would put them', () => {
    const { store, hand } = setup('tour');
    let heard = 0;
    store.subscribe(() => heard++);
    hand.turn({ cutoff: store.get().patch.cutoff });
    expect(heard).toBe(0);
  });

  it('loads the next part, or keeps the Patch loaded now for a riff on a shared sound', () => {
    const { store, hand } = setup();
    expect(hand.newPart(PRESETS[4])).toBe(PRESETS[4].patch);
    expect(store.get().name).toBe(PRESETS[4].name);
    store.change((p) => setParam(p, 'cutoff', 300), 'hand');
    const now = store.get().patch;
    expect(hand.newPart()).toBe(now);
    hand.turn({ cutoff: 5000 });
    expect(store.get().patch.cutoff).toBe(5000); // a new part, so the hand's turn is forgotten
  });

  it('stops listening once its Show stops', () => {
    const { store, hand } = setup();
    hand.stop();
    store.change((p) => setParam(p, 'cutoff', 300), 'hand');
    hand.turn({ cutoff: 5000 });
    expect(store.get().patch.cutoff).toBe(5000);
  });
});
