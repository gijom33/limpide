import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import type { KeyValueStorage } from '../../app/storage';
import type { Patch } from '../../patch/patch';
import { PRESETS } from '../../patch/presets';
import { loadFinished, saveFinished } from '../../tutorial/progress';
import { applyStep, controlName, differences, reached, type Tutorial } from '../../tutorial/tutorial';
import type { Overlays } from '../../viewers/overlays';

/** How long a control must rest within reach of its target for the Step to count. */
const SETTLE_MS = 400;

interface Host {
  storage: KeyValueStorage;
  patch: Patch;
  patchName: string;
  setPatch: Dispatch<SetStateAction<Patch>>;
  loadPatch(name: string, patch: Patch): void;
  overlays: Overlays;
  setOverlays: Dispatch<SetStateAction<Overlays>>;
  /** A Tutorial starts: whatever plays by itself stops. */
  onStart(): void;
  /** A Tutorial ends: its Listen stops. */
  onEnd(): void;
}

/**
 * A Tutorial (issue 57): a Preset rebuilt from Init, the person turning each control. `index` is −1 on the first card
 * and `steps.length` on the last. A Step is made when its control reaches the target, however it got there (hand,
 * keys, MIDI, "Do it for me"); a knob or fader then snaps to the exact value, so the finished sound is the Preset's.
 */
export function useTutorialState({ storage, patch, patchName, setPatch, loadPatch, overlays, setOverlays, onStart, onEnd }: Host) {
  const [lesson, setLesson] = useState<{ tutorial: Tutorial; index: number; done: boolean[] } | null>(null);
  const [finished, setFinished] = useState(() => loadFinished(storage));
  const preset = lesson && PRESETS.find((p) => p.name === lesson.tutorial.preset)!;
  const step = lesson?.tutorial.steps[lesson.index];
  const atEnd = !!lesson && lesson.index >= lesson.tutorial.steps.length;
  const differs = atEnd && preset ? differences(patch, preset.patch) : [];

  const start = (tutorial: Tutorial) => {
    onStart();
    const init = PRESETS[0];
    loadPatch(init.name, init.patch);
    setLesson({ tutorial, index: -1, done: tutorial.steps.map(() => false) });
  };
  const end = () => {
    onEnd();
    setLesson(null);
  };
  const move = (delta: number) => setLesson((l) => l && { ...l, index: Math.min(l.tutorial.steps.length, Math.max(-1, l.index + delta)) });
  const matchPreset = () => preset && loadPatch(preset.name, preset.patch);
  const doIt = () => {
    if (!step) return;
    if (step.kind === 'display') setOverlays((v) => ({ ...v, [step.overlay]: true }));
    else setPatch((p) => applyStep(p, step));
  };

  // It counts once the control rests within reach, not as a drag passes through on its way past (review 5, 2026-10-27):
  // any change before then starts the wait again.
  useEffect(() => {
    if (!lesson || !step || lesson.done[lesson.index] || !reached(step, patch, overlays)) return;
    const timer = setTimeout(() => {
      if (step.kind !== 'display' && patch[step.id] !== step.to) setPatch((p) => applyStep(p, step));
      setLesson((l) => l && { ...l, done: l.done.map((d, i) => d || i === l.index) });
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [lesson, step, patch, overlays, setPatch]);

  // The last card: the Tutorial counts as finished, and a sound that matches is named after its Preset.
  const matches = differs.length === 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadPatch is rebuilt each render, the same each time
  useEffect(() => {
    if (!atEnd || !preset) return;
    setFinished((f) => {
      if (f.has(preset.name)) return f;
      const next = new Set(f).add(preset.name);
      saveFinished(storage, next);
      return next;
    });
    if (matches && patchName !== preset.name) loadPatch(preset.name, preset.patch);
  }, [atEnd, preset, matches, patchName, storage]);

  return { lesson, preset, finished, differs: differs.map(controlName), start, end, move, matchPreset, doIt };
}
