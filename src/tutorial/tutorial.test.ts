import { describe, expect, it } from 'vitest';
import { noteIndex } from '../music/tempo';
import { defaultPatch, PARAMS, type Patch } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { DEFAULT_OVERLAYS } from '../viewers/overlays';
import { applyStep, controlName, differences, doStep, held, inDisplay, isMade, onTarget, reached, readyFor, rebuild, type Step, type Tutorial, targetText } from './tutorial';

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

  it('on an LFO’s Rate, has its knob turn what it asks: Sync off for the Hz, on for a note value (issue 193)', () => {
    const hz: Step = { kind: 'param', id: 'lfoRate', to: 3, say: 'Set the Rate to 3 Hz.', note: 'Faster.' };
    const note: Step = { kind: 'param', id: 'lfoNote', to: noteIndex('1/4 T'), say: 'Turn the Rate to 1/4 T.', note: 'Three in two.' };
    const synced = { ...defaultPatch(), lfoSync: 'on' } as const;
    expect(readyFor(hz, synced).lfoSync).toBe('off');
    expect(readyFor(note, defaultPatch()).lfoSync).toBe('on');
    const unsynced = defaultPatch();
    expect(readyFor(hz, unsynced)).toBe(unsynced); // nothing to change
    expect(readyFor(cutoff, synced)).toBe(synced);
    expect(readyFor({ ...hz, id: 'lfo2Rate' }, { ...synced, lfo2Sync: 'on' })).toEqual({ ...synced, lfo2Sync: 'off' });
    // "Do it for me" with Sync switched on meanwhile: the Hz set, and turned by its knob again.
    expect(applyStep(synced, hz)).toMatchObject({ lfoRate: 3, lfoSync: 'off' });
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

// Issue 190, decision 3: from the second Tutorial with the drill, the Filter Envelope's four faders in one Step.
describe('a Step of several faders (issue 190)', () => {
  const shape: Step = {
    kind: 'params', faders: [{ id: 'filterAttack', to: 0.001 }, { id: 'filterDecay', to: 0.15 }, { id: 'filterSustain', to: 0.05 }, { id: 'filterRelease', to: 0.1 }],
    say: 'Shape it.', note: 'Shaped.',
  };
  const all = { filterAttack: 0.001, filterDecay: 0.15, filterSustain: 0.05, filterRelease: 0.1 };
  const scene = (changes: Partial<Patch>) => ({ patch: { ...defaultPatch(), ...changes }, overlays: DEFAULT_OVERLAYS, snapshot: null });

  it('is reached once every one of them is within reach, not before', () => {
    expect(reached(shape, { ...defaultPatch(), ...all }, DEFAULT_OVERLAYS)).toBe(true);
    expect(reached(shape, { ...defaultPatch(), ...all, filterSustain: 0.09 }, DEFAULT_OVERLAYS)).toBe(true); // 4 % off
    expect(reached(shape, { ...defaultPatch(), ...all, filterSustain: 0.2 }, DEFAULT_OVERLAYS)).toBe(false);
    expect(reached(shape, { ...defaultPatch(), ...all, filterRelease: 0.4 }, DEFAULT_OVERLAYS)).toBe(false);
  });

  it('applied, or done for the person, sets each to its exact target; on target only when all are', () => {
    expect(applyStep(defaultPatch(), shape)).toEqual({ ...defaultPatch(), ...all });
    expect(onTarget(shape, { ...defaultPatch(), ...all })).toBe(true);
    expect(onTarget(shape, { ...defaultPatch(), ...all, filterDecay: 0.16 })).toBe(false);
  });

  it('found within reach waits for a touch of any of them, as a single knob does', () => {
    const near = { ...all, filterDecay: 0.155 };
    const since = held(shape, scene(near));
    expect(isMade(shape, scene(near), since)).toBe(false);
    expect(isMade(shape, scene({ ...near, filterDecay: 0.152 }), since)).toBe(true);
    expect(isMade(shape, scene(all), held(shape, scene(all)))).toBe(true);
    expect(isMade(shape, scene(near), held(shape, scene({})))).toBe(true);
  });

  it('names each fader’s target as it shows it', () => {
    expect(targetText(shape)).toBe('1.00 ms, 150 ms, 5 %, 100 ms');
  });
});
