import { describe, expect, it } from 'vitest';
import { parsePhrase } from '../demo/phrase';
import { PRESETS } from '../patch/presets';
import { DEFAULT_OVERLAYS } from '../viewers/overlays';
import { applyStep, differences, reached } from './tutorial';
import { TUTORIALS } from './tutorials';

describe('the Tutorials', () => {
  it('start with Bass, the one the Welcome opens, then Acid, Pluck and Wobble', () => {
    expect(TUTORIALS.map((t) => t.preset)).toEqual(['Bass', 'Acid', 'Pluck', 'Wobble']);
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

      it('asks for something new at every Step, one control each', () => {
        let patch = PRESETS[0].patch;
        const controls = tutorial.steps.map((s) => (s.kind === 'display' ? s.overlay : s.id));
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
