import { useEffect, useEffectEvent, useState } from 'react';
import type { KeyValueStorage } from '../../app/storage';
import type { Patch } from '../../patch/patch';
import type { PatchStore } from '../../patch/patchStore';
import { PRESETS } from '../../patch/presets';
import { loadFinished, saveFinished } from '../../tutorial/progress';
import { applyStep, controlName, differences, doStep, type Held, held, isMade, onTarget, type Tutorial } from '../../tutorial/tutorial';
import type { Overlay, Overlays } from '../../viewers/overlays';

/** How long a control must rest within reach of its target for the Step to count. */
const SETTLE_MS = 400;

interface Host {
  storage: KeyValueStorage;
  patch: Patch;
  patchName: string;
  /** Where the Tutorial's own changes go: its first Init, "Do it for me", a Step's snap, the matching Preset. */
  patches: PatchStore;
  overlays: Overlays;
  /** A Display Step done for the person: the overlay on; or the Tutorial's own change given back. */
  showOverlay(overlay: Overlay): void;
  /** A Display Step coming with its overlay on already: off, for the person to turn on. */
  hideOverlay(overlay: Overlay): void;
  /** The current Snapshot's number (null when none): a new one makes a Snapshot Step. */
  snapshot: number | null;
  takeSnapshot(): void;
  /** The Snapshot a Tutorial took, cleared as it ends. */
  clearSnapshot(): void;
  /** A Tutorial starts: whatever plays by itself stops. */
  onStart(): void;
  /** A Tutorial ends: its Listen stops. */
  onEnd(): void;
}

/** A Tutorial under way: its card, which Steps are made, and the Display options it turned off itself. */
interface Lesson {
  tutorial: Tutorial;
  index: number;
  done: boolean[];
  since?: Held;
  /** The Display Steps that came with their overlay on, which the Tutorial turned off (issue 158). */
  turnedOff: number[];
  /** The Snapshot its Snapshot Step took, by its number (issue 158). */
  took?: number | null;
}

/**
 * A Tutorial (issue 57): a Preset rebuilt from Init, the person turning each control. `index` is −1 on the first card
 * and `steps.length` on the last. A Step is made when its control reaches the target, however it got there (hand,
 * keys, MIDI, "Do it for me"); a knob or fader then snaps to the exact value, so the finished sound is the Preset's.
 * `since` is what the Step's control held when the card came to it.
 */
export function useTutorialState({ storage, patch, patchName, patches, overlays, showOverlay, hideOverlay, snapshot, takeSnapshot, clearSnapshot, onStart, onEnd }: Host) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [finished, setFinished] = useState(() => loadFinished(storage));
  const preset = lesson && PRESETS.find((p) => p.name === lesson.tutorial.preset)!;
  const step = lesson?.tutorial.steps[lesson.index];
  const atEnd = !!lesson && lesson.index >= lesson.tutorial.steps.length;
  const differs = atEnd && preset ? differences(patch, preset.patch) : [];

  /**
   * What the Tutorial changed in the Display is given back as the person had it (issue 158): an overlay it turned off
   * and they never turned on again; the Snapshot its Step took, unless they took another since.
   */
  const giveBack = (l: Lesson | null) => {
    if (!l) return;
    for (const i of l.turnedOff) {
      const step = l.tutorial.steps[i];
      if (step.kind === 'display' && !l.done[i]) showOverlay(step.overlay);
    }
    if (l.took != null && l.took === snapshot) clearSnapshot();
  };
  const start = (tutorial: Tutorial) => {
    giveBack(lesson);
    onStart();
    const init = PRESETS[0];
    patches.load(init.name, init.patch);
    setLesson({ tutorial, index: -1, done: tutorial.steps.map(() => false), turnedOff: [] });
  };
  const end = () => {
    giveBack(lesson);
    onEnd();
    setLesson(null);
  };
  const scene = { patch, overlays, snapshot };
  // A Display Step whose overlay is on already starts by turning it off, so the person turns it on and sees what it adds
  // (issue 158): on, it counted as made before they did anything.
  const move = (delta: number) => {
    if (!lesson) return;
    const index = Math.min(lesson.tutorial.steps.length, Math.max(-1, lesson.index + delta));
    const next = lesson.tutorial.steps[index];
    const off = next?.kind === 'display' && !lesson.done[index] && overlays[next.overlay];
    if (off) hideOverlay(next.overlay);
    setLesson({ ...lesson, index, since: held(next, scene), turnedOff: off ? [...lesson.turnedOff, index] : lesson.turnedOff });
  };
  const matchPreset = () => preset && patches.load(preset.name, preset.patch);
  const doIt = () => {
    if (step) doStep(step, { setPatch: (change) => patches.change(change, 'tutorial'), showOverlay, takeSnapshot });
  };

  // It counts once the control rests within reach, not as a drag passes through on its way past (review 5, 2026-10-27):
  // any change before then starts the wait again.
  const made = !!step && !!lesson && isMade(step, scene, lesson.since);
  useEffect(() => {
    if (!lesson || !step || lesson.done[lesson.index] || !made) return;
    const timer = setTimeout(() => {
      if (!onTarget(step, patch)) patches.change((p) => applyStep(p, step), 'tutorial');
      setLesson((l) => l && { ...l, done: l.done.map((d, i) => d || i === l.index), took: step.kind === 'action' ? snapshot : l.took });
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [lesson, step, made, patch, patches, snapshot]);

  // The last card: the Tutorial counts as finished, and a sound that matches is named after its Preset.
  const matches = differs.length === 0;
  useEffect(() => {
    if (!atEnd || !preset) return;
    setFinished((f) => {
      if (f.has(preset.name)) return f;
      const next = new Set(f).add(preset.name);
      saveFinished(storage, next);
      return next;
    });
    if (matches && patchName !== preset.name) patches.load(preset.name, preset.patch);
  }, [atEnd, preset, matches, patchName, storage, patches]);

  // A page closed or reloaded mid-Tutorial keeps the Display as the person had it: the overlays are remembered.
  const giveBackNow = useEffectEvent(() => giveBack(lesson));
  useEffect(() => {
    const onHide = () => giveBackNow();
    addEventListener('pagehide', onHide);
    return () => removeEventListener('pagehide', onHide);
  }, []);

  return { lesson, preset, finished, differs: differs.map(controlName), start, end, move, matchPreset, doIt };
}
