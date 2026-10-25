import { describe, expect, it } from 'vitest';
import { PARAMS } from '../patch/patch';
import { ACTIONS, type Mapping } from './mappings';
import { QUICK_SETUP, quickSetupReducer, startQuickSetup, takenControls, type QuickSetupState } from './quickSetup';

const mapped = (state: QuickSetupState, number: number): Mapping => ({
  control: { kind: 'cc', channel: 1, number },
  target: state.steps[state.index].target,
  mode: 'relative-twos',
});
const learn = (state: QuickSetupState, number: number) => quickSetupReducer(state, { type: 'learned', mapping: mapped(state, number) });

describe('Quick Setup steps', () => {
  it('asks for every Parameter played live, in the page’s order, then the Actions', () => {
    expect(QUICK_SETUP.map((s) => [s.group, s.target.id].filter(Boolean).join(' · '))).toEqual([
      'Osc 2 · osc2Detune',
      'Mixer · mixOsc1', 'Mixer · mixOsc2', 'Mixer · mixNoise', 'Mixer · mixSub',
      'Filter · cutoff', 'Filter · resonance', 'Filter · filterEnvAmount',
      'Filter Envelope · filterAttack', 'Filter Envelope · filterDecay', 'Filter Envelope · filterSustain', 'Filter Envelope · filterRelease',
      'Amp Envelope · ampAttack', 'Amp Envelope · ampDecay', 'Amp Envelope · ampSustain', 'Amp Envelope · ampRelease',
      'LFO 1 · lfoRate', 'LFO 1 · lfoAmount', 'LFO 2 · lfo2Rate', 'LFO 2 · lfo2Amount',
      'hold', 'freeze', 'snapshot', 'previousPreset', 'nextPreset',
    ]);
    // Exactly the Parameters whose role is played live (ADR-0008): none set once for a sound, none forgotten.
    const live = Object.values(PARAMS).filter((p) => p.control !== 'set').map((p) => p.id);
    expect(QUICK_SETUP.filter((s) => s.target.kind === 'param').map((s) => s.target.id).sort()).toEqual([...live].sort());
    expect(QUICK_SETUP.filter((s) => s.target.kind === 'action').map((s) => s.target.id).sort()).toEqual(Object.keys(ACTIONS).sort());
  });
});

describe('Quick Setup', () => {
  it('advances a step each time the current target is learned, and finishes after the last', () => {
    let state = startQuickSetup(QUICK_SETUP.slice(0, 2), []);
    expect(state).toMatchObject({ phase: 'running', index: 0 });
    state = learn(state, 1);
    expect(state).toMatchObject({ phase: 'running', index: 1 });
    state = learn(state, 2);
    expect(state.phase).toBe('done');
    expect(state.outcomes).toEqual(['mapped', 'mapped']);
  });

  it('ignores a Mapping for anything other than the current step', () => {
    const state = startQuickSetup(QUICK_SETUP, []);
    const other: Mapping = { control: { kind: 'cc', channel: 1, number: 9 }, target: { kind: 'param', id: 'mixNoise' }, mode: 'absolute' };
    expect(quickSetupReducer(state, { type: 'learned', mapping: other })).toBe(state);
  });

  it('skips a step, leaving it unmapped', () => {
    let state = startQuickSetup(QUICK_SETUP.slice(0, 2), []);
    state = quickSetupReducer(state, { type: 'skip' });
    expect(state).toMatchObject({ index: 1, outcomes: ['skipped'] });
  });

  it('goes back a step to learn it again, never before the first', () => {
    let state = startQuickSetup(QUICK_SETUP, []);
    state = quickSetupReducer(state, { type: 'back' });
    expect(state.index).toBe(0);
    state = learn(state, 1);
    state = quickSetupReducer(state, { type: 'back' });
    expect(state.index).toBe(0);
    expect(state.outcomes[0]).toBe('mapped'); // stays mapped unless learned anew
  });

  it('can finish early, keeping what was mapped, or be cancelled, giving back the Mappings from before', () => {
    const before: Mapping[] = [{ control: { kind: 'cc', channel: 1, number: 74 }, target: { kind: 'param', id: 'cutoff' }, mode: 'absolute' }];
    const state = learn(startQuickSetup(QUICK_SETUP, before), 1);
    expect(quickSetupReducer(state, { type: 'finish' })).toMatchObject({ phase: 'done', outcomes: ['mapped'] });
    const cancelled = quickSetupReducer(state, { type: 'cancel' });
    expect(cancelled.phase).toBe('cancelled');
    expect(cancelled.before).toEqual(before);
  });

  it('never takes a control already learned for another step, however long after', () => {
    let state = learn(startQuickSetup(QUICK_SETUP, []), 33);
    expect(takenControls(state)).toEqual([{ kind: 'cc', channel: 1, number: 33 }]);
    expect(learn(state, 33)).toBe(state); // the first fader, still moving after a pause
    state = learn(state, 34);
    expect(state).toMatchObject({ index: 2, outcomes: ['mapped', 'mapped'] });
    // Going back to a step, its own control may be learned again; the others' may not.
    state = quickSetupReducer(state, { type: 'back' });
    expect(takenControls(state)).toEqual([{ kind: 'cc', channel: 1, number: 33 }]);
    expect(learn(state, 34).index).toBe(2);
  });
});
