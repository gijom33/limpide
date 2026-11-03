import { BPM_STEP, bpmPosition, clampBpm, positionBpm } from '../music/tempo';
import { stepParamBy } from '../patch/grid';
import { type ChoiceId, PARAMS, type ParamId } from '../patch/patch';
import { answers, type KnownController } from './controller';
import { detectEncoderMode, detectKnobMode, relativeDelta, relativeModeOf } from './encoderMode';
import {
  type ActionId, type Control, controlKey, type KnobMode, knobModeOf, type Mapping, type MappingStore, PITCH_BEND, sameControl,
  type Target,
} from './mappings';
import type { MidiMessage } from './parser';

/** Values gathered from a knob while learning it, enough to tell its Encoder Mode. */
const LEARN_VALUES = 4;
/** A shorter turn still completes, once the knob has been still this long. */
const LEARN_SETTLE_MS = 500;
/**
 * A stepped dial's least travel a Relative click (a Parameter with a Grid moves a step of it, issue 160), so a long
 * list of steps still takes no more than a click each.
 */
const RELATIVE_STEP = 0.01;
/** An Absolute knob landing this close to a Parameter's position picks it up: half a MIDI step either side. */
const PICKUP_TOLERANCE = 0.5 / 127 + 1e-9;
/** Encoder clicks per choice, so stepping through Waveforms is deliberate rather than jumpy. */
const CLICKS_PER_CHOICE = 2;
/** Values a knob of unknown Encoder Mode sends before it moves anything: enough to tell its mode. */
const DETECT_VALUES = 3;
/** The sustain pedal and the mod wheel, by their standard CC numbers. */
const SUSTAIN = 64;
const MOD_WHEEL = 1;
/**
 * The channel mode messages a keyboard's or a DAW's panic sends (issue 185): All Sound Off, Reset All Controllers and
 * All Notes Off, by their CC numbers. They are never a control: never learned, never taken by a Mapping.
 */
const ALL_SOUND_OFF = 120;
const RESET_ALL_CONTROLLERS = 121;
const ALL_NOTES_OFF = 123;

/** What MIDI Learn and the Mappings see: Notes and control changes, the bend wheel among them (never aftertouch). */
type ControlMessage = Exclude<MidiMessage, { type: 'pitchBend' } | { type: 'program' } | { type: 'pressure' }>;

export type LearnState =
  | { phase: 'off' }
  | { phase: 'armed'; target: Target | null; learned?: Mapping }
  | { phase: 'listening'; target: Target; control: Control };

interface Synth {
  store: MappingStore;
  /** A Parameter's control position (0–1), and setting it. */
  position(id: ParamId): number;
  setPosition(id: ParamId, position: number): void;
  /** A Parameter's value, and setting it: a Relative knob steps it on its Grid (issue 160). */
  value(id: ParamId): number;
  setValue(id: ParamId, value: number): void;
  /** The Parameter a control mapped to `id` turns now: an LFO's Rate turns its note value while Sync is on (issue 112). */
  turned(id: ParamId): ParamId;
  /** The tempo's position (0–1, from the slowest BPM to the fastest), and setting it (issue 112). */
  tempoPosition(): number;
  setTempoPosition(position: number): void;
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
  /** What a keyboard's own controls do while nothing is mapped to them (issue 52): the bend wheel (−1 to 1), the
   *  sustain pedal, a Program Change. The mod wheel turns LFO 1's Depth. */
  bend?(amount: number): void;
  pedal?(down: boolean): void;
  program?(number: number): void;
  /**
   * Aftertouch, how hard the keys are pressed (0–1): the channel's or the highest held Note's, whichever is higher. It
   * moves its Destination, and is never learned (issue 132).
   */
  pressure?(amount: number): void;
  /** All Sound Off (issue 185): every Voice falls silent at once, its Release cut short, the pedal's Notes too. */
  silence?(): void;
}

