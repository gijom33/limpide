import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getAudioSession, type AudioSession } from '../app/session';
import { unlockAudio, type AudioStatus } from '../app/unlockAudio';
import { keyToNote, octaveKey, shiftOctave } from '../input/keyboardLayout';
import { connectMidi, midiSupport, type MidiAccessLike } from '../midi/inputs';
import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { harmonicSeries } from '../music/harmonics';
import { setFilter, setParam, setWaveform, type ParamId, type Patch } from '../patch/patch';
import { createLibrary } from '../patch/library';
import { initialPatch } from '../patch/presets';
import { loadOverlays, saveOverlays, toggleOverlay } from '../viewers/overlays';
import { INITIAL_VIEWER_STATE, viewerReducer } from '../viewers/viewerState';
import type { ViewSettings } from '../viewers/viewSettings';
import { Knob } from './Knob';
import { OverlayToggles } from './OverlayToggles';
import { TapViewers } from './TapViewers';
import { MoonIcon, SunIcon } from './icons';
import { Logo } from './Logo';
import { TIPS } from './tips';
import { ToolGroup } from './ToolGroup';
import { FilterShape } from './FilterShape';
import { SubBlock } from './SubBlock';
import { LfoControls } from './LfoControls';
import { MidiStatus, type MidiState } from './MidiStatus';
import { Piano } from './Piano';
import { PatchBar } from './PatchBar';
import { Tabs } from './Tabs';
import { Tooltip, type TipContent } from './Tooltip';
import { AxesControls, ViewActions } from './ViewerControls';
import { EnvelopeTimeline } from './EnvelopeTimeline';
import { applyTheme, loadTheme } from './theme';
import { WaveformPicker } from './WaveformPicker';

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
        {heading}
        <div className="knobs">
          {children}
          {ids.map((id) => (
            <Knob key={id} id={id} value={patch[id]} onChange={(v) => onChange(id, v)} />
          ))}
          {extra}
        </div>
        {more}
      </div>
      {viewers}
    </section>
  );
}


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

  useEffect(() => session.onHeld(setHeldNotes), [session]);

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
            if (m.type === 'noteOn') session.input.press(m.note, m.velocity);
            else if (m.type === 'noteOff') session.input.release(m.note);
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
  }, [session]);
  const [theme, setTheme] = useState(loadTheme);
  const [cycles, setCycles] = useState<ViewSettings['cycles']>(2);
  const [overlays, setOverlays] = useState(() => loadOverlays(localStorage));
  const [viewer, dispatchViewer] = useReducer(viewerReducer, INITIAL_VIEWER_STATE);

  useEffect(() => saveOverlays(localStorage, overlays), [overlays]);

  // The Ideal Reference at the Oscillator Tap's level: the same series the engine plays, scaled by the Nominal Level.
  const ideal = useMemo(() => {
    const { magnitudes } = harmonicSeries(patch.waveform, patch.pulseWidth, IDEAL_HARMONICS);
    return magnitudes.map((m) => m * OSCILLATOR_LEVEL * patch.mixOsc1);
  }, [patch.waveform, patch.pulseWidth, patch.mixOsc1]);

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
  }, [session, patch]);

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
          <Piano octave={octave} held={heldNotes} input={session.input} />
        </Tooltip>
        <button type="button" className="tool tool-icon" aria-label="Octave up" onClick={() => setOctave((o) => shiftOctave(o, 1))}>
          +
        </button>
      </div>
      <Tooltip content={TIPS.hold}>
        <button type="button" className="tool" aria-pressed={hold} onClick={() => setHold((h) => !h)}>
          Hold
        </button>
      </Tooltip>
      <MidiStatus state={midi} />
    </div>
  );


  const viewers = (
    tap: keyof AudioSession['engine']['taps'],
    name: string,
    extra: {
      tip?: TipContent;
      showIdeal?: boolean;
      response?(f: Float32Array<ArrayBuffer>): Float32Array;
      ghostOf?: AnalyserNode;
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
    <main data-frozen={viewer.frozen || undefined}>
      <header>
        <h1 className="wordmark">
          <Logo />
          <span>
            Synth<span className="wordmark-view">View</span>
          </span>
        </h1>
        <PatchBar name={patchName} changed={patchChanged} patch={patch} library={library} onLoad={loadPatch} />

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
          </div>
        </section>
        <span className="theme-toggle">
          <Tooltip content={TIPS.theme}>
            <button
              type="button"
              className="tool tool-icon"
              aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </Tooltip>
        </span>
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
          viewers={viewers('oscillator', 'Oscillator', {
            tip: TIPS.oscillatorTap,
            showIdeal: true,
          })}
        >
          <div className="source-rows">
            <Tabs
              label="Oscillator"
              tabs={[
                {
                  id: 'osc1',
                  label: 'Osc 1',
                  content: (
                  <SubBlock title="Osc 1" group showTitle={false}>
                    <WaveformPicker label="Osc 1 Waveform" compact value={patch.waveform} onChange={(w) => setPatch((p) => setWaveform(p, w))} />
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
                  <SubBlock title="Osc 2" group showTitle={false}>
                    <WaveformPicker label="Osc 2 Waveform" compact value={patch.osc2Waveform} onChange={(w) => setPatch((p) => setWaveform(p, w, 'osc2'))} />
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
                      {(['osc2Octave', 'osc2Semitone'] as const).map((id) => (
                        <Knob key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} inactive={patch.mixOsc2 === 0} />
                      ))}
                      <Tooltip content={TIPS.detune}>
                        <Knob id="osc2Detune" value={patch.osc2Detune} onChange={(v) => change('osc2Detune', v)} inactive={patch.mixOsc2 === 0} />
                      </Tooltip>
                    </div>
                  </SubBlock>
                  ),
                },
              ]}
            />
            <SubBlock title="Mixer" tip={TIPS.mixer} group>
              <div className="knobs">
                <Knob id="mixOsc1" value={patch.mixOsc1} onChange={(v) => change('mixOsc1', v)} />
                <Knob id="mixOsc2" value={patch.mixOsc2} onChange={(v) => change('mixOsc2', v)} />
                <Tooltip content={TIPS.noise}>
                  <Knob id="mixNoise" value={patch.mixNoise} onChange={(v) => change('mixNoise', v)} />
                </Tooltip>
              </div>
            </SubBlock>
          </div>
        </Block>
        <Block
          title="Filter"
          stage="filter"
          ids={['cutoff', 'resonance']}
          extra={
            <Tooltip content={TIPS.velocityCutoff}>
              <Knob id="velocityCutoff" value={patch.velocityCutoff} onChange={(v) => change('velocityCutoff', v)} />
            </Tooltip>
          }
          patch={patch}
          onChange={change}
          heading={<FilterShape mode={patch.filterMode} slope={patch.filterSlope} onChange={(c) => setPatch((p) => setFilter(p, c))} />}
          more={
            <SubBlock title="Filter Envelope" tip={TIPS.filterEnvelope}>
              <div className="knobs knobs-envelope">
                <Tooltip content={TIPS.envAmount}>
                  <Knob id="filterEnvAmount" value={patch.filterEnvAmount} onChange={(v) => change('filterEnvAmount', v)} />
                </Tooltip>
                {(['filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'] as const).map((id) => (
                  <Knob key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} inactive={patch.filterEnvAmount === 0} />
                ))}
              </div>
            </SubBlock>
          }
          viewers={viewers('filter', 'Filter', {
            showIdeal: true,
            response: session.engine.filterResponse,
            ghostOf: session.engine.taps.oscillator,
          })}
        />
        <Block
          title="Amp"
          stage="amp"
          ids={['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease']}
          patch={patch}
          onChange={change}
          viewers={viewers('amp', 'Amp')}
        />
      </div>

      <EnvelopeTimeline
        engine={session.engine}
        view={view}
        controls={
          <>
            {playControls}
            <LfoControls patch={patch} onParam={change} onPatch={setPatch} />
          </>
        }
      />
    </main>
  );
}
