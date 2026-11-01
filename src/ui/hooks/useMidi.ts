import { type MutableRefObject, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { AudioSession } from '../../app/session';
import type { KeyValueStorage } from '../../app/storage';
import { addC16Places, c16Bank, c16Layout, isC16, upgradeC16Layout } from '../../midi/c16';
import { createControlSurface, type LearnState } from '../../midi/controlSurface';
import { describeMessage, targetKey } from '../../midi/describe';
import { connectMidi, type MidiAccessLike, midiSupport } from '../../midi/inputs';
import { createMappingStore, type Mapping, type Target } from '../../midi/mappings';
import { QUICK_SETUP, type QuickSetupEvent, type QuickSetupState, quickSetupReducer, startQuickSetup, takenControls } from '../../midi/quickSetup';
import { bpmPosition, positionBpm } from '../../music/tempo';
import { CHOICES, type ChoiceId, knobTurns, PARAMS, setParam } from '../../patch/patch';
import { positionToValue, valueToPosition } from '../../patch/taper';
import type { MidiState } from '../MidiPanel';
import { reveal } from '../reveal';
import { SECTIONS, type SectionName } from '../sections';
import { WAVEFORM_ORDER } from '../WaveformPicker';

/** Set once the C16 layout has been applied by itself, so it is never applied again unasked. */
const C16_APPLIED = 'limpide.c16Layout';
/** What C16_APPLIED holds once today's layout is in place, applied or brought over from an earlier one: 2 for issue 145's, 3 since each LFO's Sync (issue 112). */
const C16_LAYOUT_VERSION = '3';

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
  /** A pad mapped to the next or previous Preset has loaded it. */
  onPresetStep(): void;
}

/**
 * MIDI Controllers: their Notes join the same Note input as the keyboard and piano; their knobs, pads and encoders
 * drive what they were mapped to (MIDI Learn first, ADR-0004), or the C16's own layout (ADR-0009). Messages arrive
 * between renders, so the surface reads and changes the Patch in its store, which the sound follows at once.
 */
