import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getAudioSession, type AudioSession } from '../app/session';
import { unlockAudio, type AudioStatus } from '../app/unlockAudio';
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
import { MoonIcon, SunIcon } from './icons';
import { TIPS } from './tips';
import { ToolGroup } from './ToolGroup';
import { Tooltip, type TipContent } from './Tooltip';
import { AxesControls, ViewActions } from './ViewerControls';
import { EnvelopeTimeline } from './EnvelopeTimeline';
import { applyTheme, loadTheme } from './theme';
import { WaveformPicker } from './WaveformPicker';

const KEYBOARD_OCTAVE = 4;
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
  viewers?: React.ReactNode;
}

/** One stage of the signal-flow diagram: its controls on top, its Tap's Viewers below. */
function Block({ title, stage, ids, patch, onChange, children, more, viewers }: BlockProps) {
  return (
    <section className="block" data-stage={stage} aria-label={title}>
      <h2>{title}</h2>
      <div className="knobs">
        {children}
        {ids.map((id) => (
          <Knob key={id} id={id} value={patch[id]} onChange={(v) => onChange(id, v)} />
        ))}
      </div>
      {more}
      {viewers}
    </section>
  );
}

/** Pulse Width matters while either audible Oscillator plays a pulse. */
const usesPulse = (p: Patch) => p.waveform === 'pulse' || (p.osc2Waveform === 'pulse' && p.mixOsc2 > 0);

/** A labelled cluster of controls inside a stage (Osc 1, Osc 2, Mixer, Filter Envelope). */
function SubBlock({ title, tip, group, children }: { title: string; tip?: TipContent; group?: boolean; children: React.ReactNode }) {
  const heading = <h3 className={tip ? 'has-tip' : undefined}>{title}</h3>;
  return (
    <div className="sub-block" role={group ? 'group' : undefined} aria-label={group ? title : undefined}>
      {tip ? <Tooltip content={tip}>{heading}</Tooltip> : heading}
      {children}
    </div>
  );
}

export function App() {
  const [patch, setPatch] = useState(defaultPatch);
  const [session] = useState(() => getAudioSession(patch));
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('waiting');
  const [hold, setHold] = useState(false);

  useEffect(() => session.input.setHold(hold), [session, hold]);

  // Sound starts on the first key press, click or drag; there is no button to press first.
  useEffect(() => unlockAudio(session.ctx, window, setAudioStatus), [session]);
  const held = useRef(new Set<number>());
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
        <h1>SynthView</h1>
        <Tooltip content={TIPS.keyboard}>
          <p className="hint has-tip">
            Play <kbd>A</kbd>–<kbd>K</kbd>
          </p>
        </Tooltip>
        <Tooltip content={TIPS.hold}>
          <button type="button" className="tool" aria-pressed={hold} onClick={() => setHold((h) => !h)}>
            Hold
          </button>
        </Tooltip>
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
            <SubBlock title="Osc 1">
              <WaveformPicker label="Osc 1 Waveform" compact value={patch.waveform} onChange={(w) => setPatch((p) => setWaveform(p, w))} />
              <div className="knobs">
                <Tooltip content={TIPS.pulseWidth}>
                  <Knob id="pulseWidth" value={patch.pulseWidth} onChange={(v) => change('pulseWidth', v)} inactive={!usesPulse(patch)} />
                </Tooltip>
              </div>
            </SubBlock>
            <SubBlock title="Osc 2" tip={TIPS.osc2}>
              <WaveformPicker label="Osc 2 Waveform" compact value={patch.osc2Waveform} onChange={(w) => setPatch((p) => setWaveform(p, w, 'osc2'))} />
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
              </div>
            </SubBlock>
          </div>
        </Block>
        <Block
          title="Filter"
          stage="filter"
          ids={['cutoff', 'resonance']}
          patch={patch}
          onChange={change}
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
          viewers={viewers('amp', 'Amp', { idleHint: 'Press a key' })}
        />
      </div>

      <EnvelopeTimeline engine={session.engine} view={view} />
    </main>
  );
}
