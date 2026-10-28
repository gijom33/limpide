import { describe, expect, it } from 'vitest';
import { parsePhrase } from '../demo/phrase';
import { PRESETS } from '../patch/presets';
import { DEFAULT_OVERLAYS } from '../viewers/overlays';
import { applyStep, reached } from './tutorial';
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
        expect(patch).toEqual(preset.patch);
      });

      it('asks for something new at every Step, one control each', () => {
        let patch = PRESETS[0].patch;
        const controls = tutorial.steps.map((s) => (s.kind === 'display' ? s.overlay : s.id));
        expect(new Set(controls).size).toBe(controls.length);
        for (const step of tutorial.steps) {
          // Something to change when it comes (with the Display options a first visit has); an Action, a press. A knob
          // already within reach waits for a touch, then snaps to its target.
          const next = applyStep(patch, step);
          if (step.kind === 'display') expect(reached(step, patch, DEFAULT_OVERLAYS), step.say).toBe(false);
          else if (step.kind !== 'action') expect(next, step.say).not.toEqual(patch);
          patch = next;
          expect(step.say.length, step.say).toBeGreaterThan(10);
          expect(step.note.length, step.note).toBeGreaterThan(10);
        }
      });

      it('has a phrase for Listen and a summary', () => {
        expect(parsePhrase(tutorial.phrase, tutorial.bpm).length).toBeGreaterThan(4);
        expect(tutorial.summary.length).toBeGreaterThan(20);
      });
    });
  }
});
