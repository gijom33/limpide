import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { startAudioSession, type AudioSession } from '../app/session';
import { keyToNote } from '../input/keyboardLayout';
import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { harmonicSeries } from '../music/harmonics';
import { defaultPatch, setParam, setWaveform, type ParamId, type Patch } from '../patch/patch';
import { loadOverlays, saveOverlays, toggleOverlay } from '../viewers/overlays';
import { INITIAL_VIEWER_STATE, viewerReducer } from '../viewers/viewerState';
import type { ViewSettings } from '../viewers/viewSettings';
import { Knob } from './Knob';
import { OverlayToggles } from './OverlayToggles';
import { TapViewers } from './TapViewers';
import { ViewerControls } from './ViewerControls';
import { applyTheme, loadTheme } from './theme';
import { WaveformPicker } from './WaveformPicker';

const KEYBOARD_OCTAVE = 4;
const IDEAL_HARMONICS = 256;
const CYCLE_CHOICES = [1, 2, 4] as const;

interface BlockProps {
  title: string;
  stage: 'osc' | 'filter' | 'amp';
  ids: ParamId[];
  patch: Patch;
  onChange(id: ParamId, v: number): void;
  children?: React.ReactNode;
  viewers?: React.ReactNode;
}

/** One stage of the signal-flow diagram: its controls on top, its Tap's Viewers below. */
function Block({ title, stage, ids, patch, onChange, children, viewers }: BlockProps) {
  return (
    <section className="block" data-stage={stage} aria-label={title}>
      <h2>{title}</h2>
      <div className="knobs">
        {children}
        {ids.map((id) => (
          <Knob key={id} id={id} value={patch[id]} onChange={(v) => onChange(id, v)} />
        ))}
      </div>
      {viewers}
    </section>
  );
}

export function App() {
  const [patch, setPatch] = useState(defaultPatch);
  const [session, setSession] = useState<AudioSession | null>(null);
  const held = useRef(new Set<number>());
  const [theme, setTheme] = useState(loadTheme);
  const [cycles, setCycles] = useState<ViewSettings['cycles']>(2);
  const [overlays, setOverlays] = useState(() => loadOverlays(localStorage));
  const [viewer, dispatchViewer] = useReducer(viewerReducer, INITIAL_VIEWER_STATE);

  useEffect(() => saveOverlays(localStorage, overlays), [overlays]);

  // The Ideal Reference at the Oscillator Tap's level: the same series the engine plays, scaled by the Nominal Level.
  const ideal = useMemo(() => {
    const { magnitudes } = harmonicSeries(patch.waveform, patch.pulseWidth, IDEAL_HARMONICS);
    return magnitudes.map((m) => m * OSCILLATOR_LEVEL);
  }, [patch.waveform, patch.pulseWidth]);

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
    session?.engine.applyPatch(patch);
  }, [session, patch]);

  useEffect(() => {
    if (!session) return;
    const { input } = session;
    const isTyping = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey;

    const down = (e: KeyboardEvent) => {
      const note = keyToNote(e.code, KEYBOARD_OCTAVE);
      if (note === undefined || e.repeat || isTyping(e)) return;
      held.current.add(note);
      input.press(note, 1);
    };
    const up = (e: KeyboardEvent) => {
      const note = keyToNote(e.code, KEYBOARD_OCTAVE);
      if (note === undefined) return;
      held.current.delete(note);
      input.release(note);
    };
    const releaseAll = () => {
      for (const note of held.current) input.release(note);
      held.current.clear();
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

  const viewers = (
    tap: keyof AudioSession['engine']['taps'],
    name: string,
    extra: {
      idleHint?: string;
      note?: string;
      showIdeal?: boolean;
      response?(f: Float32Array<ArrayBuffer>): Float32Array;
      ghostOf?: AnalyserNode;
    } = {},
  ) =>
    session && (
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
    <main>
      <header>
        <h1>SynthView</h1>
        <p className="hint" title="White keys on A S D F G H J K, black keys on W E T Y U">
          Play <kbd>A</kbd>–<kbd>K</kbd>
        </p>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? 'Light' : 'Dark'} theme
        </button>
      </header>

      <div className="toolbar" aria-label="Viewer controls">
        <ViewerControls state={viewer} dispatch={dispatchViewer} />
        <OverlayToggles value={overlays} onToggle={(o) => setOverlays((v) => toggleOverlay(v, o))} />
        <div className="cycles" role="radiogroup" aria-label="Scope cycles">
          <span>Scope cycles</span>
          {CYCLE_CHOICES.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={c === cycles} onClick={() => setCycles(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {!session && (
        <button className="start" onClick={async () => setSession(await startAudioSession(patch))}>
          Click to start audio
        </button>
      )}

      <div className="chain">
        <Block
          title="Oscillator"
          stage="osc"
          ids={[]}
          patch={patch}
          onChange={change}
          viewers={viewers('oscillator', 'Oscillator', {
            note: 'The Oscillator runs all the time, even between Notes. The Amp decides when you hear it.',
            showIdeal: true,
          })}
        >
          <WaveformPicker value={patch.waveform} onChange={(w) => setPatch((p) => setWaveform(p, w))} />
          <Knob
            id="pulseWidth"
            value={patch.pulseWidth}
            onChange={(v) => change('pulseWidth', v)}
            inactive={patch.waveform !== 'pulse'}
            inactiveHint="Only shapes the Pulse Waveform"
          />
        </Block>
        <Block
          title="Filter"
          stage="filter"
          ids={['cutoff', 'resonance']}
          patch={patch}
          onChange={change}
          viewers={
            session &&
            viewers('filter', 'Filter', {
              showIdeal: true,
              response: session.engine.filterResponse,
              ghostOf: session.engine.taps.oscillator,
            })
          }
        />
        <Block
          title="Amp"
          stage="amp"
          ids={['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease']}
          patch={patch}
          onChange={change}
          viewers={viewers('amp', 'Amp', { idleHint: 'Press a key' })}
        />
      </div>
    </main>
  );
}
