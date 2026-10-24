import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { getAudioSession, type AudioSession } from '../app/session';
import { unlockAudio, type AudioStatus } from '../app/unlockAudio';
import { keyToNote, octaveKey, shiftOctave } from '../input/keyboardLayout';
import { createControlSurface, type LearnState } from '../midi/controlSurface';
import { describeMessage, targetKey } from '../midi/describe';
import { connectMidi, midiSupport, type MidiAccessLike } from '../midi/inputs';
import { createMappingStore, type Mapping, type Target } from '../midi/mappings';
import { C16_SETUP, quickSetupReducer, startQuickSetup, type QuickSetupEvent, type QuickSetupState } from '../midi/quickSetup';
import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { idealReference } from '../music/idealReference';
import { CHOICES, PARAMS, setFilter, setParam, setWaveform, type ChoiceId, type ParamId, type Patch } from '../patch/patch';
import { createLibrary } from '../patch/library';
import { initialPatch, presetAfter } from '../patch/presets';
import { positionToValue, valueToPosition } from '../patch/taper';
import { loadOverlays, saveOverlays, toggleOverlay } from '../viewers/overlays';
import { INITIAL_VIEWER_STATE, viewerReducer } from '../viewers/viewerState';
import type { ViewSettings } from '../viewers/viewSettings';
import { startDemo } from '../demo/player';
import { PRESETS } from '../patch/presets';
import { HoldIcon, PlayIcon } from './icons';
import { Knob } from './Knob';
import { OverlayToggles } from './OverlayToggles';
import { TapViewers } from './TapViewers';
import { Logo } from './Logo';
import { TIPS } from './tips';
import { ToolGroup } from './ToolGroup';
import { FilterShape } from './FilterShape';
import { Segmented } from './Segmented';
import { SubBlock } from './SubBlock';
import { LfoControls } from './LfoControls';
import { LearnBar } from './LearnBar';
import { LearnContext } from './learn';
import { MidiPanel, type MidiState } from './MidiPanel';
import { QuickSetupPanel } from './QuickSetupPanel';
import { reveal } from './reveal';
import { Piano } from './Piano';
import { DisplayMenu } from './DisplayMenu';
import { PatchBar } from './PatchBar';
import { Tabs } from './Tabs';
import { Tooltip } from './Tooltip';
import { AxesControls, ViewActions } from './ViewerControls';
import { EnvelopeTimeline } from './EnvelopeTimeline';
import { applyTheme, loadTheme, type Theme } from './theme';
import { WAVEFORM_ORDER, WaveformPicker } from './WaveformPicker';

const IDEAL_HARMONICS = 256;

interface BlockProps {
  title: string;
  stage: 'osc' | 'filter' | 'amp';
  ids: ParamId[];
  patch: Patch;
  onChange(id: ParamId, v: number): void;
  children?: React.ReactNode;
  /** Extra controls under the main knobs (e.g. the Filter Envelope). */
  more?: React.ReactNode;
  /** Controls on the heading line (e.g. the Filter Mode and Slope). */
  heading?: React.ReactNode;
  /** Controls after the main knobs, on the same row. */
  extra?: React.ReactNode;
  viewers?: React.ReactNode;
}

/** One stage of the signal-flow diagram: its controls on top, its Tap's Viewers below. */
function Block({ title, stage, ids, patch, onChange, children, more, heading, extra, viewers }: BlockProps) {
  return (
    <section className="block" data-stage={stage} aria-label={title}>
      <div className="block-controls">
        <h2>{title}</h2>
        <div className="rows">
          {heading}
          {(children || ids.length > 0 || extra) && (
            <div className="knobs">
              {children}
              {ids.map((id) => (
                <Knob key={id} id={id} value={patch[id]} onChange={(v) => onChange(id, v)} />
              ))}
              {extra}
            </div>
          )}
          {more}
        </div>
      </div>
      {viewers}
    </section>
  );
}


/** A choice's options in on-screen order (the Waveform pickers show them differently from the stored list). */
const choiceOptions = (id: ChoiceId): readonly unknown[] =>
  id === 'waveform' || id === 'osc2Waveform' ? WAVEFORM_ORDER : CHOICES[id];

/** localStorage, or a stand-in that keeps nothing when the browser refuses it (some private modes). */
function safeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

