import { describe, expect, it } from 'vitest';
import { parsePhrase } from '../demo/phrase';
import { PRESETS } from '../patch/presets';
import { DEFAULT_OVERLAYS } from '../viewers/overlays';
import { applyStep, differences, reached } from './tutorial';
import { TUTORIALS } from './tutorials';

describe('the Tutorials', () => {
  it('start with Sub Ladder, the one the Tour’s last card opens, then Bass, Acid, Pluck, Wobble and PWM Bass, then issue 109’s three', () => {
    expect(TUTORIALS.map((t) => t.preset)).toEqual(['Sub Ladder', 'Bass', 'Acid', 'Pluck', 'Wobble', 'PWM Bass', 'FM Ladder', 'Ring Bell', 'Deep Breath']);
  });

  // Issue 233: each Waveform in turn on Osc 1, every Harmonic in sight, then a saw and a square an octave apart.
  it('play each Waveform in turn in Sub Ladder, the Filter open and Ideal on first, and end on the square Sub under the saw (issue 233)', () => {
    const steps = TUTORIALS.find((t) => t.preset === 'Sub Ladder')!.steps;
    const waves = steps.flatMap((s) => (s.kind === 'choice' && s.id === 'waveform' ? [s.to] : []));
    expect(waves).toEqual(['sine', 'triangle', 'square', 'pulse', 'saw']);
    const firstWave = steps.findIndex((s) => s.kind === 'choice' && s.id === 'waveform');
    const before = steps.slice(0, firstWave);
    expect(before).toContainEqual(expect.objectContaining({ kind: 'param', id: 'cutoff', to: 20000 }));
    expect(before).toContainEqual(expect.objectContaining({ kind: 'display', overlay: 'ideal' }));
    expect(steps.at(-1)).toMatchObject({ kind: 'param', id: 'mixSub' });
    for (const step of steps.filter((s) => s.kind === 'choice')) expect(step.viewer, step.say).toBe('Oscillator Spectrum');
  });

  // Issue 190, decision 3 (review 16, finding 5): the Filter Envelope's four faders, a Step each in Bass alone.
  it('drill the Filter Envelope’s four faders a Step each only the first time; after, in one Step', () => {
    const ENVELOPE = ['filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'];
    const shapes = TUTORIALS.flatMap((t) => {
      const one = t.steps.filter((s) => s.kind === 'param' && ENVELOPE.includes(s.id)).length;
      const together = t.steps.find((s) => s.kind === 'params');
      return one || together ? [{ preset: t.preset, one, together: together?.kind === 'params' ? together.faders.map((s) => s.id) : [] }] : [];
    });
    expect(shapes).toEqual([
      { preset: 'Bass', one: 4, together: [] },
      { preset: 'Acid', one: 0, together: ENVELOPE },
      { preset: 'Pluck', one: 0, together: ENVELOPE },
      { preset: 'PWM Bass', one: 0, together: ['filterAttack', 'filterDecay', 'filterSustain'] }, // its Release stays as Init has it
    ]);
  });

  // Issue 234: Pulse Width by hand, then LFO 1 sweeping it, then a detuned Osc 2 brought in and taken out again.
  it('turn Pulse Width by hand in PWM Bass, then aim LFO 1 at it, then compare a detuned Osc 2 and take it out (issue 234)', () => {
    const steps = TUTORIALS.find((t) => t.preset === 'PWM Bass')!.steps;
    const targets = steps.flatMap((s) => (s.kind === 'param' || s.kind === 'choice' ? [`${s.id} ${s.to}`] : []));
    expect(targets.slice(0, 10)).toEqual([
      'waveform pulse', 'pulseWidth 0.1', 'pulseWidth 0.5',
      'lfoDestination pulseWidth', 'lfoAmount 0.8', 'lfoRate 0.8',
      'mixOsc2 0.6', 'osc2Detune 7', 'osc2Detune 0', 'mixOsc2 0',
    ]);
  });

  for (const tutorial of TUTORIALS) {
    describe(tutorial.preset, () => {
      it('rebuilds its Preset exactly, from Init', () => {
        const preset = PRESETS.find((p) => p.name === tutorial.preset)!;
        let patch = PRESETS[0].patch;
        for (const step of tutorial.steps) patch = applyStep(patch, step);
        // Every Parameter and choice; the keyboard's octave comes with loading the Preset at the end (issue 125).
        expect(differences(patch, preset.patch)).toEqual([]);
        expect({ ...patch, keyboardOctave: preset.patch.keyboardOctave }).toEqual(preset.patch);
      });

      // A control may come back with another target (issue 233: each Waveform in turn), never with the same one.
      it('asks for something new at every Step, one control each', () => {
        let patch = PRESETS[0].patch;
        const controls = tutorial.steps.flatMap((s) =>
          s.kind === 'display' ? s.overlay : s.kind === 'params' ? s.faders.map((t) => `${t.id} ${t.to}`) : s.kind === 'action' ? s.id : `${s.id} ${s.to}`,
        );
        expect(new Set(controls).size).toBe(controls.length);
        for (const step of tutorial.steps) {
          // Something to change when it comes; an Action, a press. A knob already within reach waits for a touch, then
          // snaps to its target. A Display option may be on already (Ideal is, at first: the owner, 2026-10-28): its
          // Step then shows done, its note still read, and asks for it only from a learner who turned it off.
          const next = applyStep(patch, step);
          if (step.kind === 'display') expect(reached(step, patch, { ...DEFAULT_OVERLAYS, [step.overlay]: false }), step.say).toBe(false);
          else if (step.kind !== 'action') expect(next, step.say).not.toEqual(patch);
          patch = next;
          expect(step.say.length, step.say).toBeGreaterThan(10);
          expect(step.note.length, step.note).toBeGreaterThan(10);
        }
      });

      // Issue 105: on a phone the Bass Tutorial's Ideal Step spoke of circles on the Oscillator Spectrum, under the card.
      it('points each Step at the Viewer its note names, so the page can bring it into view', () => {
        const named = /(Oscillator|Filter|Amp) (Scope|Spectrum)|Timeline/;
        for (const step of tutorial.steps) {
          const name = step.note.match(named)?.[0];
          if (name) expect(step.viewer, step.note).toBe(name === 'Timeline' ? 'Envelope Timeline' : name);
        }
        // The Ideal Step's circles and squares are on the Oscillator Spectrum, though its note does not say so.
        const ideal = tutorial.steps.find((s) => s.kind === 'display' && s.overlay === 'ideal');
        if (ideal) expect(ideal.viewer).toBe('Oscillator Spectrum');
      });

      it('has a phrase for Listen and a summary', () => {
        expect(parsePhrase(tutorial.phrase, tutorial.bpm).length).toBeGreaterThan(4);
        expect(tutorial.summary.length).toBeGreaterThan(20);
      });
    });
  }
});
