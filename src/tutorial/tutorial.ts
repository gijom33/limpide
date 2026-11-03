import type { PhraseAtTempo } from '../demo/phrase';
import { WAVEFORM_NAMES } from '../music/harmonics';
import {
  type ChoiceId, formatParam, LFO_DESTINATIONS, LFO_KEYS, PARAMS, type ParamId, type Patch, paramName, setLfo, setParam, soundFields,
} from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { valueToPosition } from '../patch/taper';
import type { Overlay, Overlays } from '../viewers/overlays';

/** A Viewer a Step can point at, by its accessible name: a Tap's Scope or Spectrum, or the Envelope Timeline. */
export type ViewerName = `${'Oscillator' | 'Filter' | 'Amp'} ${'Scope' | 'Spectrum'}` | 'Envelope Timeline';

/**
 * What every Step says: what to do, then, once it is done, a note on what to hear and see; and the Viewer where the
 * note's change shows, if it names or points at one, which the page brings into view with the control (issue 105).
 */
interface Words {
  say: string;
  note: string;
  viewer?: ViewerName;
}

/** A knob or fader and its target. */
export interface ParamTarget {
  id: ParamId;
  to: number;
}

/**
 * One change in a Tutorial: a Parameter to a target, a choice to an option, a Display option switched on (which
 * shows the sound differently without changing it), or an Action pressed (a Snapshot, to compare against). Or several
 * faders at once, in the order they stand: a drill met in an earlier Tutorial, in one Step (issue 190, decision 3).
 */
export type Step = Words &
  (
    | ({ kind: 'param' } & ParamTarget)
    | { kind: 'params'; faders: ParamTarget[] }
    | { [C in ChoiceId]: { kind: 'choice'; id: C; to: Patch[C] } }[ChoiceId]
    | { kind: 'display'; overlay: Overlay }
    | { kind: 'action'; id: 'snapshot' }
  );

/**
 * A Preset rebuilt from Init in Steps, the person turning each control (issue 40). Its phrase, in the Demo's notation
 * (src/demo/phrase.ts), at its tempo, is what Listen repeats.
 */
export interface Tutorial extends PhraseAtTempo {
  /** The Preset it rebuilds. */
  preset: string;
  /**
   * What the first card says before the Steps: what the Tutorial teaches and what the person will hear, in its own
   * words rather than its Preset's description (issue 129, decision 6).
   */
  intro: string;
  /** A short line of what it teaches, for the Tutorial menu and the end card of the Tutorial before it (decision 8). */
  teaches: string;
  /** One sentence on what was built, for the last card. */
  summary: string;
  steps: Step[];
}

/** How close a knob or fader must come to its target, as a share of its travel; a stepped one, onto it. */
export const TOLERANCE = 0.05;

/** Whether a knob or fader is within reach of its target. */
function withinReach(patch: Patch, { id, to }: ParamTarget): boolean {
  const def = PARAMS[id];
  // A stepped knob (a note value, a Semitone) on its step: its neighbours can sit within the tolerance (issue 137).
  if (def.step) return Math.abs(patch[id] - to) < def.step / 2;
  return Math.abs(valueToPosition(def, patch[id]) - valueToPosition(def, to)) <= TOLERANCE + 1e-9;
}

