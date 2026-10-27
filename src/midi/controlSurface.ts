import type { ChoiceId, ParamId } from '../patch/patch';
import { detectEncoderMode, detectKnobMode, relativeDelta } from './encoderMode';
import { type ActionId, type Control, controlKey, type Mapping, type MappingStore, sameControl, type Target } from './mappings';
import type { MidiMessage } from './parser';

/** Values gathered from a knob while learning it, enough to tell its Encoder Mode. */
const LEARN_VALUES = 4;
/** A shorter turn still completes, once the knob has been still this long. */
const LEARN_SETTLE_MS = 500;
/** A Relative step moves a Parameter this much of its travel, so a sweep takes a few turns of an encoder. */
const RELATIVE_STEP = 0.01;
/** An Absolute knob landing this close to a Parameter's position picks it up: half a MIDI step either side. */
const PICKUP_TOLERANCE = 0.5 / 127 + 1e-9;
/** Encoder clicks per choice, so stepping through Waveforms is deliberate rather than jumpy. */
const CLICKS_PER_CHOICE = 2;
/** Values a knob of unknown Encoder Mode sends before it moves anything: enough to tell its mode. */
const DETECT_VALUES = 3;

export type LearnState =
  | { phase: 'off' }
  | { phase: 'armed'; target: Target | null; learned?: Mapping }
  | { phase: 'listening'; target: Target; control: Control };

interface Synth {
  store: MappingStore;
  /** A Parameter's control position (0–1), and setting it. */
  position(id: ParamId): number;
  setPosition(id: ParamId, position: number): void;
  action(id: ActionId): void;
  /** A choice's current index among its options, in on-screen order, and setting it. */
  choice(id: ChoiceId): { index: number; count: number };
  setChoice(id: ChoiceId, index: number): void;
  press(note: number, velocity: number): void;
  release(note: number): void;
  /** A Controller moved a Parameter ('moved'), or turned its knob without reaching it yet ('waiting', Pickup). */
  touched?(target: Target, state: 'moved' | 'waiting'): void;
  /** MIDI Learn moved on: started, a target selected, a Mapping made, or stopped. */
  learnChanged?(state: LearnState): void;
}

/** Pickup per Absolute control: where its knob was, and the position it last gave the Parameter (if following). */
interface PickupState {
  knob?: number;
  following?: number;
}

/**
 * Where Controller messages meet the synth: MIDI Learn creates Mappings; mapped controls move their Parameter
 * or trigger their Action; unmapped notes play.
 */
