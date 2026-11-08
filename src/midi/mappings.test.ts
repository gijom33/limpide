import { describe, expect, it } from 'vitest';
import { brokenStorage, memoryStorage } from '../test/memoryStorage';
import { ACTIONS, createMappingStore, type Mapping } from './mappings';

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

  it('loads a stored bend wheel’s Mapping (CC 128), but no Note or CC past the 0 to 127 a message can carry (issue 255)', () => {
    const onBend: Mapping = { ...cutoffOnKnob, control: { kind: 'cc', channel: 1, number: 128 }, mode: 'absolute' };
    const note128 = { ...holdOnPad, control: { kind: 'note', channel: 10, number: 128 } };
    const past = { ...cutoffOnKnob, control: { kind: 'cc', channel: 1, number: 129 } };
    const store = createMappingStore(memoryStorage({ 'limpide.mappings': JSON.stringify([onBend, note128, past]) }));
    expect(store.list()).toEqual([onBend]);
  });

  it('loads stored Mappings with a known Controller’s tag or none, and drops one tagged for no known Controller (issue 149)', () => {
    const ofC16: Mapping = { ...cutoffOnKnob, device: 'c16' };
    const unknown = { ...holdOnPad, device: 'keystep' };
    const store = createMappingStore(memoryStorage({ 'limpide.mappings': JSON.stringify([ofC16, holdOnPad, unknown]) }));
    expect(store.list()).toEqual([ofC16, holdOnPad]);
  });

  it('removes the Mapping on one control, and can clear them all', () => {
    const store = createMappingStore(memoryStorage());
    store.set(cutoffOnKnob);
    store.set(holdOnPad);
    store.remove(cutoffOnKnob.control);
    expect(store.list()).toEqual([holdOnPad]);
    store.clear();
    expect(store.list()).toEqual([]);
  });

  it('keeps choice targets (a Waveform) and drops unknown ones', () => {
    const storage = memoryStorage({
      'limpide.mappings': JSON.stringify([
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
      'limpide.mappings': JSON.stringify([
        cutoffOnKnob,
        { ...cutoffOnKnob, target: { kind: 'param', id: 'wobble' } },
        42,
      ]),
    });
    expect(createMappingStore(storage).list()).toEqual([cutoffOnKnob]);
    expect(createMappingStore(memoryStorage({ 'limpide.mappings': '{nope' })).list()).toEqual([]);
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

describe('Tap Tempo (issue 223)', () => {
  it('is the tempo’s Action, named Tap Tempo off screen', () => {
    expect(ACTIONS.tapTempo).toBe('Tap Tempo');
  });

  it('a Mapping stored on the Action’s old name, tap, loads on Tap Tempo', () => {
    const old = { control: { kind: 'cc', channel: 1, number: 60 }, target: { kind: 'action', id: 'tap' }, mode: 'trigger' };
    const store = createMappingStore(memoryStorage({ 'limpide.mappings': JSON.stringify([old]) }));
    expect(store.list()).toEqual([{ ...old, target: { kind: 'action', id: 'tapTempo' } }]);
  });
});
