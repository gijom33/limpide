import { sameControl, sameTarget, type Control, type Mapping, type Target } from './mappings';

/** One Learn step of a Quick Setup: what to map, where it sits ("Filter Envelope"), and what to ask for. */
export interface SetupStep {
  target: Target;
  group?: string;
  prompt: string;
}

type ParamTarget = Extract<Target, { kind: 'param' }>['id'];
const params = (group: string, ...ids: ParamTarget[]): SetupStep[] =>
  ids.map((id) => ({ target: { kind: 'param', id }, group, prompt: 'Move a control' }));
const actions = (...ids: Extract<Target, { kind: 'action' }>['id'][]): SetupStep[] =>
  ids.map((id) => ({ target: { kind: 'action', id }, prompt: 'Press a button' }));

/**
 * Every Parameter played live (the knobs worth turning while playing and the faders, ADR-0008), in the page's
 * order: the Oscillators, the Filter, the Amp, the LFOs; then the Actions. Settings made once for a sound (Octave,
 * the Waveforms, Pulse Width, Filter Mode, Velocity, Glide, Voices…) are left to MIDI Learn.
 */
export const QUICK_SETUP: SetupStep[] = [
  ...params('Osc 2', 'osc2Detune'),
  ...params('Mixer', 'mixOsc1', 'mixOsc2', 'mixNoise', 'mixSub'),
  ...params('Filter', 'cutoff', 'resonance', 'filterEnvAmount'),
  ...params('Filter Envelope', 'filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'),
  ...params('Amp Envelope', 'ampAttack', 'ampDecay', 'ampSustain', 'ampRelease'),
  ...params('LFO 1', 'lfoRate', 'lfoAmount'),
  ...params('LFO 2', 'lfo2Rate', 'lfo2Amount'),
  ...actions('hold', 'freeze', 'snapshot', 'previousPreset', 'nextPreset'),
];

export interface QuickSetupState {
  steps: readonly SetupStep[];
  index: number;
  outcomes: ('mapped' | 'skipped' | undefined)[];
  /** The control each step was learned from, so no other step takes it. */
  controls: (Control | undefined)[];
  phase: 'running' | 'done' | 'cancelled';
  /** The Mappings before the Setup began, given back if it is cancelled. */
  before: readonly Mapping[];
}

export type QuickSetupEvent =
  | { type: 'learned'; mapping: Mapping }
  | { type: 'skip' }
  | { type: 'back' }
  | { type: 'finish' }
  | { type: 'cancel' };

export function startQuickSetup(steps: readonly SetupStep[], before: readonly Mapping[]): QuickSetupState {
  return { steps, index: 0, outcomes: [], controls: [], phase: 'running', before };
}

/**
 * The controls the current step must not be learned from: those learned for the Setup's other steps. A fader still
 * moving after its own step, however long it pauses, never fills the next one.
 */
export const takenControls = (state: QuickSetupState): Control[] =>
  state.controls.filter((c, i): c is Control => c !== undefined && i !== state.index);

/** Moves the Setup on: a step learned or skipped, back a step, finished early (keeping what is mapped) or cancelled. */
export function quickSetupReducer(state: QuickSetupState, event: QuickSetupEvent): QuickSetupState {
  if (state.phase !== 'running') return state;
  const advance = (outcome: 'mapped' | 'skipped', control?: Control): QuickSetupState => {
    const outcomes = [...state.outcomes];
    outcomes[state.index] = outcome;
    const controls = [...state.controls];
    if (control) controls[state.index] = control;
    const index = state.index + 1;
    return { ...state, outcomes, controls, index, phase: index >= state.steps.length ? 'done' : 'running' };
  };
  switch (event.type) {
    case 'learned': {
      const { control, target } = event.mapping;
      if (!sameTarget(target, state.steps[state.index].target)) return state;
      if (takenControls(state).some((c) => sameControl(c, control))) return state;
      return advance('mapped', control);
    }
    case 'skip':
      return advance(state.outcomes[state.index] ?? 'skipped');
    case 'back':
      return { ...state, index: Math.max(0, state.index - 1) };
    case 'finish':
      return { ...state, phase: 'done' };
    case 'cancel':
      return { ...state, phase: 'cancelled' };
  }
}