/** What a knob or a fader moves: a Parameter, or the tempo. */
interface Dial {
  /** Its position (0–1), and setting it. */
  get(): number;
  set(position: number): void;
  /** Its travel per step, if it moves by whole steps (an Octave, a note value, a BPM), else 0. */
  unit: number;
  /** Moves it `steps` steps, signed: a Parameter's of its Grid (issue 160), the tempo's of a BPM (issue 193). */
  step?(steps: number): void;
  /** Whether its travel is centred on zero (Detune, the Filter's Amount), so CC 64 is its zero (issue 160). */
  centred?: boolean;
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
  const keepOff = (control: Control) => {
    clearTimeout(justLearned?.quiet);
    justLearned = { control };
    settleJustLearned();
  };
  const learned = (mapping: Mapping) => {
    store.set(mapping);
    keepOff(mapping.control);
    setLearn({ phase: 'armed', target: null, learned: mapping });
  };
  // Controls the selected target must not be learned from (Quick Setup's other steps').
  let avoiding: readonly Control[] = [];
  let values: number[] = [];
  let settle: ReturnType<typeof setTimeout> | undefined;
  const pickups = new Map<string, PickupState>();
  const pressed = new Map<string, boolean>();
  const clicks = new Map<string, number>(); // encoder clicks towards the next choice, per control
  const gathered = new Map<string, number>(); // a Relative knob's travel towards a stepped dial's next step, per control
  const thirds = new Map<string, number>(); // a Relative knob's share of a Grid step not yet moved (a C16's 66s), per control
  const detecting = new Map<string, number[]>(); // the first values of knobs finding their Encoder Mode
  const lastValues = new Map<string, number>(); // the last value each CC sent, for a Mapping switched to Relative by hand
  // Aftertouch (issue 132, the owner's decision 1): the channel's, and each held Note's own until its release. The
  // pressure is the highest of them, one for every Note.
  let channelPressure = 0;
  const notePressures = new Map<string, number>(); // by channel and Note
  const pressure = () => Math.max(channelPressure, ...notePressures.values());
  const noteKey = (channel: number, note: number) => `${channel}:${note}`;
  const pressureMoved = (message: Extract<MidiMessage, { type: 'pressure' }>) => {
    if (message.note === undefined) channelPressure = message.value;
    else notePressures.set(noteKey(message.channel, message.note), message.value);
    synth.pressure?.(pressure());
  };
  // The Notes a Controller holds down, by channel and Note, so a panic can release them (issue 185).
  const sounding = new Map<string, number>();
  /**
   * A panic (issue 185): All Notes Off releases every Note a Controller holds, whichever channel it came on (Limpide
   * plays every channel as one instrument), the pedal still holding them as MIDI says; All Sound Off silences at once;
   * Reset All Controllers lifts the pedal, centres the bend and forgets every pressure.
   */
  const channelMode = (controller: number) => {
    if (controller === RESET_ALL_CONTROLLERS) {
      synth.pedal?.(false);
      synth.bend?.(0);
      channelPressure = 0;
      notePressures.clear();
      synth.pressure?.(0);
      return;
    }
    for (const note of sounding.values()) synth.release(note);
    sounding.clear();
    const before = pressure();
    notePressures.clear();
    if (pressure() !== before) synth.pressure?.(pressure());
    if (controller === ALL_SOUND_OFF) synth.silence?.();
  };
  /** A released Note's pressure is forgotten; the pressure is told again if that changes it. */
  const forgetPressure = (channel: number, note: number) => {
    const before = pressure();
    if (!notePressures.delete(noteKey(channel, note))) return;
    if (pressure() !== before) synth.pressure?.(pressure());
  };

  /**
   * A Relative message's steps, as sent; but a fast turn's message (more than a step) from a known Controller counts as
   * that Controller says, whatever made the Mapping (its layout, Learn, Quick Setup): a C16's 66 a third of a step (issue
   * 193).
   */
  const relativeSteps = (from: KnownController | undefined, mode: 'relative-twos' | 'relative-centred', value: number) => {
    const delta = relativeDelta(mode, value);
    const fastTurn = from?.fastTurnStep;
    if (fastTurn === undefined || Math.abs(delta) <= 1) return delta;
    return Math.sign(delta) * fastTurn;
  };