export function createControlSurface(synth: Synth) {
  const { store } = synth;
  let learn: LearnState = { phase: 'off' };
  const setLearn = (next: LearnState) => {
    learn = next;
    synth.learnChanged?.(next);
  };
  // The control just learned keeps sending for a moment (the rest of a turn, a button's release): until it has
  // been still that long, it is not learned again for the next target.
  let justLearned: { control: Control; quiet?: ReturnType<typeof setTimeout> } | null = null;
  const settleJustLearned = () => {
    if (!justLearned) return;
    clearTimeout(justLearned.quiet);
    justLearned.quiet = setTimeout(() => (justLearned = null), LEARN_SETTLE_MS);
  };
  const learned = (mapping: Mapping) => {
    store.set(mapping);
    clearTimeout(justLearned?.quiet);
    justLearned = { control: mapping.control };
    settleJustLearned();
    setLearn({ phase: 'armed', target: null, learned: mapping });
  };
  // Controls the selected target must not be learned from (Quick Setup's other steps').
  let avoiding: readonly Control[] = [];
  let values: number[] = [];
  let settle: ReturnType<typeof setTimeout> | undefined;
  const pickups = new Map<string, PickupState>();
  const pressed = new Map<string, boolean>();
  const clicks = new Map<string, number>(); // encoder clicks towards the next choice, per control
  const detecting = new Map<string, number[]>(); // the first values of knobs finding their Encoder Mode

  const moveParam = (mapping: Mapping, id: ParamId, value: number) => {
    const target = mapping.target;
    if (mapping.mode === 'trigger' || mapping.mode === 'toggle' || mapping.mode === 'detect') return;
    const current = synth.position(id);
    if (mapping.mode !== 'absolute') {
      synth.setPosition(id, Math.min(1, Math.max(0, current + relativeDelta(mapping.mode, value) * RELATIVE_STEP)));
      synth.touched?.(target, 'moved');
      return;
    }
    const knob = value / 127;
    const state = pickups.get(controlKey(mapping.control)) ?? {};
    // Changed elsewhere since this knob last set it: the knob has to catch the new value.
    if (state.following !== undefined && Math.abs(state.following - current) > 1e-9) state.following = undefined;
    const crossed = state.knob !== undefined && (state.knob - current) * (knob - current) <= 0;
    if (state.following === undefined && (crossed || Math.abs(knob - current) <= PICKUP_TOLERANCE))
      state.following = knob;
    state.knob = knob;
    if (state.following !== undefined) {
      synth.setPosition(id, knob);
      state.following = synth.position(id); // what it took: a stepped Parameter rounds
    }
    pickups.set(controlKey(mapping.control), state);
    synth.touched?.(target, state.following !== undefined ? 'moved' : 'waiting');
  };

  const moveChoice = (mapping: Mapping, id: ChoiceId, value: number) => {
    if (mapping.mode === 'trigger' || mapping.mode === 'detect') return;
    const { index, count } = synth.choice(id);
    let next: number;
    if (mapping.mode === 'toggle') {
      next = (index + 1) % count; // a button steps on, round to the first
    } else if (mapping.mode === 'absolute') {
      next = Math.min(count - 1, Math.floor((value / 128) * count));
    } else {
      const total = (clicks.get(controlKey(mapping.control)) ?? 0) + relativeDelta(mapping.mode, value);
      const steps = Math.trunc(total / CLICKS_PER_CHOICE);
      next = Math.min(count - 1, Math.max(0, index + steps));
      // Turns past either end are dropped, so turning back responds at once.
      clicks.set(controlKey(mapping.control), next === index + steps ? total - steps * CLICKS_PER_CHOICE : 0);
    }
    if (next !== index) synth.setChoice(id, next);
    synth.touched?.(mapping.target, 'moved');
  };

  const apply = (mapping: Mapping, message: MidiMessage) => {
    const { target } = mapping;
    if (mapping.mode === 'detect') {
      if (message.type !== 'cc') return;
      const values = [...(detecting.get(controlKey(mapping.control)) ?? []), message.value];
      detecting.set(controlKey(mapping.control), values);
      if (values.length < DETECT_VALUES) return synth.touched?.(target, 'waiting');
      detecting.delete(controlKey(mapping.control));
      const found: Mapping = { ...mapping, mode: detectKnobMode(values) };
      store.replace(found);
      return apply(found, message);
    }
    if (target.kind === 'param' || target.kind === 'choice') {
      if (message.type !== 'cc') return;
      if (target.kind === 'param') moveParam(mapping, target.id, message.value);
      else moveChoice(mapping, target.id, message.value);
      return;
    }
    // An Action fires on each press: a note-on, a toggle button's every message, or a button's CC rising past the
    // middle.
    if (mapping.mode === 'toggle') {
      if (message.type === 'cc') synth.action(target.id);
      return;
    }
    const down = message.type === 'noteOn' || (message.type === 'cc' && message.value >= 64);
    const wasDown = pressed.get(controlKey(mapping.control)) ?? false;
    pressed.set(controlKey(mapping.control), down);
    if (down && (message.type === 'noteOn' || !wasDown)) synth.action(target.id);
  };

  const finishListening = () => {
    clearTimeout(settle);
    if (learn.phase !== 'listening') return;
    learned({
      control: learn.control,
      target: learn.target,
      mode: detectEncoderMode(values),
    });
  };

  /** Feeds a message to MIDI Learn; true when Learn used it up. */
  const learnFrom = (message: MidiMessage): boolean => {
    if (learn.phase === 'listening') {
      if (
        message.type !== 'cc' ||
        !sameControl(learn.control, {
          kind: 'cc',
          channel: message.channel,
          number: message.controller,
        })
      )
        return false;
      values.push(message.value);
      clearTimeout(settle);
      if (values.length >= LEARN_VALUES) finishListening();
      else settle = setTimeout(finishListening, LEARN_SETTLE_MS);
      return true;
    }
    if (learn.phase !== 'armed' || !learn.target) return false;
    const { target } = learn;
    const from: Control =
      message.type === 'cc'
        ? { kind: 'cc', channel: message.channel, number: message.controller }
        : { kind: 'note', channel: message.channel, number: message.note };
    if (justLearned && sameControl(justLearned.control, from)) {
      settleJustLearned();
      return false;
    }
    if (avoiding.some((c) => sameControl(c, from))) return false;
    if (message.type === 'cc') {
      const control: Control = {
        kind: 'cc',
        channel: message.channel,
        number: message.controller,
      };
      if (target.kind === 'action') {
        learned({ control, target, mode: 'trigger' });
      } else {
        setLearn({ phase: 'listening', target, control });
        values = [];
        learnFrom(message);
      }
      return true;
    }
    if (message.type === 'noteOn' && target.kind === 'action') {
      learned({
        control: {
          kind: 'note',
          channel: message.channel,
          number: message.note,
        },
        target,
        mode: 'trigger',
      });
      return true;
    }
    return false;
  };

  return {
    handle(message: MidiMessage) {
      if (learnFrom(message)) return;
      const mapping = store.find(
        message.type === 'cc'
          ? { kind: 'cc', channel: message.channel, number: message.controller }
          : { kind: 'note', channel: message.channel, number: message.note },
      );
      if (mapping) return apply(mapping, message);
      if (message.type === 'noteOn') synth.press(message.note, message.velocity);
      else if (message.type === 'noteOff') synth.release(message.note);
    },
    startLearn() {
      if (learn.phase === 'off') setLearn({ phase: 'armed', target: null });
    },
    /** Selects what the next control moved is learned for, other than any control in `avoid`. */
    select(target: Target, avoid: readonly Control[] = []) {
      finishListening();
      avoiding = avoid;
      setLearn({ phase: 'armed', target });
    },
    stopLearn() {
      clearTimeout(settle);
      if (learn.phase !== 'off') setLearn({ phase: 'off' });
    },
    learnState: (): LearnState => learn,
  };
}

export type ControlSurface = ReturnType<typeof createControlSurface>;
