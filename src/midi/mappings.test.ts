import { describe, expect, it } from 'vitest';
import { brokenStorage, memoryStorage } from '../test/memoryStorage';
import { createMappingStore, type Mapping } from './mappings';

const cutoffOnKnob: Mapping = {
  control: { kind: 'cc', channel: 1, number: 74 },
  target: { kind: 'param', id: 'cutoff' },
  mode: 'relative-twos',
};
const holdOnPad: Mapping = {
  control: { kind: 'note', channel: 10, number: 36 },
  target: { kind: 'action', id: 'hold' },
  mode: 'trigger',
};

describe('Mapping store', () => {
  it('finds the Mapping for a Controller control', () => {
    const store = createMappingStore(memoryStorage());
    store.set(cutoffOnKnob);
    store.set(holdOnPad);
    expect(store.find({ kind: 'cc', channel: 1, number: 74 })).toEqual(cutoffOnKnob);
    expect(store.find({ kind: 'note', channel: 10, number: 36 })).toEqual(holdOnPad);
    expect(store.find({ kind: 'cc', channel: 2, number: 74 })).toBeUndefined(); // another channel
    expect(store.find({ kind: 'note', channel: 1, number: 74 })).toBeUndefined(); // a note, not the CC
  });

  it('gives each control one target and each target one control: a new Mapping replaces either', () => {
    const store = createMappingStore(memoryStorage());
    store.set(cutoffOnKnob);
    store.set({
      ...cutoffOnKnob,
      control: { kind: 'cc', channel: 1, number: 71 },
    }); // Cutoff moved to another knob
    expect(store.list()).toHaveLength(1);
    expect(store.find({ kind: 'cc', channel: 1, number: 74 })).toBeUndefined();
    store.set({
      ...cutoffOnKnob,
      control: { kind: 'cc', channel: 1, number: 71 },
      target: { kind: 'param', id: 'resonance' },
    });
    expect(store.list().map((m) => m.target)).toEqual([{ kind: 'param', id: 'resonance' }]);
  });

  it('removes a Mapping by its target, and can clear them all', () => {
    const store = createMappingStore(memoryStorage());
    store.set(cutoffOnKnob);
    store.set(holdOnPad);
    store.remove({ kind: 'param', id: 'cutoff' });
    expect(store.list()).toEqual([holdOnPad]);
    store.clear();
    expect(store.list()).toEqual([]);
  });

  it('keeps choice targets (a Waveform) and drops unknown ones', () => {
    const storage = memoryStorage({
      'synthview.mappings': JSON.stringify([
        { control: { kind: 'cc', channel: 1, number: 7 }, target: { kind: 'choice', id: 'waveform' }, mode: 'relative-twos' },
        { control: { kind: 'cc', channel: 1, number: 8 }, target: { kind: 'choice', id: 'colour' }, mode: 'relative-twos' },
      ]),
    });
    expect(createMappingStore(storage).list().map((m) => m.target)).toEqual([{ kind: 'choice', id: 'waveform' }]);
  });

  it('can put back a whole earlier set of Mappings (a cancelled Quick Setup)', () => {
    const storage = memoryStorage();
    const store = createMappingStore(storage);
    store.set(cutoffOnKnob);
    const before = store.list();
    store.set(holdOnPad);
    store.set({ ...cutoffOnKnob, control: { kind: 'cc', channel: 1, number: 1 } });
    store.restore(before);
    expect(store.list()).toEqual([cutoffOnKnob]);
    expect(createMappingStore(storage).list()).toEqual([cutoffOnKnob]); // and saved
  });

  it('keeps Mappings across visits', () => {
    const storage = memoryStorage();
    createMappingStore(storage).set(cutoffOnKnob);
    expect(createMappingStore(storage).list()).toEqual([cutoffOnKnob]);
  });

  it('drops stored Mappings it cannot use (unknown targets, garbled entries) and survives broken storage', () => {
    const storage = memoryStorage({
      'synthview.mappings': JSON.stringify([
        cutoffOnKnob,
        { ...cutoffOnKnob, target: { kind: 'param', id: 'wobble' } },
        42,
      ]),
    });
    expect(createMappingStore(storage).list()).toEqual([cutoffOnKnob]);
    expect(createMappingStore(memoryStorage({ 'synthview.mappings': '{nope' })).list()).toEqual([]);
    const broken = createMappingStore(brokenStorage);
    expect(() => broken.set(cutoffOnKnob)).not.toThrow();
    expect(broken.list()).toEqual([cutoffOnKnob]); // still works for this visit
  });

  it('tells subscribers when Mappings change', () => {
    const store = createMappingStore(memoryStorage());
    let seen = -1;
    store.subscribe(() => (seen = store.list().length));
    store.set(cutoffOnKnob);
    expect(seen).toBe(1);
  });
});
