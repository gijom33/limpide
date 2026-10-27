import { type ChoiceId, formatParam, PARAMS, type ParamId, type Patch, paramName, setParam } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { valueToPosition } from '../patch/taper';
import type { Overlay, Overlays } from '../viewers/overlays';

/** What every Step says: what to do, then, once it is done, a note on what to hear and see. */
interface Words {
  say: string;
  note: string;
}

/**
 * One change in a Tutorial: a Parameter to a target, a choice to an option, or a Display option switched on (which
 * shows the sound differently without changing it).
 */
export type Step = Words &
  (
    | { kind: 'param'; id: ParamId; to: number }
    | { [C in ChoiceId]: { kind: 'choice'; id: C; to: Patch[C] } }[ChoiceId]
    | { kind: 'display'; overlay: Overlay }
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

/** Whether the Patch (and the Display options) are where the Step asks. */
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
  }
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
  pitch: 'Pitch', osc2Pitch: 'Osc 2 Pitch', detune: 'Detune', pulseWidth: 'Pulse Width', cutoff: 'Cutoff', resonance: 'Resonance',
  note: 'On', free: 'Off',
};

/** The target as its control shows it: "800 Hz", "24 dB", "Square", or "On" for a switch or a Display option. */
export function targetText(step: Step): string {
  if (step.kind === 'param') return formatParam(step.id, step.to);
  if (step.kind === 'display') return 'On';
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