/** Whether the Patch (and the Display options) are where the Step asks. An Action is made by its press, which only the page sees. */
export function reached(step: Step, patch: Patch, overlays: Overlays): boolean {
  switch (step.kind) {
    case 'param':
      return withinReach(patch, step);
    case 'params':
      return step.faders.every((target) => withinReach(patch, target));
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

/**
 * What a Step's control holds: a knob's or fader's value (each one's, for several), the Snapshot's number for an Action,
 * nothing for the rest.
 */
export type Held = number | readonly number[] | null | undefined;
export function held(step: Step | undefined, { patch, snapshot }: Scene): Held {
  if (step?.kind === 'param') return patch[step.id];
  if (step?.kind === 'params') return step.faders.map(({ id }) => patch[id]);
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
  // Several faders: any one touched since, or all on their targets.
  if (step.kind === 'params') return onTarget(step, scene.patch) || step.faders.some(({ id }, i) => !Array.isArray(since) || scene.patch[id] !== since[i]);
  return step.kind !== 'param' || scene.patch[step.id] !== since || scene.patch[step.id] === step.to;
}

/** Whether the Patch holds the Step's exact target, as a made Step's knob is snapped to; a Display or Action Step sets none. */
export function onTarget(step: Step, patch: Patch): boolean {
  if (step.kind === 'params') return step.faders.every(({ id, to }) => patch[id] === to);
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

/**
 * The Patch a Step's card starts from (issue 193): on an LFO's Rate, Sync is switched so the Rate knob turns what the
 * Step asks, its Hz or its note value (the Wobble's 3 Hz, once Sync was switched on early). Any other Step, or Sync
 * already right, leaves the Patch as it is.
 */
export function readyFor(step: Step, patch: Patch): Patch {
  if (step.kind !== 'param') return patch;
  for (const lfo of [1, 2] as const) {
    const keys = LFO_KEYS[lfo];
    const sync = step.id === keys.rate ? 'off' : step.id === keys.note ? 'on' : undefined;
    if (sync && patch[keys.sync] !== sync) return setLfo(patch, { sync }, lfo);
  }
  return patch;
}

/** The Patch with the Step's change made exactly, a Rate's knob turning it (`readyFor`). */
export function applyStep(patch: Patch, step: Step): Patch {
  if (step.kind === 'param') return setParam(readyFor(step, patch), step.id, step.to);
  if (step.kind === 'params') return step.faders.reduce((p, { id, to }) => setParam(p, id, to), patch);
  if (step.kind === 'choice') return { ...patch, [step.id]: step.to };
  return patch;
}

/** The Patch every Step builds from Init. */
export function rebuild(tutorial: Tutorial): Patch {
  return tutorial.steps.reduce(applyStep, PRESETS[0].patch);
}

/**
 * The Parameters and choices whose values differ from the Preset's, in the Patch's order. Not the keyboard's octave: no
 * Step sets it, and loading the Preset at the end brings it (issue 125).
 */
export function differences(patch: Patch, preset: Patch): (keyof Patch)[] {
  return soundFields(preset).filter((key) => patch[key] !== preset[key]);
}

const CHOICE_NAMES: Record<string, string> = {
  ...WAVEFORM_NAMES, sawDown: 'Saw Down',
  lowpass: 'Low-pass', highpass: 'High-pass', bandpass: 'Band-pass', notch: 'Notch',
  ...Object.fromEntries(LFO_DESTINATIONS.map((d) => [d.id, d.label])),
  note: 'On', free: 'Off', on: 'On', off: 'Off', white: 'White', pink: 'Pink',
};

/** The target as its control shows it: "800 Hz", "24 dB", "Square", or "On" for a switch or a Display option ("Press" for an Action). */
export function targetText(step: Step): string {
  if (step.kind === 'param') return formatParam(step.id, step.to);
  if (step.kind === 'params') return step.faders.map(({ id, to }) => formatParam(id, to)).join(', ');
  if (step.kind === 'display') return 'On';
  if (step.kind === 'action') return 'Press';
  if (step.id === 'filterSlope') return `${step.to} dB`;
  if (step.id === 'subOctave') return `−${-step.to} oct`;
  return CHOICE_NAMES[String(step.to)] ?? String(step.to);
}

const CHOICE_CONTROLS: Record<ChoiceId, string> = {
  waveform: 'Osc 1 Waveform', osc2Waveform: 'Osc 2 Waveform', subOctave: 'Sub Octave', subWaveform: 'Sub Waveform', noiseColour: 'Noise Colour', filterMode: 'Filter Mode', filterSlope: 'Slope',
  lfoWaveform: 'LFO 1 Waveform', lfoDestination: 'LFO 1 Destination', lfoRetrigger: 'LFO 1 Retrigger', lfoSync: 'LFO 1 Sync',
  lfo2Waveform: 'LFO 2 Waveform', lfo2Destination: 'LFO 2 Destination', lfo2Retrigger: 'LFO 2 Retrigger', lfo2Sync: 'LFO 2 Sync', voices: 'Voices', legato: 'Legato',
};

/** A control's name where it could be mistaken on its own ("Attack" is the Filter's or the Amp's). */
export function controlName(key: keyof Patch): string {
  if (key in CHOICE_CONTROLS) return CHOICE_CONTROLS[key as ChoiceId];
  // The Mixer's faders are named after their sources: "Osc 2" alone could be the tab.
  if (key.startsWith('mix')) return `${PARAMS[key as ParamId].label} level`;
  return paramName(key as ParamId);
}
