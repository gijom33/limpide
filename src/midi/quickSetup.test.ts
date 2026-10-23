import { describe, expect, it } from 'vitest';
import type { Mapping } from './mappings';
import { C16_SETUP, differsFromExpected, quickSetupReducer, startQuickSetup, type QuickSetupState } from './quickSetup';

const mapped = (state: QuickSetupState, number: number): Mapping => ({
  control: { kind: 'cc', channel: 1, number },
  target: state.steps[state.index].target,
  mode: 'relative-twos',
});
const learn = (state: QuickSetupState, number: number) => quickSetupReducer(state, { type: 'learned', mapping: mapped(state, number) });

describe('C16 Quick Setup layout', () => {
  it('maps the eight encoders, four faders and the first five buttons to the most educational controls', () => {
    expect(C16_SETUP.map((s) => `${s.prompt} → ${s.target.id}`)).toEqual([
      'Turn encoder 1 → cutoff',
      'Turn encoder 2 → resonance',
      'Turn encoder 3 → filterEnvAmount',
      'Turn encoder 4 → osc2Detune',
      'Turn encoder 5 → lfoRate',
      'Turn encoder 6 → lfoAmount',
      'Turn encoder 7 → waveform',
      'Turn encoder 8 → glide',
      'Move fader 1 → ampAttack',
      'Move fader 2 → ampDecay',
      'Move fader 3 → ampSustain',
      'Move fader 4 → ampRelease',
      'Press button 1 → hold',
      'Press button 2 → freeze',
      'Press button 3 → snapshot',
      'Press button 4 → nextPreset',
      'Press button 5 → previousPreset',
    ]);
    // The C16's factory CCs, as seen on a real one: encoders 1–8, faders 33–36, buttons from 49.
    expect(C16_SETUP.map((s) => s.expected.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 33, 34, 35, 36, 49, 50, 51, 52, 53]);
  });
});

describe('Quick Setup', () => {
  it('advances a step each time the current target is learned, and finishes after the last', () => {
    let state = startQuickSetup(C16_SETUP.slice(0, 2), []);
    expect(state).toMatchObject({ phase: 'running', index: 0 });
    state = learn(state, 1);
    expect(state).toMatchObject({ phase: 'running', index: 1 });
    state = learn(state, 2);
    expect(state.phase).toBe('done');
    expect(state.outcomes).toEqual(['mapped', 'mapped']);
  });

  it('ignores a Mapping for anything other than the current step', () => {
    const state = startQuickSetup(C16_SETUP, []);
    const other: Mapping = { control: { kind: 'cc', channel: 1, number: 9 }, target: { kind: 'param', id: 'mixNoise' }, mode: 'absolute' };
    expect(quickSetupReducer(state, { type: 'learned', mapping: other })).toBe(state);
  });

  it('skips a step, leaving it unmapped', () => {
    let state = startQuickSetup(C16_SETUP.slice(0, 2), []);
    state = quickSetupReducer(state, { type: 'skip' });
    expect(state).toMatchObject({ index: 1, outcomes: ['skipped'] });
  });

  it('goes back a step to learn it again, never before the first', () => {
    let state = startQuickSetup(C16_SETUP, []);
    state = quickSetupReducer(state, { type: 'back' });
    expect(state.index).toBe(0);
    state = learn(state, 1);
    state = quickSetupReducer(state, { type: 'back' });
    expect(state.index).toBe(0);
    expect(state.outcomes[0]).toBe('mapped'); // stays mapped unless learned anew
  });

  it('can finish early, keeping what was mapped, or be cancelled, giving back the Mappings from before', () => {
    const before: Mapping[] = [{ control: { kind: 'cc', channel: 1, number: 74 }, target: { kind: 'param', id: 'cutoff' }, mode: 'absolute' }];
    const state = learn(startQuickSetup(C16_SETUP, before), 1);
    expect(quickSetupReducer(state, { type: 'finish' })).toMatchObject({ phase: 'done', outcomes: ['mapped'] });
    const cancelled = quickSetupReducer(state, { type: 'cancel' });
    expect(cancelled.phase).toBe('cancelled');
    expect(cancelled.before).toEqual(before);
  });

  it('notices a control that is not the C16’s factory one (reassigned on the device, or another Controller)', () => {
    const [first] = C16_SETUP;
    expect(differsFromExpected(first, { control: { kind: 'cc', channel: 1, number: 1 }, target: first.target, mode: 'relative-twos' })).toBe(false);
    expect(differsFromExpected(first, { control: { kind: 'cc', channel: 3, number: 1 }, target: first.target, mode: 'relative-twos' })).toBe(false); // any channel
    expect(differsFromExpected(first, { control: { kind: 'cc', channel: 1, number: 74 }, target: first.target, mode: 'absolute' })).toBe(true);
  });
});
