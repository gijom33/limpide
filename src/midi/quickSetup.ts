import { sameTarget, type Control, type Mapping, type Target } from './mappings';

/** One Learn step of a Quick Setup: what to map, what to ask for, and the control a factory C16 sends for it. */
export interface SetupStep {
  target: Target;
  prompt: string;
  expected: Omit<Control, 'channel'>;
}

const param = (id: Extract<Target, { kind: 'param' }>['id']): Target => ({ kind: 'param', id });
const action = (id: Extract<Target, { kind: 'action' }>['id']): Target => ({ kind: 'action', id });

const ENCODERS: Target[] = [
  param('cutoff'),
  param('resonance'),
  param('filterEnvAmount'),
  param('osc2Detune'),
  param('lfoRate'),
  param('lfoAmount'),
  { kind: 'choice', id: 'waveform' },
  param('glide'),
];
const FADERS: Target[] = [param('ampAttack'), param('ampDecay'), param('ampSustain'), param('ampRelease')];
const BUTTONS: Target[] = [action('hold'), action('freeze'), action('snapshot'), action('nextPreset'), action('previousPreset')];

/**
 * The TempoPAD C16 layout: the most educational controls under your hands. The factory CCs (encoders 1–8,
 * faders 33–36, buttons from 49) were seen on a real C16; they only guide the prompts, since each control can
 * be reassigned on the device and every step is learned.
 */
export const C16_SETUP: SetupStep[] = [
  ...ENCODERS.map((target, i) => ({ target, prompt: `Turn encoder ${i + 1}`, expected: { kind: 'cc' as const, number: 1 + i } })),
  ...FADERS.map((target, i) => ({ target, prompt: `Move fader ${i + 1}`, expected: { kind: 'cc' as const, number: 33 + i } })),
  ...BUTTONS.map((target, i) => ({ target, prompt: `Press button ${i + 1}`, expected: { kind: 'cc' as const, number: 49 + i } })),
];

export interface QuickSetupState {
  steps: readonly SetupStep[];
  index: number;
  outcomes: ('mapped' | 'skipped' | undefined)[];
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
  return { steps, index: 0, outcomes: [], phase: 'running', before };
}

/** Moves the Setup on: a step learned or skipped, back a step, finished early (keeping what is mapped) or cancelled. */
export function quickSetupReducer(state: QuickSetupState, event: QuickSetupEvent): QuickSetupState {
  if (state.phase !== 'running') return state;
  const advance = (outcome: 'mapped' | 'skipped'): QuickSetupState => {
    const outcomes = [...state.outcomes];
    outcomes[state.index] = outcome;
    const index = state.index + 1;
    return { ...state, outcomes, index, phase: index >= state.steps.length ? 'done' : 'running' };
  };
  switch (event.type) {
    case 'learned':
      return sameTarget(event.mapping.target, state.steps[state.index].target) ? advance('mapped') : state;
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

/** Whether a step was learned from a control other than the factory C16's (on any channel). */
export const differsFromExpected = (step: SetupStep, mapping: Mapping) =>
  mapping.control.kind !== step.expected.kind || mapping.control.number !== step.expected.number;
