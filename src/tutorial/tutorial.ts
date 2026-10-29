import { type ChoiceId, formatParam, LFO_DESTINATIONS, PARAMS, type ParamId, type Patch, paramName, setParam } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { valueToPosition } from '../patch/taper';
import type { Overlay, Overlays } from '../viewers/overlays';

/** What every Step says: what to do, then, once it is done, a note on what to hear and see. */
interface Words {
  say: string;
  note: string;
}

/**
 * One change in a Tutorial: a Parameter to a target, a choice to an option, a Display option switched on (which
 * shows the sound differently without changing it), or an Action pressed (a Snapshot, to compare against).
 */
export type Step = Words &
  (
    | { kind: 'param'; id: ParamId; to: number }
    | { [C in ChoiceId]: { kind: 'choice'; id: C; to: Patch[C] } }[ChoiceId]
    | { kind: 'display'; overlay: Overlay }
    | { kind: 'action'; id: 'snapshot' }
  );

/** A Preset rebuilt from Init in Steps, the person turning each control (issue 40). */
export interface Tutorial {
  /** The Preset it rebuilds. */
  preset: string;
  /** What the first card says before the Steps, after the Preset's about line. */
  intro?: string;
  /** What Listen repeats, in the Demo's notation (src/demo/phrase.ts), at this tempo. */
  phrase: string;
  bpm: number;
  /** One sentence on what was built, for the last card. */
  summary: string;
  steps: Step[];
}

/** How close a knob or fader must come to its target, as a share of its travel. */
export const TOLERANCE = 0.05;

/** Whether the Patch (and the Display options) are where the Step asks. An Action is made by its press, which only the page sees. */
export function reached(step: Step, patch: Patch, overlays: Overlays): boolean {
  switch (step.kind) {
    case 'param': {
      const def = PARAMS[step.id];
      return Math.abs(valueToPosition(def, patch[step.id]) - valueToPosition(def, step.to)) <= TOLERANCE + 1e-9;
    }
    case 'choice':
      return patch[step.id] === step.to;
    case 'display':
      return overlays[step.overlay];
    case 'action':
      return false;
  }
}

/** What a Step is checked against: the Patch, the Display options, and the current Snapshot's number (null when none). */
export interface Scene {
  patch: Patch;
  overlays: Overlays;
  snapshot: number | null;
}

/** What a Step's control holds: a knob's or fader's value, the Snapshot's number for an Action, nothing for the rest. */
export type Held = number | null | undefined;
export function held(step: Step | undefined, { patch, snapshot }: Scene): Held {
  if (step?.kind === 'param') return patch[step.id];
  if (step?.kind === 'action') return snapshot;
  return undefined;
}

/**
 * Whether the Step is made, `since` being what its control held when its card came to it (`held`). A knob found
 * within reach but not on its target waits for a touch, so nothing moves by itself (issue 59, decision 5); an Action
 * waits for a new press (a new Snapshot).
 */
export function isMade(step: Step, scene: Scene, since: Held): boolean {
  if (step.kind === 'action') return scene.snapshot !== null && scene.snapshot !== since;
  if (!reached(step, scene.patch, scene.overlays)) return false;
  return step.kind !== 'param' || scene.patch[step.id] !== since || scene.patch[step.id] === step.to;
}

/** Whether the Patch holds the Step's exact target, as a made Step's knob is snapped to; a Display or Action Step sets none. */
export function onTarget(step: Step, patch: Patch): boolean {
  return step.kind === 'param' || step.kind === 'choice' ? patch[step.id] === step.to : true;
}

/** Whether the Step's control is in the Display panel (a Display option, or Snapshot), rather than on the page. */
export const inDisplay = (step: Step) => step.kind === 'display' || step.kind === 'action';

/** "Do it for me": the Step's change, made through what the page offers. */
export function doStep(step: Step, page: { setPatch(change: (patch: Patch) => Patch): void; showOverlay(overlay: Overlay): void; takeSnapshot(): void }) {
  if (step.kind === 'display') page.showOverlay(step.overlay);
  else if (step.kind === 'action') page.takeSnapshot();
  else page.setPatch((patch) => applyStep(patch, step));
}

/** The Patch with the Step's change made exactly. */
export function applyStep(patch: Patch, step: Step): Patch {
  if (step.kind === 'param') return setParam(patch, step.id, step.to);
  if (step.kind === 'choice') return { ...patch, [step.id]: step.to };
  return patch;
}

/** The Patch every Step builds from Init. */
export function rebuild(tutorial: Tutorial): Patch {
  return tutorial.steps.reduce(applyStep, PRESETS[0].patch);
}

/** The Parameters and choices whose values differ from the Preset's, in the Patch's order. */
export function differences(patch: Patch, preset: Patch): (keyof Patch)[] {
  return (Object.keys(preset) as (keyof Patch)[]).filter((key) => patch[key] !== preset[key]);
}

const CHOICE_NAMES: Record<string, string> = {
  saw: 'Saw', sine: 'Sine', triangle: 'Triangle', square: 'Square', pulse: 'Pulse', sawDown: 'Saw Down',
  lowpass: 'Low-pass', highpass: 'High-pass', bandpass: 'Band-pass', notch: 'Notch',
  ...Object.fromEntries(LFO_DESTINATIONS.map((d) => [d.id, d.label])),
  note: 'On', free: 'Off',
};

/** The target as its control shows it: "800 Hz", "24 dB", "Square", or "On" for a switch or a Display option ("Press" for an Action). */
export function targetText(step: Step): string {
  if (step.kind === 'param') return formatParam(step.id, step.to);
  if (step.kind === 'display') return 'On';
  if (step.kind === 'action') return 'Press';
  if (step.id === 'filterSlope') return `${step.to} dB`;
  return CHOICE_NAMES[String(step.to)] ?? String(step.to);
}

const CHOICE_CONTROLS: Record<ChoiceId, string> = {
  waveform: 'Osc 1 Waveform', osc2Waveform: 'Osc 2 Waveform', filterMode: 'Filter Mode', filterSlope: 'Slope',
  lfoWaveform: 'LFO 1 Waveform', lfoDestination: 'LFO 1 Destination', lfoRetrigger: 'LFO 1 Retrigger',
  lfo2Waveform: 'LFO 2 Waveform', lfo2Destination: 'LFO 2 Destination', lfo2Retrigger: 'LFO 2 Retrigger', voices: 'Voices',
};

/** A control's name where it could be mistaken on its own ("Attack" is the Filter's or the Amp's). */
export function controlName(key: keyof Patch): string {
  if (key in CHOICE_CONTROLS) return CHOICE_CONTROLS[key as ChoiceId];
  // The Mixer's faders are named after their sources: "Osc 2" alone could be the tab.
  if (key.startsWith('mix')) return `${PARAMS[key as ParamId].label} level`;
  return paramName(key as ParamId);
}