  /**
   * A knob or fader moving a dial (a Parameter, or the tempo): Relative by steps, Absolute with Pickup. A Parameter with
   * a Grid moves a step of it a click (issue 160), and the tempo a BPM (issue 193), a C16's thirds gathered into whole
   * steps; a stepped dial (`unit`, its travel per step: an Octave, a note value) gathers a Relative knob's steps until
   * they make a whole one, a step for every two clicks at most, so a slow turn or a C16's thirds still move it.
   */
  const moveDial = (mapping: Mapping, dial: Dial, value: number, from: KnownController | undefined) => {
    const target = mapping.target;
    if (mapping.mode === 'trigger' || mapping.mode === 'toggle' || mapping.mode === 'detect') return;
    const current = dial.get();
    if (mapping.mode !== 'absolute') {
      const steps = relativeSteps(from, mapping.mode, value);
      const key = controlKey(mapping.control);
      if (dial.step) {
        // A turn back forgets the thirds gathered the other way, so it answers at once.
        const before = thirds.get(key) ?? 0;
        const total = (Math.sign(before) === -Math.sign(steps) ? 0 : before) + steps;
        const whole = Math.trunc(total + (total > 0 ? 1e-9 : -1e-9));
        thirds.set(key, total - whole);
        if (whole) dial.step(whole);
      } else {
        const travel = (gathered.get(key) ?? 0) + steps * Math.max(RELATIVE_STEP, dial.unit / CLICKS_PER_CHOICE);
        const whole = Math.trunc(travel / dial.unit + (travel > 0 ? 1e-9 : -1e-9));
        gathered.set(key, travel - whole * dial.unit);
        if (whole) dial.set(Math.min(1, Math.max(0, current + whole * dial.unit)));
      }
      synth.touched?.(target, 'moved');
      return;
    }
    // A control centred on zero has its zero at CC 64 exactly, 0 to 64 its lower half and 64 to 127 its upper (issue
    // 160); any other spreads the 128 values evenly.
    const knob = dial.centred ? (value <= 64 ? value / 128 : 0.5 + (value - 64) / 126) : value / 127;
    const state = pickups.get(controlKey(mapping.control)) ?? {};
    // Changed elsewhere since this knob last set it: the knob has to catch the new value.
    if (state.following !== undefined && Math.abs(state.following - current) > 1e-9) state.following = undefined;
    const crossed = state.knob !== undefined && (state.knob - current) * (knob - current) <= 0;
    if (state.following === undefined && (crossed || Math.abs(knob - current) <= PICKUP_TOLERANCE))
      state.following = knob;
    state.knob = knob;
    if (state.following !== undefined) {
      dial.set(knob);
      state.following = dial.get(); // what it took: a stepped dial rounds
    }
    pickups.set(controlKey(mapping.control), state);
    synth.touched?.(target, state.following !== undefined ? 'moved' : 'waiting');
  };

  /** A Parameter as a dial: the one its control turns now. */
  const paramDial = (id: ParamId): Dial => {
    const turned = synth.turned(id);
    const def = PARAMS[turned];
    const { step, min, max } = def;
    return {
      get: () => synth.position(turned),
      set: (p: number) => synth.setPosition(turned, p),
      unit: step ? step / (max - min) : 0,
      step: step ? undefined : (steps) => synth.setValue(turned, stepParamBy(def, synth.value(turned), steps)),
      centred: min === -max,
    };
  };
  /** The tempo as a dial (issue 112): a Relative click a BPM, a C16's thirds gathered (issue 193). */
  const tempoDial = (): Dial => ({
    get: synth.tempoPosition,
    set: synth.setTempoPosition,
    unit: BPM_STEP,
    step: (steps) => synth.setTempoPosition(bpmPosition(clampBpm(positionBpm(synth.tempoPosition()) + steps))),
  });

  /** Whether a button's message is a press: its CC rising past the middle, not its release (a momentary one's 0). */
  const pressedNow = (mapping: Mapping, value: number) => {
    const down = value >= 64;
    const wasDown = pressed.get(controlKey(mapping.control)) ?? false;
    pressed.set(controlKey(mapping.control), down);
    return down && !wasDown;
  };