export function useMidi(host: Host) {
  const { storage, session, pressHoldRef, onNote } = host;
  const { patches, viewers } = session;
  // The control surface is made once (below) and calls back between renders, outside any effect, so what it calls
  // is kept in refs with each render: the host's, and onLearned.
  const keyboard = useRef(host);
  keyboard.current = host;
  const [midi, setMidi] = useState<MidiState>({ kind: 'pending' });
  const [activity, setActivity] = useState<string | null>(null);
  const [learn, setLearn] = useState<LearnState>({ phase: 'off' });
  const noteFromController = useEffectEvent(() => onNote());

  const mappingStore = useMemo(() => createMappingStore(storage), [storage]);
  const mappings = useSyncExternalStore(mappingStore.subscribe, mappingStore.list);
  // The C16 layout: applied once by itself, the first time a C16 is plugged in with nothing mapped (after that, a
  // person who removed it meant to); the MIDI panel puts it back at any time.
  const applyC16Layout = () => {
    mappingStore.restore(c16Layout());
    storage.setItem(C16_APPLIED, C16_LAYOUT_VERSION);
  };
  // A C16 control moved on another bank than the last: its section is brought into view (on a phone, where one
  // section shows at a time).
  const c16Connected = useRef(false);
  const lastBank = useRef<number | undefined>(undefined);
  const [bankFollow, setBankFollow] = useState<{ name: SectionName; key: number } | null>(null);

  const onLearned = useRef((mapping: Mapping): void => void mapping);
  const surface = useMemo(() => {
    const flashes = new Map<string, ReturnType<typeof setTimeout>>();
    // The knob a Controller moved shows it for a moment ('waiting' while Pickup has not caught it yet).
    const flash = (target: Target, state: 'moved' | 'waiting') => {
      const key = targetKey(target);
      const element = document.querySelector<HTMLElement>(`[data-learn="${key}"]`);
      if (!element) return;
      reveal(element);
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
      turned: (id) => knobTurns(patches.get().patch, id),
      tempoPosition: () => bpmPosition(session.tempo.get().bpm),
      setTempoPosition: (position) => session.tempo.set(positionBpm(position)),
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
        else if (id === 'tap') session.tempo.tap();
        else {
          patches.step(id === 'nextPreset' ? 1 : -1);
          keyboard.current.onPresetStep();
        }
      },
      press: (note, velocity) => session.input.press(note, velocity),
      release: (note) => session.input.release(note),
      touched: flash,
      bend: (amount) => keyboard.current.onBend(amount),
      pedal: (down) => keyboard.current.onPedal(down),
      program: (number) => keyboard.current.onProgram(number),
      learnChanged: (state) => {
        setLearn(state);
        if (state.phase === 'armed' && state.learned) onLearned.current(state.learned);
      },
    });
  }, [mappingStore, session, patches, viewers, pressHoldRef]);

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
  const learnContext = useMemo(
    () => ({
      mapped: new Set(mappings.map((m) => targetKey(m.target))),
      selected: learn.phase !== 'off' && learn.target ? targetKey(learn.target) : null,
    }),
    [mappings, learn],
  );
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

  const applyC16LayoutNow = useEffectEvent(applyC16Layout);
  useEffect(() => {
    const support = midiSupport(navigator);
    if (support !== 'supported') return setMidi({ kind: 'unsupported', ios: support === 'ios' });
    if (!midiWanted) return;
    let dispose = () => {};
    let cancelled = false;
    navigator.requestMIDIAccess().then(
      (access) => {
        if (cancelled) return;
        dispose = connectMidi(access as unknown as MidiAccessLike, {
          onMessage: (m, from) => {
            const fromC16 = isC16(from);
            if (m.type === 'noteOn') noteFromController();
            if (fromC16 && m.type === 'cc' && surface.learnState().phase === 'off') {
              const control = { kind: 'cc' as const, channel: m.channel, number: m.controller };
              const bank = c16Bank(control);
              if (bank !== undefined && bank !== lastBank.current && mappingStore.find(control)) {
                lastBank.current = bank;
                setBankFollow((f) => ({ name: SECTIONS[bank].name, key: (f?.key ?? 0) + 1 }));
              }
            }
            surface.handle(m, fromC16);
            setActivity(describeMessage(m));
          },
          onDevices: (devices) => {
            setMidi({ kind: 'ready', devices });
            c16Connected.current = devices.some(isC16);
            const fresh = mappingStore.list().length === 0 && storage.getItem(C16_APPLIED) === null;
            if (c16Connected.current && fresh) applyC16LayoutNow();
            // The first layout, stored before issue 145, becomes today's, once; a person's own Mappings stay, and so
            // does anything learned later on a place the first layout had.
            if (c16Connected.current && storage.getItem(C16_APPLIED) !== C16_LAYOUT_VERSION) {
              const upgraded = upgradeC16Layout(mappingStore.list());
              if (upgraded) mappingStore.restore(upgraded);
              // Issue 145's layout gains the places added since, where the person's Mappings leave them free.
              const added = storage.getItem(C16_APPLIED) === '2' && addC16Places(mappingStore.list());
              if (added) mappingStore.restore(added);
              storage.setItem(C16_APPLIED, C16_LAYOUT_VERSION);
            }
          },
        });
      },
      () => setMidi({ kind: 'denied' }),
    );
    return () => {
      cancelled = true;
      dispose();
    };
  }, [surface, midiWanted, mappingStore, storage]);

  return {
    midi, activity, mappings, mappingStore, learn, learning, learnContext, surface,
    setup, setupLast, updateSetup, closeSetup, applyC16Layout,
    bankFollow, setBankFollow, connect: () => setMidiWanted(true),
  };
}
