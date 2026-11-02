import { describe, expect, it } from 'vitest';
import { noteIndex } from '../music/tempo';
import { defaultPatch, PARAMS, type Patch } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { DEFAULT_OVERLAYS } from '../viewers/overlays';
import { applyStep, controlName, differences, doStep, held, inDisplay, isMade, onTarget, reached, rebuild, type Step, type Tutorial, targetText } from './tutorial';

const cutoff: Step = { kind: 'param', id: 'cutoff', to: 800, say: 'Turn Cutoff down.', note: 'Darker.' };
const slope: Step = { kind: 'choice', id: 'filterSlope', to: 24, say: 'Choose 24 dB.', note: 'Steeper.' };
const ideal: Step = { kind: 'display', overlay: 'ideal', say: 'Turn on Ideal.', note: 'Rings.' };
const sample: Tutorial = { preset: 'Sample', intro: 'A test sound.', teaches: 'testing', bpm: 120, phrase: 'C3:1', summary: 'A test.', steps: [cutoff, slope, ideal] };

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

  it('is reached by a stepped knob only on its step: a note value, a Semitone (issue 137)', () => {
    const note: Step = { kind: 'param', id: 'lfoNote', to: noteIndex('1/4 T'), say: 'Turn the Rate to 1/4 T.', note: 'Three in two.' };
    const at = (lfoNote: number) => reached(note, { ...defaultPatch(), lfoSync: 'on', lfoNote }, DEFAULT_OVERLAYS);
    expect(at(noteIndex('1/4 T'))).toBe(true);
    // Its neighbours are a 23rd of its travel away, within 5 %: still not the note value asked for.
    expect(at(noteIndex('1/4 T') - 1)).toBe(false);
    expect(at(noteIndex('1/4 T') + 1)).toBe(false);
    const semitone: Step = { kind: 'param', id: 'osc2Semitone', to: 3, say: 'Set +3.', note: 'Off the ladder.' };
    expect(reached(semitone, { ...defaultPatch(), osc2Semitone: 3 }, DEFAULT_OVERLAYS)).toBe(true);
    expect(reached(semitone, { ...defaultPatch(), osc2Semitone: 4 }, DEFAULT_OVERLAYS)).toBe(false);
  });

  it('is reached by Sync once it is on, and names its note value as the Rate shows it (issue 137)', () => {
    const sync: Step = { kind: 'choice', id: 'lfoSync', to: 'on', say: 'Switch on Sync.', note: 'On the beat.' };
    expect(reached(sync, defaultPatch(), DEFAULT_OVERLAYS)).toBe(false);
    expect(reached(sync, { ...defaultPatch(), lfoSync: 'on' }, DEFAULT_OVERLAYS)).toBe(true);
    expect(targetText(sync)).toBe('On');
    expect(targetText({ kind: 'param', id: 'lfoNote', to: noteIndex('1/4 T'), say: '', note: '' })).toBe('1/4 T');
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
    // A bass's keyboard octave is no control a Step turns (issue 125).
    expect(differences(preset, { ...preset, keyboardOctave: 2 })).toEqual([]);
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

describe('whether a Step is made (issue 70: asked of the Step, whatever its kind)', () => {
  const scene = (changes: Partial<Patch>, snapshot: number | null = null) => ({ patch: { ...defaultPatch(), ...changes }, overlays: DEFAULT_OVERLAYS, snapshot });
  const knob: Step = { kind: 'param', id: 'cutoff', to: 800, say: '', note: '' };
  const press: Step = { kind: 'action', id: 'snapshot', say: '', note: '' };

  it('a knob once moved within reach, or found on its target; one found within reach waits for a touch', () => {
    expect(isMade(knob, scene({ cutoff: 810 }), 2000)).toBe(true);
    expect(isMade(knob, scene({ cutoff: 810 }), 810)).toBe(false);
    expect(isMade(knob, scene({ cutoff: 800 }), 800)).toBe(true);
    expect(held(knob, scene({ cutoff: 810 }))).toBe(810);
  });

  it('an Action by a new Snapshot, not the one there when its card came', () => {
    expect(held(press, scene({}, 3))).toBe(3);
    expect(isMade(press, scene({}, 3), 3)).toBe(false);
    expect(isMade(press, scene({}, 4), 3)).toBe(true);
    expect(isMade(press, scene({}), null)).toBe(false);
  });

  it('the Patch is on target once snapped; Display and Action Steps set none', () => {
    expect(onTarget(knob, { ...defaultPatch(), cutoff: 810 })).toBe(false);
    expect(onTarget(knob, { ...defaultPatch(), cutoff: 800 })).toBe(true);
    expect(onTarget(press, defaultPatch())).toBe(true);
  });

  it('“Do it for me” makes each kind’s change through the page', () => {
    const done: string[] = [];
    const page = { setPatch: () => done.push('patch'), showOverlay: (o: string) => done.push(o), takeSnapshot: () => done.push('snapshot') };
    doStep(knob, page);
    doStep(press, page);
    doStep({ kind: 'display', overlay: 'ideal', say: '', note: '' }, page);
    expect(done).toEqual(['patch', 'snapshot', 'ideal']);
    expect(inDisplay(press) && !inDisplay(knob)).toBe(true);
  });
});