  const moveChoice = (mapping: Mapping, id: ChoiceId, value: number, from: KnownController | undefined) => {
    if (mapping.mode === 'detect') return;
    if (mapping.mode === 'trigger' && !pressedNow(mapping, value)) return;
    const { index, count } = synth.choice(id);
    let next: number;
    if (mapping.mode === 'toggle' || mapping.mode === 'trigger') {
      next = (index + 1) % count; // a button steps on, round to the first
    } else if (mapping.mode === 'absolute') {
      next = Math.min(count - 1, Math.floor((value / 128) * count));
    } else {
      const total = (clicks.get(controlKey(mapping.control)) ?? 0) + relativeSteps(from, mapping.mode, value);
      const steps = Math.trunc(total / CLICKS_PER_CHOICE);
      next = Math.min(count - 1, Math.max(0, index + steps));
      // Turns past either end are dropped, so turning back responds at once.
      clicks.set(controlKey(mapping.control), next === index + steps ? total - steps * CLICKS_PER_CHOICE : 0);
    }
    if (next !== index) synth.setChoice(id, next);
    synth.touched?.(mapping.target, 'moved');
  };

  const apply = (mapping: Mapping, message: ControlMessage, from: KnownController | undefined) => {
    const { target } = mapping;
    if (mapping.mode === 'detect') {
      if (message.type !== 'cc') return;
      const values = [...(detecting.get(controlKey(mapping.control)) ?? []), message.value];
      detecting.set(controlKey(mapping.control), values);
      if (values.length < DETECT_VALUES) return synth.touched?.(target, 'waiting');
      detecting.delete(controlKey(mapping.control));
      const found: Mapping = { ...mapping, mode: detectKnobMode(values) };
      store.replace(found);
      return apply(found, message, from);
    }
    if (target.kind === 'param' || target.kind === 'choice' || target.kind === 'tempo') {
      if (message.type !== 'cc') return;
      if (target.kind === 'param') moveDial(mapping, paramDial(target.id), message.value, from);
      else if (target.kind === 'tempo') moveDial(mapping, tempoDial(), message.value, from);
      else moveChoice(mapping, target.id, message.value, from);
      return;
    }
    // An Action fires on each press: a note-on, a toggle button's every message, or a button's CC rising past the
    // middle.
    if (mapping.mode === 'toggle') {
      if (message.type === 'cc') synth.action(target.id);
      return;
    }
    if (message.type === 'noteOn' || (message.type === 'cc' && pressedNow(mapping, message.value))) synth.action(target.id);
  };

  const finishListening = () => {
    clearTimeout(settle);
    if (learn.phase !== 'listening') return;
    learned({
      control: learn.control,
      target: learn.target,
      // On an Action, one message alone is a toggle's press; a second (a release, or a knob's turn) is momentary.
      mode: learn.target.kind === 'action' ? (values.length > 1 ? 'trigger' : 'toggle') : detectEncoderMode(values),
    });
  };

