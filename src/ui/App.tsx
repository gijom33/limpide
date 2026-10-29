import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { type AudioSession, getAudioSession } from '../app/session';
import { safeStorage } from '../app/storage';
import { type AudioStatus, unlockAudio } from '../app/unlockAudio';
import { rememberWelcome, welcomeFor } from '../app/welcome';
import { shiftOctave } from '../input/keyboardLayout';
import { type Formula, harmonicFormula, responseFormula } from '../music/maths';
import { CHOICES, type ParamId, type Patch, setFilter, setParam, setWaveform } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { TUTORIALS } from '../tutorial/tutorials';
import { About } from './About';
import { DemoBar } from './DemoBar';
import { DisplayMenu } from './DisplayMenu';
import { EnvelopeTimeline } from './EnvelopeTimeline';
import { Fader } from './Fader';
import { FilterShape } from './FilterShape';
import { useHold } from './hooks/useHold';
import { useComputerKeyboard, useSpaceFreezes } from './hooks/useKeys';
import { useMidi } from './hooks/useMidi';
import { usePlayers } from './hooks/usePlayers';
import { useTutorialState } from './hooks/useTutorialState';
import { HoldIcon, InfoIcon, NoteIcon, PlayIcon } from './icons';
import { Knob } from './Knob';
import { LearnBar } from './LearnBar';
import { LfoControls } from './LfoControls';
import { LearnContext } from './learn';
import { MidiPanel } from './MidiPanel';
import { MathsContext } from './mathsContext';
import { ModulationContext } from './modulationRing';
import { OverlayToggles } from './OverlayToggles';
import { PatchBar } from './PatchBar';
import { Piano } from './Piano';
import { QuickSetupPanel } from './QuickSetupPanel';
import { SectionStrip } from './SectionStrip';
import { Segmented } from './Segmented';
import { SubBlock } from './SubBlock';
import { Tabs } from './Tabs';
import { TapViewers } from './TapViewers';
import { ToolGroup } from './ToolGroup';
import { type TipContent, Tooltip, TooltipsContext } from './Tooltip';
import { TutorialCard } from './TutorialCard';
import { TutorialMenu } from './TutorialMenu';
import { applyTheme, loadTheme, type Theme } from './theme';
import { TIPS, type VIEWER_TIPS } from './tips';

import { AxesControls, ViewActions } from './ViewerControls';
import { WaveformPicker } from './WaveformPicker';
import { Wordmark } from './Wordmark';

const LETTER_KEYS = 'limpide.letterKeys';
const TOOLTIPS = 'limpide.tooltips';
const BEND_RANGE = 'limpide.bendRange';
/** The piano starts on C4, the octave the octave buttons count from. */
const DEFAULT_OCTAVE = 4;
/** An octave button's shade, and its count (+2, −1): the octaves the piano is shifted its way (none at C4, or
    shifted the other way). */
const shifted = (octaves: number) =>
  octaves > 0 ? { 'data-shift': octaves, style: { '--shift': octaves } as React.CSSProperties } : {};

interface BlockProps {
  title: string;
  stage: 'osc' | 'filter' | 'amp';
  children?: React.ReactNode;
  /** Extra controls under the main knobs (e.g. the Filter Envelope). */
  more?: React.ReactNode;
  /** Controls on the heading line (e.g. the Filter Mode and Slope). */
  heading?: React.ReactNode;
  viewers?: React.ReactNode;
  /** What the stage does, on its heading. */
  tip?: TipContent;
}

/** One stage of the signal-flow diagram: its controls on top, its Tap's Viewers below. */
function Block({ title, stage, children, more, heading, viewers, tip }: BlockProps) {
  return (
    <section className="block" data-stage={stage} aria-label={title}>
      <div className="block-controls">
        {tip ? (
          <Tooltip content={tip}>
            <h2 className="has-tip">{title}</h2>
          </Tooltip>
        ) : (
          <h2>{title}</h2>
        )}
        <div className="rows">
          {heading}
          {children && <div className="knobs">{children}</div>}
          {more}
        </div>
      </div>
      {viewers}
    </section>
  );
}



