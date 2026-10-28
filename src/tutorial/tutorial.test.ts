import { describe, expect, it } from 'vitest';
import { defaultPatch, PARAMS, type Patch } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { DEFAULT_OVERLAYS } from '../viewers/overlays';
import { applyStep, controlName, differences, reached, rebuild, type Step, type Tutorial, targetText } from './tutorial';

const cutoff: Step = { kind: 'param', id: 'cutoff', to: 800, say: 'Turn Cutoff down.', note: 'Darker.' };
const slope: Step = { kind: 'choice', id: 'filterSlope', to: 24, say: 'Choose 24 dB.', note: 'Steeper.' };
const ideal: Step = { kind: 'display', overlay: 'ideal', say: 'Turn on Ideal.', note: 'Rings.' };
const sample: Tutorial = { preset: 'Sample', bpm: 120, phrase: 'C3:1', summary: 'A test.', steps: [cutoff, slope, ideal] };

/** The value a control shows this far along its travel from the target. */
const off = (step: Extract<Step, { kind: 'param' }>, travel: number) =>
  positionToValue(PARAMS[step.id], valueToPosition(PARAMS[step.id], step.to) + travel);

describe('a Step', () => {
  it('is reached by a knob within 5 % of its travel, on its own Taper', () => {
    const at = (value: number) => reached(cutoff, { ...defaultPatch(), cutoff: value }, DEFAULT_OVERLAYS);
    expect(at(800)).toBe(true);
    expect(at(off(cutoff, 0.049))).toBe(true);
    expect(at(off(cutoff, -0.049))).toBe(true);
    expect(at(off(cutoff, 0.06))).toBe(false);
    expect(at(2000)).toBe(false);
  });

  it('is reached by a choice only when it matches', () => {
    expect(reached(slope, defaultPatch(), DEFAULT_OVERLAYS)).toBe(false);
    expect(reached(slope, { ...defaultPatch(), filterSlope: 24 }, DEFAULT_OVERLAYS)).toBe(true);
  });

  it('is reached by a Display option once it is on, whatever the Patch', () => {
    expect(reached(ideal, defaultPatch(), { ...DEFAULT_OVERLAYS, ideal: false })).toBe(false);
    expect(reached(ideal, defaultPatch(), { ...DEFAULT_OVERLAYS, ideal: true })).toBe(true);
  });

  it('applied, sets its control to the exact target; a Display option leaves the Patch alone', () => {
    expect(applyStep(defaultPatch(), cutoff).cutoff).toBe(800);
    expect(applyStep(defaultPatch(), slope).filterSlope).toBe(24);
    expect(applyStep(defaultPatch(), ideal)).toEqual(defaultPatch());
  });

  it('names its target as the control shows it', () => {
    expect(targetText(cutoff)).toBe('800 Hz');
    expect(targetText(slope)).toBe('24 dB');
    expect(targetText({ kind: 'choice', id: 'osc2Waveform', to: 'square', say: '', note: '' })).toBe('Square');
    expect(targetText({ kind: 'choice', id: 'lfoRetrigger', to: 'note', say: '', note: '' })).toBe('On');
    expect(targetText(ideal)).toBe('On');
  });
});

describe('a Tutorial', () => {
  it('rebuilds its sound from Init, every Step applied in turn', () => {
    expect(rebuild(sample)).toEqual({ ...defaultPatch(), cutoff: 800, filterSlope: 24 });
  });

  it('tells what differs from its Preset, by the controls’ names', () => {
    const preset: Patch = rebuild(sample);
    expect(differences(preset, preset)).toEqual([]);
    expect(differences({ ...preset, cutoff: 900, waveform: 'square' }, preset)).toEqual(['cutoff', 'waveform']);
  });

  it('names a control so it cannot be mistaken for another', () => {
    expect(controlName('cutoff')).toBe('Cutoff');
    expect(controlName('filterAttack')).toBe('Filter Attack');
    expect(controlName('ampRelease')).toBe('Amp Release');
    expect(controlName('filterEnvAmount')).toBe('Filter Envelope Amount');
    expect(controlName('lfoRate')).toBe('LFO 1 Rate');
    expect(controlName('lfo2Amount')).toBe('LFO 2 Depth');
    expect(controlName('osc2Octave')).toBe('Osc 2 Octave');
    expect(controlName('mixOsc2')).toBe('Osc 2 level');
    expect(controlName('lfoRetrigger')).toBe('LFO 1 Retrigger');
  });
});