  /** Feeds a message to MIDI Learn; true when Learn used it up. */
  const learnFrom = (message: ControlMessage): boolean => {
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
      // A second message on an Action ends Learn at once, a knob once it has sent enough to tell its Encoder Mode.
      if (values.length >= (learn.target.kind === 'action' ? 2 : LEARN_VALUES)) finishListening();
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
      // Heard out until it has been still a moment: a knob for its Encoder Mode, a button on an Action for whether
      // a release follows its press (momentary) or not (a toggle, whatever its value: a lit one sends 0) (issue 147).
      // Its messages meanwhile are used up by Learn, the release among them, so they fire nothing.
      setLearn({ phase: 'listening', target, control });
      values = [];
      learnFrom(message);
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
    /** A message from a Controller: `from` is the known Controller it is (a C16), whose layout's Mappings answer it alone; left out for any other. */
    handle(incoming: MidiMessage, from?: KnownController) {
      if (incoming.type === 'program') return synth.program?.(incoming.program);
      if (incoming.type === 'pressure') return pressureMoved(incoming);
      if (incoming.type === 'noteOff') forgetPressure(incoming.channel, incoming.note);
      if (incoming.type === 'cc' && [ALL_SOUND_OFF, RESET_ALL_CONTROLLERS, ALL_NOTES_OFF].includes(incoming.controller))
        return channelMode(incoming.controller);
      const message: ControlMessage =
        incoming.type === 'pitchBend'
          ? { type: 'cc', channel: incoming.channel, controller: PITCH_BEND, value: Math.round(((incoming.value + 1) / 2) * 127) }
          : incoming;
      if (message.type === 'cc') lastValues.set(controlKey({ kind: 'cc', channel: message.channel, number: message.controller }), message.value);
      if (learnFrom(message)) return;
      const mapping = store.find(
        message.type === 'cc'
          ? { kind: 'cc', channel: message.channel, number: message.controller }
          : { kind: 'note', channel: message.channel, number: message.note },
      );
      if (mapping && answers(mapping, from)) return apply(mapping, message, from);
      // Unmapped: a keyboard's own controls do what a synth player expects.
      if (incoming.type === 'pitchBend') return synth.bend?.(incoming.value);
      if (message.type === 'cc' && message.controller === SUSTAIN) return synth.pedal?.(message.value >= 64);
      if (message.type === 'cc' && message.controller === MOD_WHEEL) {
        synth.setPosition('lfoAmount', message.value / 127);
        synth.touched?.({ kind: 'param', id: 'lfoAmount' }, 'moved');
        return;
      }
      if (message.type === 'noteOn') {
        sounding.set(noteKey(message.channel, message.note), message.note);
        synth.press(message.note, message.velocity);
      } else if (message.type === 'noteOff') {
        sounding.delete(noteKey(message.channel, message.note));
        synth.release(message.note);
      }
    },
    startLearn() {
      if (learn.phase === 'off') setLearn({ phase: 'armed', target: null });
    },
    /** Selects what the next control moved is learned for, other than any control in `avoid`. */
    select(target: Target, avoid: readonly Control[] = []) {
      // A button cut short (a click on screen, Quick Setup's Skip) is not guessed: nothing is learned, and its
      // release, still to come, is not learned for the next target.
      if (learn.phase === 'listening' && learn.target.kind === 'action') {
        clearTimeout(settle);
        keepOff(learn.control);
      } else finishListening();
      avoiding = avoid;
      setLearn({ phase: 'armed', target });
    },
    /**
     * A knob's Mapping switched by hand between Absolute and Relative, where Learn guessed wrong (issue 186): Relative
     * takes the kind the knob's last value says. What the knob had gathered towards a step, or Pickup, starts afresh. The
     * mode it has already changes nothing, so a Relative Mapping keeps its kind.
     */
    setMode(control: Control, mode: KnobMode) {
      const mapping = store.find(control);
      const current = mapping && knobModeOf(mapping.mode);
      if (!mapping || !current || current === mode) return;
      const key = controlKey(control);
      for (const state of [pickups, clicks, gathered, thirds, detecting]) state.delete(key);
      store.replace({ ...mapping, mode: mode === 'absolute' ? 'absolute' : relativeModeOf(lastValues.get(key)) });
    },
    /**
     * What the knobs mapped to `target` have gathered towards a step starts afresh: what they turn has changed (an LFO's
     * Sync switched, the Rate knob turning the Hz or the note value), so a share of a step gathered on one is not
     * carried to the other (issue 193).
     */
    restartSteps(target: Target) {
      for (const mapping of store.list())
        if (mapping.target.kind === target.kind && mapping.target.id === target.id)
          for (const state of [clicks, gathered, thirds]) state.delete(controlKey(mapping.control));
    },
    stopLearn() {
      clearTimeout(settle);
      if (learn.phase !== 'off') setLearn({ phase: 'off' });
    },
    learnState: (): LearnState => learn,
  };
}

export type ControlSurface = ReturnType<typeof createControlSurface>;
