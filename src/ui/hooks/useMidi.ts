import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { AudioSession } from '../../app/session';
import type { KeyValueStorage } from '../../app/storage';
import { c16Bank, c16Layout, isC16 } from '../../midi/c16';
import { createControlSurface, type LearnState } from '../../midi/controlSurface';
import { describeMessage, targetKey } from '../../midi/describe';
import { connectMidi, type MidiAccessLike, midiSupport } from '../../midi/inputs';
import { createMappingStore, type Mapping, type Target } from '../../midi/mappings';
import { QUICK_SETUP, type QuickSetupEvent, type QuickSetupState, quickSetupReducer, startQuickSetup, takenControls } from '../../midi/quickSetup';
import { CHOICES, type ChoiceId, PARAMS, type ParamId, type Patch, setParam } from '../../patch/patch';
import { positionToValue, valueToPosition } from '../../patch/taper';
import type { ViewerAction } from '../../viewers/viewerState';
import type { MidiState } from '../MidiPanel';
import { reveal } from '../reveal';
import { SECTIONS, type SectionName } from '../sections';
import { WAVEFORM_ORDER } from '../WaveformPicker';

/** Set once the C16 layout has been applied by itself, so it is never applied again unasked. */
const C16_APPLIED = 'limpide.c16Layout';

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
  patchRef: MutableRefObject<Patch>;
  setPatch: Dispatch<SetStateAction<Patch>>;
  stepPreset(delta: number): void;
  /** Knobs a Controller turns count as turned by hand: the Demo leaves them alone. */
  turnedByHand: MutableRefObject<Set<ParamId>>;
  pressHoldRef: MutableRefObject<() => void>;
  dispatchViewer: Dispatch<ViewerAction>;
  /** A Note from a Controller: the Demo stops, the person has taken over. */
  onNote(): void;
}

/**
 * MIDI Controllers: their Notes join the same Note input as the keyboard and piano; their knobs, pads and encoders
 * drive what they were mapped to (MIDI Learn first, ADR-0004), or the C16's own layout (ADR-0009). Messages arrive
 * between renders, so the surface reads and writes the Patch through `patchRef`.
 */
export function useMidi({ storage, session, patchRef, setPatch, stepPreset, turnedByHand, pressHoldRef, dispatchViewer, onNote }: Host) {
  const [midi, setMidi] = useState<MidiState>({ kind: 'pending' });
  const [activity, setActivity] = useState<string | null>(null);
  const [learn, setLearn] = useState<LearnState>({ phase: 'off' });
  const stepPresetRef = useRef(stepPreset);
  stepPresetRef.current = stepPreset;
  const onNoteRef = useRef(onNote);
  onNoteRef.current = onNote;

  const mappingStore = useMemo(() => createMappingStore(storage), [storage]);
  const mappings = useSyncExternalStore(mappingStore.subscribe, mappingStore.list);
  // The C16 layout: applied once by itself, the first time a C16 is plugged in with nothing mapped (after that, a
  // person who removed it meant to); the MIDI panel puts it back at any time.
  const applyC16Layout = () => {
    mappingStore.restore(c16Layout());
    storage.setItem(C16_APPLIED, '1');
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
      position: (id) => valueToPosition(PARAMS[id], patchRef.current[id]),
      setPosition: (id, position) => {
        const next = setParam(patchRef.current, id, positionToValue(PARAMS[id], position));
        patchRef.current = next;
        turnedByHand.current.add(id);
        setPatch((p) => setParam(p, id, next[id]));
      },
      choice: (id) => {
        const options = choiceOptions(id);
        return { index: options.indexOf(patchRef.current[id] as never), count: options.length };
      },
      setChoice: (id, index) => {
        const value = choiceOptions(id)[index];
        patchRef.current = { ...patchRef.current, [id]: value };
        setPatch((p) => ({ ...p, [id]: value }));
      },
      action: (id) => {
        if (id === 'hold') pressHoldRef.current();
        else if (id === 'freeze') dispatchViewer({ type: 'toggleFreeze' });
        else if (id === 'snapshot') dispatchViewer({ type: 'takeSnapshot' });
        else stepPresetRef.current(id === 'nextPreset' ? 1 : -1);
      },
      press: (note, velocity) => session.input.press(note, velocity),
      release: (note) => session.input.release(note),
      touched: flash,
      learnChanged: (state) => {
        setLearn(state);
        if (state.phase === 'armed' && state.learned) onLearned.current(state.learned);
      },
    });
  }, [mappingStore, session, patchRef, setPatch, turnedByHand, pressHoldRef, dispatchViewer]);

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
  const updateSetupRef = useRef(updateSetup);
  updateSetupRef.current = updateSetup;
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
      if (setupRef.current?.phase === 'running') updateSetupRef.current({ type: 'finish' });
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

  const applyC16LayoutRef = useRef(applyC16Layout);
  applyC16LayoutRef.current = applyC16Layout;
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
          onMessage: (m) => {
            if (m.type === 'noteOn') onNoteRef.current();
            if (c16Connected.current && m.type === 'cc' && surface.learnState().phase === 'off') {
              const control = { kind: 'cc' as const, channel: m.channel, number: m.controller };
              const bank = c16Bank(control);
              if (bank !== undefined && bank !== lastBank.current && mappingStore.find(control)) {
                lastBank.current = bank;
                setBankFollow((f) => ({ name: SECTIONS[bank].name, key: (f?.key ?? 0) + 1 }));
              }
            }
            surface.handle(m);
            setActivity(describeMessage(m));
          },
          onDevices: (devices) => {
            setMidi({ kind: 'ready', devices });
            c16Connected.current = devices.some(isC16);
            const fresh = mappingStore.list().length === 0 && storage.getItem(C16_APPLIED) === null;
            if (c16Connected.current && fresh) applyC16LayoutRef.current();
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
