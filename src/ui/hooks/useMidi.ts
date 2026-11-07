import { type MutableRefObject, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { AudioSession } from '../../app/session';
import type { KeyValueStorage } from '../../app/storage';
import { knownController, pluggedIn, setAside, takeLayout } from '../../midi/controller';
import { createControlSurface, type LearnState } from '../../midi/controlSurface';
import { describeMessage, targetKey } from '../../midi/describe';
import { connectMidi, type MidiAccessLike, midiSupport } from '../../midi/inputs';
import { type ControllerId, createMappingStore, type Mapping, type Target } from '../../midi/mappings';
import { QUICK_SETUP, type QuickSetupEvent, type QuickSetupState, quickSetupReducer, startQuickSetup, takenControls } from '../../midi/quickSetup';
import { bpmPosition, positionBpm, wholeBpm } from '../../music/tempo';
import { CHOICES, type ChoiceId, knobTurns, LFO_KEYS, PARAMS, rateKnob, setParam } from '../../patch/patch';
import { positionToValue, valueToPosition } from '../../patch/taper';
import type { MidiState } from '../MidiPanel';
import { reveal } from '../reveal';
import { SECTIONS, type SectionName } from '../sections';
import { WAVEFORM_ORDER } from '../WaveformPicker';

/** A choice's options in on-screen order (the Waveform pickers show them differently from the stored list). */
const choiceOptions = (id: ChoiceId): readonly unknown[] =>
  id === 'waveform' || id === 'osc2Waveform' ? WAVEFORM_ORDER : CHOICES[id];

/** Whether the browser has already allowed or refused MIDI, so connecting asks nothing (unknown: 'prompt'). */
async function midiPermission(): Promise<PermissionState> {
  try {
    return (await navigator.permissions.query({ name: 'midi' as PermissionName })).state;
  } catch {
    return 'prompt';
  }
}

/**
 * The Activity Monitor's line, the last message heard, kept apart from the page's state: a stream of aftertouch or of a
 * knob's CCs redraws that line alone, not the page (issue 217).
 */
export interface MidiActivity {
  get(): string | null;
  subscribe(listener: () => void): () => void;
}

function createActivity(): MidiActivity & { set(line: string): void } {
  let line: string | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => line,
    set(next: string) {
      if (next === line) return;
      line = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

interface Host {
  storage: KeyValueStorage;
  session: AudioSession;
  pressHoldRef: MutableRefObject<() => void>;
  /** A Note from a Controller: the Demo stops, the person has taken over. */
  onNote(): void;
  /** A keyboard's own controls, while unmapped (issue 52): the bend wheel (−1 to 1), the sustain pedal, a Program
   *  Change. */
  onBend(amount: number): void;
  onPedal(down: boolean): void;
  onProgram(number: number): void;
  /** Aftertouch, how hard the keys are pressed (0–1, issue 132): the channel's, or the hardest-pressed held Note's. */
  onPressure(amount: number): void;
}

/**
 * MIDI Controllers: their Notes join the same Note input as the keyboard and piano; their knobs, pads and encoders
 * drive what they were mapped to (MIDI Learn first, ADR-0004), or a known Controller's own layout (the C16's,
 * ADR-0017). Messages arrive between renders, so the surface reads and changes the Patch in its store, which the
 * sound follows at once.
 */
export function useMidi(host: Host) {
  const { storage, session, pressHoldRef, onNote } = host;
  const { patches, viewers } = session;
  // The control surface is made once (below) and calls back between renders, outside any effect, so what it calls
  // is kept in refs with each render: the host's, and onLearned.
  const keyboard = useRef(host);
  keyboard.current = host;
  const [midi, setMidi] = useState<MidiState>({ kind: 'pending' });
  // Kept in state, not a memo React may drop: a new store would reconnect MIDI.
  const [activity] = useState(createActivity);
  const readActivity: MidiActivity = activity; // its line is set here alone
  // Whether a keyboard has sent aftertouch this visit: from then on the Timeline draws what it moves (issue 132).
  const [pressureHeard, setPressureHeard] = useState(false);
  const pressureHeardRef = useRef(false);
  const [learn, setLearn] = useState<LearnState>({ phase: 'off' });
  const noteFromController = useEffectEvent(() => onNote());

  const mappingStore = useMemo(() => createMappingStore(storage), [storage]);
  const mappings = useSyncExternalStore(mappingStore.subscribe, mappingStore.list);
  // A known Controller's layout (the C16's): the MIDI panel puts it back at any time; it comes in by itself as the
  // Controller is plugged in (below).
  const applyLayout = (id: ControllerId) => mappingStore.restore(takeLayout(id, storage));
  // A known Controller's control moved on another bank than the last: its section is brought into view (on a phone,
  // where one section shows at a time).
  const lastBank = useRef<number | undefined>(undefined);
  const [bankFollow, setBankFollow] = useState<{ name: SectionName; key: number } | null>(null);

  // The known Controllers seen sending positions from knobs their layout has Relative: the MIDI panel says how to set
  // them, once each this visit (issue 255).
  const [sendPositions, setSendPositions] = useState<readonly ControllerId[]>([]);
  // The controls whose knob Pickup waits for, by target, with the way to turn it (issue 255): each shows it until the
  // knob crosses its value. Changed only as one starts or stops waiting, so a stream of CCs renders nothing.
  const [pickups, setPickups] = useState<ReadonlyMap<string, 'up' | 'down'>>(() => new Map());
  const pickupsRef = useRef(pickups);
  const onLearned = useRef((mapping: Mapping): void => void mapping);
  const surface = useMemo(() => {
    const flashes = new Map<string, ReturnType<typeof setTimeout>>();
    const setPickup = (key: string, way: 'up' | 'down' | undefined) => {
      if (pickupsRef.current.get(key) === way) return;
      const next = new Map(pickupsRef.current);
      if (way) next.set(key, way);
      else next.delete(key);
      pickupsRef.current = next;
      setPickups(next);
    };
    // The knob a Controller moved shows it for a moment; while Pickup has not caught it yet, it shows it waits.
    const flash = (target: Target, state: 'moved' | 'waiting', way?: 'up' | 'down') => {
      const key = targetKey(target);
      setPickup(key, state === 'waiting' ? (way ?? 'up') : undefined);
      const element = document.querySelector<HTMLElement>(`[data-learn="${key}"]`);
      if (!element) return;
      reveal(element);
      if (state === 'waiting') return;
      element.dataset.midi = state;
      clearTimeout(flashes.get(key));
      flashes.set(key, setTimeout(() => delete element.dataset.midi, 400));
    };
    return createControlSurface({
      store: mappingStore,
      position: (id) => valueToPosition(PARAMS[id], patches.get().patch[id]),
      setPosition: (id, position) => {
        patches.change((p) => setParam(p, id, positionToValue(PARAMS[id], position)), 'controller');
      },
      value: (id) => patches.get().patch[id],
      setValue: (id, value) => patches.change((p) => setParam(p, id, value), 'controller'),
      turned: (id) => knobTurns(patches.get().patch, id),
      geek: () => viewers.get().overlays.geek,
      tempoPosition: () => bpmPosition(session.tempo.get().bpm),
      setTempoPosition: (position) => session.tempo.set(wholeBpm(positionBpm(position))), // a Controller's knob: whole BPMs
      choice: (id) => {
        const options = choiceOptions(id);
        return { index: options.indexOf(patches.get().patch[id] as never), count: options.length };
      },
      setChoice: (id, index) => {
        const value = choiceOptions(id)[index];
        patches.change((p) => ({ ...p, [id]: value }), 'controller');
      },
      action: (id) => {
        if (id === 'hold') pressHoldRef.current();
        else if (id === 'freeze') viewers.dispatch({ type: 'toggleFreeze' });
        else if (id === 'snapshot') viewers.dispatch({ type: 'takeSnapshot' });
        else if (id === 'tapTempo') session.tempo.tapTempo();
        else patches.step(id === 'nextPreset' ? 1 : -1);
      },
      press: (note, velocity) => session.input.press(note, velocity),
      release: (note) => session.input.release(note),
      touched: flash,
      bend: (amount) => keyboard.current.onBend(amount),
      pedal: (down) => keyboard.current.onPedal(down),
      program: (number) => keyboard.current.onProgram(number),
      pressure: (amount) => keyboard.current.onPressure(amount),
      // All Sound Off (issue 185): every Voice silent at once, the Notes the Controller held released first.
      silence: () => session.engine.silence(),
      sendsPositions: (known) => setSendPositions((ids) => (ids.includes(known.id) ? ids : [...ids, known.id])),
      learnChanged: (state) => {
        setLearn(state);
        if (state.phase === 'armed' && state.learned) onLearned.current(state.learned);
      },
    });
  }, [mappingStore, session, patches, viewers, pressHoldRef]);

  // An LFO's Sync switched, however: the Rate knob turns the other of its Hz and its note value, so what a Relative knob
  // had gathered towards a step of one is forgotten (issue 193).
  useEffect(
    () =>
      patches.subscribe(({ before, after }) => {
        for (const lfo of [1, 2] as const)
          if (rateKnob(before, lfo) !== rateKnob(after, lfo)) surface.restartSteps({ kind: 'param', id: LFO_KEYS[lfo].rate });
      }),
    [patches, surface],
  );

  // Quick Setup: a sequence of Learn steps. Each Mapping learned moves it on to the next step's target.
  const [setup, setSetup] = useState<QuickSetupState | null>(null);
  const [setupLast, setSetupLast] = useState<{ step: number; mapping: Mapping } | null>(null);
  const setupRef = useRef(setup);
  const updateSetup = (event: QuickSetupEvent | { type: 'start' }) => {
    const current = setupRef.current;
    const next =
      event.type === 'start' ? startQuickSetup(QUICK_SETUP, mappingStore.list()) : current && quickSetupReducer(current, event);
    if (!next || next === current) return;
    if (event.type === 'learned' && current) setSetupLast({ step: current.index, mapping: event.mapping });
    if (event.type === 'start') setSetupLast(null);
    setupRef.current = next.phase === 'cancelled' ? null : next;
    setSetup(setupRef.current);
    if (next.phase === 'running') {
      surface.startLearn();
      surface.select(next.steps[next.index].target, takenControls(next));
    } else {
      surface.stopLearn();
      if (next.phase === 'cancelled') mappingStore.restore(next.before);
    }
  };
  const finishSetup = useEffectEvent(() => updateSetup({ type: 'finish' }));
  onLearned.current = (mapping) => updateSetup({ type: 'learned', mapping });
  const closeSetup = () => {
    setupRef.current = null;
    setSetup(null);
  };

  // In MIDI Learn, clicking a learnable control selects it instead of using it; Escape ends Learn.
  const learning = learn.phase !== 'off';
  useEffect(() => {
    if (!learning) return;
    const types = ['pointerdown', 'mousedown', 'click', 'dblclick'];
    const select = (e: Event) => {
      const element = (e.target as Element).closest?.('[data-learn]');
      if (!element) return;
      e.preventDefault();
      e.stopPropagation();
      // Quick Setup chooses the targets itself; a click only must not act on the control.
      if (e.type !== 'click' || setupRef.current) return;
      const [kind, id] = element.getAttribute('data-learn')!.split(':');
      surface.select({ kind, id } as Target);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      if (setupRef.current?.phase === 'running') finishSetup();
      else surface.stopLearn();
    };
    for (const type of types) document.addEventListener(type, select, { capture: true });
    document.addEventListener('keydown', onKey, { capture: true });
    return () => {
      for (const type of types) document.removeEventListener(type, select, { capture: true });
      document.removeEventListener('keydown', onKey, { capture: true });
    };
  }, [learning, surface]);
  const learnContext = useMemo(() => {
    // Pickup waits on an Absolute Mapping alone: one removed, or switched to Relative, waits no more.
    const absolute = new Set(mappings.filter((m) => m.mode === 'absolute' || m.mode === 'detect').map((m) => targetKey(m.target)));
    return {
      mapped: new Set(mappings.map((m) => targetKey(m.target))),
      selected: learn.phase !== 'off' && learn.target ? targetKey(learn.target) : null,
      pickups: new Map([...pickups].filter(([key]) => absolute.has(key))),
    };
  }, [mappings, learn, pickups]);
  // The control MIDI Learn is waiting for is shown, even on a hidden tab.
  useEffect(() => {
    const element = learnContext.selected && document.querySelector(`[data-learn="${learnContext.selected}"]`);
    if (element) reveal(element);
  }, [learnContext.selected]);

  // MIDI is asked for when the visitor opens the MIDI panel, never at load, where the browser's prompt would come
  // before anything is touched (issue 46); a browser that already allowed it connects at once.
  const [midiWanted, setMidiWanted] = useState(false);
  useEffect(() => {
    if (midiSupport(navigator) !== 'supported') return;
    let cancelled = false;
    midiPermission().then((state) => {
      if (cancelled) return;
      if (state === 'granted') setMidiWanted(true);
      if (state === 'denied') setMidi({ kind: 'denied' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const support = midiSupport(navigator);
    if (support !== 'supported') return setMidi({ kind: 'unsupported', ios: support === 'ios' });
    if (!midiWanted) return;
    let dispose = () => {};
    let cancelled = false;
    // A known Controller on two ports at once (a C16 on USB and Bluetooth) is heard on the first connected alone,
    // so each press counts once (issue 185).
    let aside = new Set<string>();
    navigator.requestMIDIAccess().then(
      (access) => {
        if (cancelled) return;
        dispose = connectMidi(access as unknown as MidiAccessLike, {
          onMessage: (m, name) => {
            // Any message wakes the sound from a pause, ahead of the Note it may bring (issue 238).
            session.wake();
            if (aside.has(name)) return;
            const from = knownController(name);
            if (m.type === 'noteOn') noteFromController();
            if (from && m.type === 'cc' && surface.learnState().phase === 'off') {
              const control = { kind: 'cc' as const, channel: m.channel, number: m.controller };
              const bank = from.section(control);
              if (bank !== undefined && bank !== lastBank.current && mappingStore.find(control)) {
                lastBank.current = bank;
                setBankFollow((f) => ({ name: SECTIONS[bank].name, key: (f?.key ?? 0) + 1 }));
              }
            }
            surface.handle(m, from);
            activity.set(describeMessage(m));
            // Set once: a same-value setState can still render the page once before React bails out.
            if (m.type === 'pressure' && m.value > 0 && !pressureHeardRef.current) {
              pressureHeardRef.current = true;
              setPressureHeard(true);
            }
          },
          // A clock from any input sets the tempo (issue 136); it is no Controller's control, nor shown as one.
          onClock: (m, name, time) => session.tempo.midiClock(m.type, time, name),
          onDevices: (devices) => {
            aside = setAside(devices);
            setMidi({ kind: 'ready', devices });
            const mappings = pluggedIn(devices, mappingStore.list(), storage);
            if (mappings) mappingStore.restore(mappings);
          },
        });
      },
      () => setMidi({ kind: 'denied' }),
    );
    return () => {
      cancelled = true;
      dispose();
    };
  }, [surface, midiWanted, mappingStore, storage, session, activity]);

  return {
    midi, activity: readActivity, pressureHeard, mappings, sendPositions, mappingStore, learn, learning, learnContext, surface,
    setup, setupLast, updateSetup, closeSetup, applyLayout,
    bankFollow, setBankFollow, connect: () => setMidiWanted(true),
  };
}