export function App() {
  // Patches: a share link, else last session's, else Init; autosaved as you play.
  const library = useMemo(() => createLibrary(safeStorage()), []);
  const [start] = useState(() => initialPatch(location.hash, library));
  const [patch, setPatch] = useState(start.patch);
  const [patchName, setPatchName] = useState(start.name);
  const [baseline, setBaseline] = useState(start.patch);
  const loadPatch = (name: string, next: Patch) => {
    setPatch(next);
    setPatchName(name);
    setBaseline(next);
  };
  const patchChanged = JSON.stringify(patch) !== JSON.stringify(baseline);

  // The Demo: a tour of one Preset per group, each played with a phrase that suits it, until anything is touched.
  const [demo, setDemo] = useState<number | null>(null);
  const [demoNotes, setDemoNotes] = useState<number[]>([]);
  const demoStop = useRef<(() => void) | null>(null);
  const stopDemo = () => {
    demoStop.current?.();
    demoStop.current = null;
    setDemo(null);
  };
  const stopDemoRef = useRef(stopDemo);
  stopDemoRef.current = stopDemo;
  const toggleDemo = () => {
    if (demoStop.current) return stopDemo();
    const { engine } = session;
    demoStop.current = startDemo({
      now: () => engine.now(),
      load: (stop) => {
        const preset = PRESETS.find((p) => p.name === stop.preset)!;
        loadPatch(preset.name, preset.patch);
        return preset.patch;
      },
      setParam: (id, value) => setPatch((p) => setParam(p, id, value)),
      noteOn: (note, velocity, at) => engine.noteOn(note, velocity, at),
      noteOff: (at) => engine.noteOff(at),
      release: (note, at) => engine.release(note, at),
      onStep: setDemo,
      onNotes: setDemoNotes,
      showOctave: (o) => setOctave(shiftOctave(o, 0)),
      onEnd: () => {
        // The tour is over: back to the starting point, silent, as if nothing had been touched.
        demoStop.current = null;
        setDemo(null);
        const init = PRESETS[0];
        loadPatch(init.name, init.patch);
      },
    });
  };
  // Playing anything, or touching a control, ends the Demo: the person has taken over.
  useEffect(() => {
    if (demo === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !['Shift', 'Tab'].includes(e.key)) stopDemo();
    };
    // A finger on the page may only be scrolling it: unless it lands on a control that takes touches itself
    // (knobs, piano), wait for it to lift. If the browser took it over to scroll, it is cancelled instead.
    let tap: number | null = null;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element;
      if (!target.closest('main') || target.closest('[data-demo]')) return;
      if (e.pointerType === 'mouse' || getComputedStyle(target).touchAction === 'none') stopDemo();
      else tap = e.pointerId;
    };
    const onLift = (e: PointerEvent) => {
      if (e.pointerId === tap) stopDemo();
    };
    const onCancel = () => (tap = null);
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('pointerup', onLift);
    document.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('pointerup', onLift);
      document.removeEventListener('pointercancel', onCancel);
    };
  }, [demo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // A share link has done its job once loaded; drop it so a reload keeps later edits (autosaved).
    if (location.hash.startsWith('#p=')) history.replaceState(null, '', location.pathname + location.search);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => library.saveCurrent(patch), 300);
    return () => clearTimeout(timer);
  }, [library, patch]);
  const [session] = useState(() => getAudioSession(patch));
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('waiting');
  const [hold, setHold] = useState(false);

  useEffect(() => session.input.setHold(hold), [session, hold]);

  // Sound starts on the first key press, click or drag; there is no button to press first.
  useEffect(() => unlockAudio(session.ctx, window, setAudioStatus), [session]);
  const [octave, setOctave] = useState(4);
  const octaveRef = useRef(octave);
  octaveRef.current = octave;
  const [heldNotes, setHeldNotes] = useState<number[]>([]);
  const [midi, setMidi] = useState<MidiState>({ kind: 'pending' });
  const [activity, setActivity] = useState<string | null>(null);
  const [learn, setLearn] = useState<LearnState>({ phase: 'off' });
  const [viewer, dispatchViewer] = useReducer(viewerReducer, INITIAL_VIEWER_STATE);

  useEffect(() => session.onHeld(setHeldNotes), [session]);

  // The Controller's Mappings, and where its messages meet the synth. Messages arrive between renders, so the
  // surface reads and writes the Patch through a ref that is always current.
  const mappingStore = useMemo(() => createMappingStore(safeStorage()), []);
  const mappings = useSyncExternalStore(mappingStore.subscribe, mappingStore.list);
  const patchRef = useRef(patch);
  patchRef.current = patch;
  const patchNameRef = useRef(patchName);
  patchNameRef.current = patchName;
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
    const stepPreset = (delta: number) => {
      const preset = presetAfter(patchNameRef.current, delta);
      patchNameRef.current = preset.name;
      patchRef.current = preset.patch;
      setPatch(preset.patch);
      setPatchName(preset.name);
      setBaseline(preset.patch);
    };
    return createControlSurface({
      store: mappingStore,
      position: (id) => valueToPosition(PARAMS[id], patchRef.current[id]),
      setPosition: (id, position) => {
        const next = setParam(patchRef.current, id, positionToValue(PARAMS[id], position));
        patchRef.current = next;
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
        if (id === 'hold') setHold((h) => !h);
        else if (id === 'freeze') dispatchViewer({ type: 'toggleFreeze' });
        else if (id === 'snapshot') dispatchViewer({ type: 'takeSnapshot' });
        else stepPreset(id === 'nextPreset' ? 1 : -1);
      },
      press: (note, velocity) => session.input.press(note, velocity),
      release: (note) => session.input.release(note),
      touched: flash,
      learnChanged: (state) => {
        setLearn(state);
        if (state.phase === 'armed' && state.learned) onLearned.current(state.learned);
      },
    });
  }, [mappingStore, session]);

  // Quick Setup: a sequence of Learn steps. Each Mapping learned moves it on to the next step's target.
  const [setup, setSetup] = useState<QuickSetupState | null>(null);
  const [setupLast, setSetupLast] = useState<{ step: number; mapping: Mapping } | null>(null);
  const setupRef = useRef(setup);
  const updateSetup = (event: QuickSetupEvent | { type: 'start' }) => {
    const current = setupRef.current;
    const next =
      event.type === 'start' ? startQuickSetup(C16_SETUP, mappingStore.list()) : current && quickSetupReducer(current, event);
    if (!next || next === current) return;
    if (event.type === 'learned' && current) setSetupLast({ step: current.index, mapping: event.mapping });
    if (event.type === 'start') setSetupLast(null);
    setupRef.current = next.phase === 'cancelled' ? null : next;
    setSetup(setupRef.current);
    if (next.phase === 'running') {
      surface.startLearn();
      surface.select(next.steps[next.index].target);
    } else {
      surface.stopLearn();
      if (next.phase === 'cancelled') mappingStore.restore(next.before);
    }
  };
  const onLearned = useRef((mapping: Mapping): void => void mapping);
  onLearned.current = (mapping) => updateSetup({ type: 'learned', mapping });

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
      if (setupRef.current?.phase === 'running') updateSetup({ type: 'finish' });
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

  // MIDI Controllers: their Notes join the same Note input as the keyboard and piano.
  useEffect(() => {
    if (midiSupport(navigator) === 'unsupported') return setMidi({ kind: 'unsupported' });
    let dispose = () => {};
    let cancelled = false;
    navigator.requestMIDIAccess().then(
      (access) => {
        if (cancelled) return;
        dispose = connectMidi(access as unknown as MidiAccessLike, {
          onMessage: (m) => {
            if (m.type === 'noteOn' && demoStop.current) stopDemoRef.current();
            surface.handle(m);
            setActivity(describeMessage(m));
          },
          onDevices: (devices) => setMidi({ kind: 'ready', devices }),
        });
      },
      () => setMidi({ kind: 'denied' }),
    );
    return () => {
      cancelled = true;
      dispose();
    };
  }, [surface]);
  const [theme, setTheme] = useState(loadTheme);
  const [cycles, setCycles] = useState<ViewSettings['cycles']>(2);
  const [overlays, setOverlays] = useState(() => loadOverlays(localStorage));

  useEffect(() => saveOverlays(localStorage, overlays), [overlays]);

  // The Ideal Reference at the Oscillator Tap's level: the same series the engine plays, scaled by the Nominal Level.
  const ideal = useMemo(
    () => idealReference(patch, IDEAL_HARMONICS).map((m) => m * OSCILLATOR_LEVEL),
    // Only what the Ideal Reference depends on, not the whole Patch.
    [patch.waveform, patch.pulseWidth, patch.mixOsc1, patch.mixSub],
  );

  // Read by the render loop every frame; a stable getter keeps the Viewers mounted while settings change.
  const viewSettings = useRef<ViewSettings>({ cycles, ideal, overlays, viewer });
  viewSettings.current = { cycles, ideal, overlays, viewer };
  const view = useRef(() => viewSettings.current).current;

  useEffect(() => applyTheme(theme), [theme]);

  // Space Freezes the Viewers. It never plays a Note, and must not also press a focused button or scroll.
  useEffect(() => {
    const isSpace = (e: KeyboardEvent) => e.code === 'Space' && !(e.target instanceof HTMLInputElement);
    const down = (e: KeyboardEvent) => {
      if (!isSpace(e)) return;
      e.preventDefault();
      if (!e.repeat) dispatchViewer({ type: 'toggleFreeze' });
    };
    const up = (e: KeyboardEvent) => {
      if (isSpace(e)) e.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    session.engine.applyPatch(patch);
    session.input.setVoices(patch.voices);
  }, [session, patch]);
  useEffect(() => session.engine.setTapSource(viewer.tapSource), [session, viewer.tapSource]);

  useEffect(() => {
    const { input } = session;
    const isTyping = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey;
    // The Note each key started, so a key released after an octave shift still releases its own Note.
    const keyNotes = new Map<string, number>();

    const down = (e: KeyboardEvent) => {
      if (e.repeat || isTyping(e)) return;
      const shift = octaveKey(e.code);
      if (shift) return setOctave((o) => shiftOctave(o, shift));
      const note = keyToNote(e.code, octaveRef.current);
      if (note === undefined) return;
      keyNotes.set(e.code, note);
      input.press(note, 1);
    };
    const up = (e: KeyboardEvent) => {
      const note = keyNotes.get(e.code);
      if (note === undefined) return;
      keyNotes.delete(e.code);
      input.release(note);
    };
    const releaseAll = () => {
      for (const note of keyNotes.values()) input.release(note);
      keyNotes.clear();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', releaseAll);
    };
  }, [session]);

  const change = (id: ParamId, value: number) => setPatch((p) => setParam(p, id, value));

  const playControls = (
    <div className="play-controls" role="group" aria-label="Play">
      <div className="keyboard">
        <button type="button" className="tool tool-icon" aria-label="Octave down" onClick={() => setOctave((o) => shiftOctave(o, -1))}>
          −
        </button>
        <Tooltip content={TIPS.keyboard}>
          <Piano octave={octave} held={demoNotes.length ? [...heldNotes, ...demoNotes] : heldNotes} input={session.input} />
        </Tooltip>
        <button type="button" className="tool tool-icon" aria-label="Octave up" onClick={() => setOctave((o) => shiftOctave(o, 1))}>
          +
        </button>
      </div>
      <Tooltip content={TIPS.hold}>
        <button
          type="button"
          className="tool"
          aria-pressed={hold}
          data-learn="action:hold"
          data-mapped={learnContext.mapped.has('action:hold') || undefined}
          data-learn-selected={learnContext.selected === 'action:hold' || undefined}
          aria-label="Hold"
          onClick={() => setHold((h) => !h)}
        >
          <HoldIcon />
          <span className="tool-word">Hold</span>
        </button>
      </Tooltip>
      <MidiPanel
        state={midi}
        activity={activity}
        mappings={mappings}
        learning={learning}
        onLearn={() => surface.startLearn()}
        onDone={() => (setupRef.current ? updateSetup({ type: 'finish' }) : surface.stopLearn())}
        onQuickSetup={() => updateSetup({ type: 'start' })}
        onRemove={(target) => mappingStore.remove(target)}
        onClear={() => mappingStore.clear()}
      />
    </div>
  );


  const viewers = (
    tap: keyof AudioSession['engine']['taps'],
    name: string,
    extra: {
      showIdeal?: boolean;
      response?(f: Float32Array<ArrayBuffer>): Float32Array;
      limiting?(): boolean;
    } = {},
  ) => (
      <TapViewers
        name={name}
        analyser={session.engine.taps[tap]}
        sampleRate={session.ctx.sampleRate}
        fundamental={session.engine.fundamental}
        view={view}
        {...extra}
      />
    );

  return (
    <LearnContext.Provider value={learnContext}>
      <main data-frozen={viewer.frozen || undefined} data-learning={learning || undefined}>
        {setup ? (
          <QuickSetupPanel
            state={setup}
            last={setupLast}
            onBack={() => updateSetup({ type: 'back' })}
            onSkip={() => updateSetup({ type: 'skip' })}
            onFinish={() => updateSetup({ type: 'finish' })}
            onCancel={() => updateSetup({ type: 'cancel' })}
            onClose={() => {
              setupRef.current = null;
              setSetup(null);
            }}
          />
        ) : (
          <LearnBar state={learn} />
        )}
        <header>
          <div className="header-left">
            <h1 className="wordmark">
              <Logo />
              <span className="wordmark-text">Limpide</span>
            </h1>
            <PatchBar name={patchName} changed={patchChanged} patch={patch} library={library} onLoad={loadPatch} />
          </div>
          <div className="header-center">{playControls}</div>
          <div className="header-right">
            <Tooltip content={TIPS.demo}>
              <button type="button" className="tool tool-mode demo-button" aria-label="Demo" aria-pressed={demo !== null} data-demo onClick={toggleDemo}>
                <PlayIcon />
                <span className="demo-word">Demo</span>
              </button>
            </Tooltip>
            <DisplayMenu active={viewer.frozen || viewer.snapshot !== null}>
              <section className="toolbar" aria-label="Viewer controls">
                <div className="toolbar-groups">
                  <ToolGroup title="View">
                    <ViewActions state={viewer} dispatch={dispatchViewer} />
                  </ToolGroup>
                  <ToolGroup title="Axes">
                    <AxesControls state={viewer} dispatch={dispatchViewer} cycles={cycles} onCycles={setCycles} />
                  </ToolGroup>
                  <ToolGroup title="Show">
                    <OverlayToggles value={overlays} onToggle={(o) => setOverlays((v) => toggleOverlay(v, o))} />
                  </ToolGroup>
                  <ToolGroup title="Theme">
                    <Tooltip content={TIPS.theme}>
                      <Segmented
                        label="Theme"
                        value={theme}
                        options={[
                          { value: 'dark', label: 'Dark' },
                          { value: 'light', label: 'Light' },
                        ]}
                        onChange={(v) => setTheme(v as Theme)}
                      />
                    </Tooltip>
                  </ToolGroup>
                </div>
              </section>
            </DisplayMenu>
          </div>
        </header>

        {audioStatus === 'blocked' && (
          <p className="audio-blocked" role="status">
            This browser is holding back sound: click anywhere on the page to enable it.
          </p>
        )}

        <div className="chain">
          <Block
            title="Oscillators"
            stage="osc"
            ids={[]}
            patch={patch}
            onChange={change}
            viewers={viewers('oscillator', 'Oscillator', { showIdeal: true })}
            more={
            <div className="source-rows">
              <Tabs
                label="Oscillator"
                tabs={[
                  {
                    id: 'osc1',
                    label: 'Osc 1',
                    content: (
                    <SubBlock title="Osc 1" label="Waveform" group>
                      <WaveformPicker label="Osc 1 Waveform" choice="waveform" value={patch.waveform} onChange={(w) => setPatch((p) => setWaveform(p, w))} />
                      <div className="knobs">
                        <Tooltip content={TIPS.pulseWidth}>
                          <Knob id="pulseWidth" value={patch.pulseWidth} onChange={(v) => change('pulseWidth', v)} inactive={patch.waveform !== 'pulse'} />
                        </Tooltip>
                      </div>
                    </SubBlock>
                    ),
                  },
                  {
                    id: 'osc2',
                    label: 'Osc 2',
                    tip: TIPS.osc2,
                    badge: patch.mixOsc2 > 0,
                    badgeLabel: 'sounding',
                    content: (
                    <SubBlock title="Osc 2" label="Waveform" group>
                      <WaveformPicker label="Osc 2 Waveform" choice="osc2Waveform" value={patch.osc2Waveform} onChange={(w) => setPatch((p) => setWaveform(p, w, 'osc2'))} />
                      <div className="knobs">
                        {/* Pulse Width first, where Osc 1 has it, so it stays put when switching tabs. */}
                        <Tooltip content={TIPS.pulseWidth}>
                          <Knob
                            id="osc2PulseWidth"
                            value={patch.osc2PulseWidth}
                            onChange={(v) => change('osc2PulseWidth', v)}
                            inactive={patch.mixOsc2 === 0 || patch.osc2Waveform !== 'pulse'}
                          />
                        </Tooltip>
                      </div>
                    </SubBlock>
                    ),
                  },
                ]}
              />
              {/* Osc 2's offsets from Osc 1, below both tabs: one set of knobs in one state, whichever tab shows. */}
              <SubBlock title="Tuning" tip={TIPS.tuning} group>
                <div className="knobs">
                  {(['osc2Octave', 'osc2Semitone'] as const).map((id) => (
                    <Knob key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} inactive={patch.mixOsc2 === 0} />
                  ))}
                  <Tooltip content={TIPS.detune}>
                    <Knob id="osc2Detune" value={patch.osc2Detune} onChange={(v) => change('osc2Detune', v)} inactive={patch.mixOsc2 === 0} />
                  </Tooltip>
                </div>
              </SubBlock>
              <SubBlock title="Mixer" tip={TIPS.mixer} group>
                <div className="knobs">
                  <Knob id="mixOsc1" value={patch.mixOsc1} onChange={(v) => change('mixOsc1', v)} />
                  <Knob id="mixOsc2" value={patch.mixOsc2} onChange={(v) => change('mixOsc2', v)} />
                  <Tooltip content={TIPS.noise}>
                    <Knob id="mixNoise" value={patch.mixNoise} onChange={(v) => change('mixNoise', v)} />
                  </Tooltip>
                  <Tooltip content={TIPS.sub}>
                    <Knob id="mixSub" value={patch.mixSub} onChange={(v) => change('mixSub', v)} />
                  </Tooltip>
                </div>
              </SubBlock>
            </div>
            }
          />
          <Block
            title="Filter"
            stage="filter"
            ids={[]}
            patch={patch}
            onChange={change}
            heading={
              <SubBlock title="Mode">
                <FilterShape mode={patch.filterMode} slope={patch.filterSlope} onChange={(c) => setPatch((p) => setFilter(p, c))} />
              </SubBlock>
            }
            more={
              <>
              <SubBlock title="Cutoff">
                <div className="knobs">
                  <Knob id="cutoff" value={patch.cutoff} onChange={(v) => change('cutoff', v)} />
                  <Knob id="resonance" value={patch.resonance} onChange={(v) => change('resonance', v)} />
                  <Tooltip content={TIPS.velocityCutoff}>
                    <Knob id="velocityCutoff" value={patch.velocityCutoff} onChange={(v) => change('velocityCutoff', v)} />
                  </Tooltip>
                  <Tooltip content={TIPS.keyTrack}>
                    <Knob id="keyTrack" value={patch.keyTrack} onChange={(v) => change('keyTrack', v)} />
                  </Tooltip>
                </div>
              </SubBlock>
              <SubBlock title="Filter Envelope" label="Envelope" tip={TIPS.filterEnvelope}>
                {/* Its own container: the row chooses five columns or 3+2 by the room beside the label. */}
                <div className="envelope-knobs">
                  <div className="knobs knobs-envelope">
                    <Tooltip content={TIPS.envAmount}>
                      <Knob id="filterEnvAmount" value={patch.filterEnvAmount} onChange={(v) => change('filterEnvAmount', v)} />
                    </Tooltip>
                    {(['filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'] as const).map((id) => (
                      <Knob key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} inactive={patch.filterEnvAmount === 0} />
                    ))}
                  </div>
                </div>
              </SubBlock>
              </>
            }
            viewers={viewers('filter', 'Filter', {
              showIdeal: true,
              response: session.engine.filterResponse,
            })}
          />
          <Block
            title="Amp"
            stage="amp"
            ids={[]}
            more={
              <SubBlock title="Amp Envelope" label="Envelope" tip={TIPS.ampEnvelope}>
                <div className="knobs">
                  {(['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease'] as const).map((id) => (
                    <Knob key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} />
                  ))}
                </div>
              </SubBlock>
            }
            heading={
              <div className="voices-field">
                <Tooltip content={TIPS.voices}>
                  <Segmented
                    label="Voices"
                    caption="Voices"
                    value={patch.voices}
                    options={CHOICES.voices.map((v) => ({ value: v, label: String(v) }))}
                    onChange={(voices) => setPatch((p) => ({ ...p, voices }))}
                    learn={{ kind: 'choice', id: 'voices' }}
                  />
                </Tooltip>
              </div>
            }
            patch={patch}
            onChange={change}
            viewers={viewers('amp', 'Amp', { limiting: session.engine.limiting })}
          />
        </div>

        <EnvelopeTimeline
          engine={session.engine}
          view={view}
          controls={<LfoControls patch={patch} onParam={change} onPatch={setPatch} />}
        />
      </main>
    </LearnContext.Provider>
  );
}