export function App() {
  const storage = useMemo(safeStorage, []);
  const [session] = useState(() => getAudioSession(storage));
  const { patches, library, viewers: viewerStore } = session;
  const { patch, name: patchName, changed } = useSyncExternalStore(patches.subscribe, patches.get);
  const settings = useSyncExternalStore(viewerStore.subscribe, viewerStore.get);
  const { viewer, overlays } = settings;
  useEffect(() => {
    // A share link has done its job once loaded; drop it so a reload keeps later edits (autosaved).
    if (location.hash.startsWith('#p=')) history.replaceState(null, '', location.pathname + location.search);
  }, []);
  // A brand-new browser opens on About as a welcome, once; read before the first autosave makes it a Last session.
  const [welcome, setWelcome] = useState(() => welcomeFor(session.shared, storage, library));
  const [about, setAbout] = useState(welcome !== null);
  const closeAbout = () => {
    setAbout(false);
    if (welcome) {
      rememberWelcome(storage);
      setWelcome(null);
      // The welcome opened before anything had the focus: it goes to the Demo button, not the page (issue 51).
      requestAnimationFrame(() => document.querySelector<HTMLElement>('button[aria-label="Demo"]')?.focus());
    }
  };

  const [audioStatus, setAudioStatus] = useState<AudioStatus>('waiting');
  // Sound starts on the first key press, click or drag; there is no button to press first.
  useEffect(() => unlockAudio(session.ctx, window, setAudioStatus), [session]);

  const [octave, setOctave] = useState(DEFAULT_OCTAVE);
  const octaveRef = useRef(octave);
  octaveRef.current = octave;
  const modulationContext = useMemo(() => ({ engine: session.engine, patch: () => patches.get().patch, octave: octaveRef }), [session, patches]);
  // The letter keys play Notes unless turned off in Display (issue 51); remembered.
  const [letterKeys, setLetterKeys] = useState(() => storage.getItem(LETTER_KEYS) !== 'off');
  useEffect(() => storage.setItem(LETTER_KEYS, letterKeys ? 'on' : 'off'), [storage, letterKeys]);
  useComputerKeyboard(session, octaveRef, setOctave, letterKeys);
  // Tooltips open unless turned off in Display (issue 81); remembered.
  const [tooltips, setTooltips] = useState(() => storage.getItem(TOOLTIPS) !== 'off');
  useEffect(() => storage.setItem(TOOLTIPS, tooltips ? 'on' : 'off'), [storage, tooltips]);
  const { hold, pressHold, pressHoldRef, heldNotes, setPedal } = useHold(session);
  // How far a keyboard's bend wheel takes the pitch, in semitones each way (issue 52); remembered.
  const [bendRange, setBendRange] = useState(() => Number(storage.getItem(BEND_RANGE)) || 2);
  useEffect(() => storage.setItem(BEND_RANGE, String(bendRange)), [storage, bendRange]);

  useSpaceFreezes(viewerStore);
  const [theme, setTheme] = useState(loadTheme);
  useEffect(() => applyTheme(theme), [theme]);

  const players = usePlayers({
    session, octaveRef, setOctave, heldNotes,
    // The Demo loads its own Presets, and the page stays where the Demo leaves it.
    onDemoStart: () => {
      tutorial.end();
      midi.setBankFollow(null);
    },
  });
  const tutorial = useTutorialState({
    storage, patch, patchName, patches, overlays,
    showOverlay: (overlay) => viewerStore.dispatch({ type: 'showOverlay', overlay }),
    snapshot: viewer.snapshot,
    takeSnapshot: () => viewerStore.dispatch({ type: 'takeSnapshot' }),
    onStart: () => {
      players.stopAll();
      players.setTookOver(false);
    },
    onEnd: players.stopListen,
  });
  // The Tutorials, from the Patches panel and the header's Tutorial button alike.
  const tutorialList = TUTORIALS.map((t) => ({ preset: t.preset, finished: tutorial.finished.has(t.preset) }));
  const startTutorial = (preset: string) => tutorial.start(TUTORIALS.find((t) => t.preset === preset)!);
  const midi = useMidi({
    storage, session, pressHoldRef,
    onNote: () => players.stopDemoRef.current(true),
    onBend: (amount) => session.engine.setBend(amount * bendRange * 100),
    onPedal: setPedal,
    // Program n is the n-th Preset (0 is Init), so a keyboard's Program buttons step through them.
    onProgram: (number) => {
      const preset = PRESETS[number];
      if (preset) patches.load(preset.name, preset.patch);
    },
  });
  const { learnContext, learning } = midi;

  // Read by the render loop every frame, outside React (issue 77).
  const view = viewerStore.get;

  // A change by hand: a knob, a fader or a switch.
  const edit = (change: (patch: Patch) => Patch) => patches.change(change, 'hand');
  const change = (id: ParamId, value: number) => edit((p) => setParam(p, id, value));

  const viewers = (
    tap: keyof AudioSession['engine']['taps'],
    name: keyof typeof VIEWER_TIPS,
    extra: {
      showIdeal?: boolean;
      response?(f: Float32Array<ArrayBuffer>): Float32Array;
      limiting?(): boolean;
      formula?: Formula;
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
    <TooltipsContext.Provider value={tooltips}>
    <LearnContext.Provider value={learnContext}>
    <ModulationContext.Provider value={modulationContext}>
    <MathsContext.Provider value={overlays.maths ? patch : null}>
      <main data-frozen={viewer.frozen || undefined} data-learning={learning || undefined}>
        {midi.setup ? (
          <QuickSetupPanel
            state={midi.setup}
            last={midi.setupLast}
            onBack={() => midi.updateSetup({ type: 'back' })}
            onSkip={() => midi.updateSetup({ type: 'skip' })}
            onFinish={() => midi.updateSetup({ type: 'finish' })}
            onCancel={() => midi.updateSetup({ type: 'cancel' })}
            onClose={midi.closeSetup}
          />
        ) : (
          <LearnBar state={midi.learn} />
        )}
        {/* One order at every width (issue 44): the Wordmark and the Patch, playing and learning (Demo, Tutorial, Song), the
            keyboard, then Hold and set-up (Hold, MIDI, Display, About). Each layout places these groups; none reorders them. */}
        <header>
          <div className="header-left">
            <div className="header-identity">
              <Wordmark onOpen={() => setAbout(true)} />
              <PatchBar
                name={patchName}
                changed={changed}
                patch={patch}
                library={library}
                onLoad={patches.load}
                tutorials={tutorialList}
                onTutorial={startTutorial}
              />
            </div>
            <div className="header-play" role="group" aria-label="Play">
              <Tooltip content={TIPS.demo}>
                <button type="button" className="tool tool-mode demo-button" aria-label="Demo" aria-pressed={players.demo !== null} data-demo onClick={players.toggleDemo}>
                  <PlayIcon />
                  <span className="demo-word">Demo</span>
                </button>
              </Tooltip>
              <TutorialMenu tutorials={tutorialList} onStart={startTutorial} />
              <Tooltip content={TIPS.song}>
                <button type="button" className="tool tool-mode demo-button" aria-label="Song" aria-pressed={players.song} data-demo onClick={players.toggleSong}>
                  <NoteIcon />
                  <span className="demo-word">Song</span>
                </button>
              </Tooltip>
            </div>
          </div>
          {/* Up before down, as they stand on screen, so Tab meets them in that order (issue 47). */}
          <div className="keyboard">
            <button type="button" className="tool tool-icon octave" aria-label="Octave up" {...shifted(octave - DEFAULT_OCTAVE)} onClick={() => setOctave((o) => shiftOctave(o, 1))}>
              {octave > DEFAULT_OCTAVE ? `+${octave - DEFAULT_OCTAVE}` : '+'}
            </button>
            <button type="button" className="tool tool-icon octave" aria-label="Octave down" {...shifted(DEFAULT_OCTAVE - octave)} onClick={() => setOctave((o) => shiftOctave(o, -1))}>
              {octave < DEFAULT_OCTAVE ? `−${DEFAULT_OCTAVE - octave}` : '−'}
            </button>
            <Tooltip content={TIPS.keyboard} longPress={false}>
              <Piano octave={octave} held={players.playedNotes.length ? [...heldNotes, ...players.playedNotes] : heldNotes} input={session.input} invite={audioStatus === 'waiting'} />
            </Tooltip>
          </div>
          <div className="header-right">
            {/* Hold first on the right (the owner, 2026-10-27), the Tutorial taking its place on the left: the two sides
                stay about as wide, so the piano keeps the header's centre. */}
            <Tooltip content={TIPS.hold}>
              <button
                type="button"
                className="tool"
                aria-pressed={hold}
                data-learn="action:hold"
                data-mapped={learnContext.mapped.has('action:hold') || undefined}
                data-learn-selected={learnContext.selected === 'action:hold' || undefined}
                aria-label="Hold"
                onClick={pressHold}
              >
                <HoldIcon />
                <span className="tool-word">Hold</span>
              </button>
            </Tooltip>
            <MidiPanel
              state={midi.midi}
              onOpen={midi.connect}
              activity={midi.activity}
              mappings={midi.mappings}
              learning={learning}
              onLearn={() => midi.surface.startLearn()}
              onDone={() => (midi.setup ? midi.updateSetup({ type: 'finish' }) : midi.surface.stopLearn())}
              onQuickSetup={() => midi.updateSetup({ type: 'start' })}
              onC16Layout={midi.applyC16Layout}
              onRemove={(control) => midi.mappingStore.remove(control)}
              onClear={() => midi.mappingStore.clear()}
              bendRange={bendRange}
              onBendRange={setBendRange}
            />
            <DisplayMenu active={viewer.frozen || viewer.snapshot !== null}>
              <section className="toolbar" aria-label="Viewer controls">
                <div className="toolbar-groups">
                  <ToolGroup title="View">
                    <ViewActions state={viewer} dispatch={viewerStore.dispatch} />
                  </ToolGroup>
                  <ToolGroup title="Axes">
                    <AxesControls settings={settings} dispatch={viewerStore.dispatch} />
                  </ToolGroup>
                  <ToolGroup title="Show">
                    <OverlayToggles value={overlays} onToggle={(overlay) => viewerStore.dispatch({ type: 'toggleOverlay', overlay })} />
                  </ToolGroup>
                  <ToolGroup title="Keys">
                    <Tooltip content={TIPS.letterKeys}>
                      <Segmented
                        label="Letter keys"
                        value={letterKeys ? 'on' : 'off'}
                        options={[
                          { value: 'on', label: 'Play', name: 'Letter keys play Notes' },
                          { value: 'off', label: 'Off', name: 'Letter keys off' },
                        ]}
                        onChange={(v) => setLetterKeys(v === 'on')}
                      />
                    </Tooltip>
                  </ToolGroup>
                  <ToolGroup title="Tips">
                    <Tooltip content={TIPS.tooltips}>
                      <Segmented
                        label="Tooltips"
                        value={tooltips ? 'on' : 'off'}
                        options={[
                          { value: 'on', label: 'On' },
                          { value: 'off', label: 'Off' },
                        ]}
                        onChange={(v) => setTooltips(v === 'on')}
                      />
                    </Tooltip>
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
            <div className="about-menu">
              <Tooltip content={TIPS.about}>
                <button type="button" className="tool" aria-label="About" aria-haspopup="dialog" onClick={() => setAbout(true)}>
                  <InfoIcon />
                  <span className="tool-word">About</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </header>
        <SectionStrip follow={players.demo === null ? midi.bankFollow : players.follow} />
        <About
          open={about}
          welcome={welcome}
          onClose={closeAbout}
          onPlay={() => players.playDemo({ shared: welcome === 'shared' })}
          onTutorial={() => tutorial.start(TUTORIALS[0])}
        />

        {audioStatus === 'blocked' && (
          <p className="audio-blocked" role="status">
            This browser is holding back sound: click anywhere on the page to enable it.
          </p>
        )}

        <div className="chain">
          <Block
            title="Oscillators"
            tip={TIPS.oscillators}
            stage="osc"
            viewers={viewers('oscillator', 'Oscillator', {
              showIdeal: true,
              formula: overlays.maths ? harmonicFormula(patch.waveform, patch.pulseWidth) : undefined,
            })}
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
                      <Tooltip content={TIPS.waveform}>
                        <WaveformPicker label="Osc 1 Waveform" choice="waveform" value={patch.waveform} onChange={(w) => edit((p) => setWaveform(p, w))} />
                      </Tooltip>
                      <div className="knobs">
                        <Knob id="pulseWidth" value={patch.pulseWidth} onChange={(v) => change('pulseWidth', v)} inactive={patch.waveform !== 'pulse'} />
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
                        <Tooltip content={TIPS.waveform}>
                          <WaveformPicker label="Osc 2 Waveform" choice="osc2Waveform" value={patch.osc2Waveform} onChange={(w) => edit((p) => setWaveform(p, w, 'osc2'))} />
                        </Tooltip>
                        <div className="knobs">
                          {/* Pulse Width first, where Osc 1 has it, so it stays put when switching tabs. */}
                          <Knob
                            id="osc2PulseWidth"
                            value={patch.osc2PulseWidth}
                            onChange={(v) => change('osc2PulseWidth', v)}
                            inactive={patch.mixOsc2 === 0 || patch.osc2Waveform !== 'pulse'}
                          />
                        </div>
                      </SubBlock>
                    ),
                  },
                  {
                    // The third tab, so the Mixer's faders and the Oscillators' rows take turns and the stage is no
                    // taller than the others (all of them at once made it the tallest).
                    id: 'mixer',
                    label: 'Mixer',
                    tip: TIPS.mixer,
                    content: (
                    <SubBlock title="Mixer" label="Levels" tip={TIPS.mixer} group>
                      <div className="knobs">
                        <Fader id="mixOsc1" value={patch.mixOsc1} onChange={(v) => change('mixOsc1', v)} />
                        <Fader id="mixOsc2" value={patch.mixOsc2} onChange={(v) => change('mixOsc2', v)} />
                        <Fader id="mixNoise" value={patch.mixNoise} onChange={(v) => change('mixNoise', v)} />
                        <Fader id="mixSub" value={patch.mixSub} onChange={(v) => change('mixSub', v)} />
                      </div>
                    </SubBlock>
                    ),
                  },
                ]}
                // Osc 2's offsets from Osc 1, under both Oscillators: one set of knobs in one state, whichever
                // Oscillator shows (greyed out while Osc 2 is not mixed in). The Mixer takes its place.
                shared={{
                  under: ['osc1', 'osc2'],
                  content: (
                    <SubBlock title="Tuning" tip={TIPS.tuning} group>
                      <div className="knobs">
                        {(['osc2Octave', 'osc2Semitone'] as const).map((id) => (
                          <Knob key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} inactive={patch.mixOsc2 === 0} />
                        ))}
                        <Knob id="osc2Detune" value={patch.osc2Detune} onChange={(v) => change('osc2Detune', v)} inactive={patch.mixOsc2 === 0} />
                      </div>
                    </SubBlock>
                  ),
                }}
              />
            </div>
            }
          />
          <Block
            title="Filter"
            tip={TIPS.filter}
            stage="filter"
            heading={
              <SubBlock title="Mode">
                <FilterShape mode={patch.filterMode} slope={patch.filterSlope} onChange={(c) => edit((p) => setFilter(p, c))} />
              </SubBlock>
            }
            more={
              <>
              <SubBlock title="Cutoff">
                <div className="knobs">
                  <Knob id="cutoff" value={patch.cutoff} onChange={(v) => change('cutoff', v)} />
                  <Knob id="resonance" value={patch.resonance} onChange={(v) => change('resonance', v)} />
                  <Knob id="velocityCutoff" value={patch.velocityCutoff} onChange={(v) => change('velocityCutoff', v)} />
                  <Knob id="keyTrack" value={patch.keyTrack} onChange={(v) => change('keyTrack', v)} />
                </div>
              </SubBlock>
              <SubBlock title="Filter Envelope" label="Envelope" tip={TIPS.filterEnvelope}>
                <div className="envelope-knobs">
                  <div className="knobs knobs-envelope">
                    <Knob id="filterEnvAmount" value={patch.filterEnvAmount} onChange={(v) => change('filterEnvAmount', v)} />
                    {(['filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'] as const).map((id) => (
                      <Fader key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} inactive={patch.filterEnvAmount === 0} />
                    ))}
                  </div>
                </div>
              </SubBlock>
              </>
            }
            viewers={viewers('filter', 'Filter', {
              showIdeal: true,
              response: session.engine.filterResponse,
              formula: overlays.maths ? responseFormula(patch.filterMode, patch.filterSlope) : undefined,
            })}
          />
          <Block
            title="Amp"
            tip={TIPS.amp}
            stage="amp"
            more={
              <SubBlock title="Amp Envelope" label="Envelope" tip={TIPS.ampEnvelope}>
                {/* Four faders and a big knob, laid out as the Filter Envelope's row, its name placed alike (issue 80). */}
                <div className="envelope-knobs">
                  <div className="knobs knobs-envelope">
                    {(['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease'] as const).map((id) => (
                      <Fader key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} />
                    ))}
                    {/* The Amp's level, right of its Envelope (the owner, issue 62): an LFO on Volume rings it. */}
                    <Knob id="volume" value={patch.volume} onChange={(v) => change('volume', v)} />
                  </div>
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
                    onChange={(voices) => edit((p) => ({ ...p, voices }))}
                    learn={{ kind: 'choice', id: 'voices' }}
                  />
                </Tooltip>
                {/* Beside Voices, because it only slides a single Voice: with more, each Note starts at its pitch. */}
                <Knob id="glide" value={patch.glide} onChange={(v) => change('glide', v)} inactive={patch.voices > 1} />
              </div>
            }
            viewers={viewers('amp', 'Amp', { limiting: session.engine.limiting })}
          />

          {/* The fourth section, after the three stages: under them, beside them, or 2 × 2 with them, by the width. */}
          <EnvelopeTimeline
            engine={session.engine}
            view={view}
            patch={patch}
            controls={
              <div className="timeline-controls">
                {([1, 2] as const).map((n) => (
                  <LfoControls key={n} lfo={n} engine={session.engine} patch={patch} onParam={change} onPatch={edit} />
                ))}
              </div>
            }
          />
        </div>
        {(players.demo !== null || players.tookOver) && (
          <DemoBar
            playing={
              players.demo !== null && players.demoTrack.parts[players.demo]
                ? { part: players.demoTrack.parts[players.demo], index: players.demo, count: players.demoTrack.parts.length }
                : null
            }
            tookOver={players.tookOver}
            onStop={() => players.stopDemo()}
            onPlayAgain={() => players.playDemo()}
            onDismiss={() => players.setTookOver(false)}
          />
        )}
        {tutorial.lesson && tutorial.preset && (
          <TutorialCard
            tutorial={tutorial.lesson.tutorial}
            about={tutorial.preset.about}
            index={tutorial.lesson.index}
            done={tutorial.lesson.done}
            differs={tutorial.differs}
            listening={players.listening}
            onListen={() => (players.listening ? players.stopListen() : players.startListen(tutorial.lesson!.tutorial))}
            onBack={() => tutorial.move(-1)}
            onNext={() => tutorial.move(1)}
            onDoIt={tutorial.doIt}
            onMatch={tutorial.matchPreset}
            onQuit={tutorial.end}
          />
        )}
      </main>
    </MathsContext.Provider>
    </ModulationContext.Provider>
    </LearnContext.Provider>
    </TooltipsContext.Provider>
  );
}
