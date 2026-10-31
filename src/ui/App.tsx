import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { type AudioSession, getAudioSession } from '../app/session';
import { safeStorage } from '../app/storage';
import { type AudioStatus, unlockAudio } from '../app/unlockAudio';
import { rememberWelcome, welcomeFor } from '../app/welcome';
import { createCallingPhrase } from '../input/callingPhrase';
import { DEFAULT_OCTAVE, shiftOctave, startingOctave } from '../input/keyboardLayout';
import { type Formula, harmonicFormula, responseFormula } from '../music/maths';
import { CHOICES, osc1Heard, osc2Heard, type ParamId, type Patch, setFilter, setParam, setWaveform, subNoiseHeard } from '../patch/patch';
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
import { useMediaQuery } from './hooks/useMediaQuery';
import { useMidi } from './hooks/useMidi';
import { usePlayers } from './hooks/usePlayers';
import { useTutorialState } from './hooks/useTutorialState';
import { HoldIcon, InfoIcon, NoteIcon, PlayIcon } from './icons';
import { Knob } from './Knob';
import { LearnBar } from './LearnBar';
import { LfoControls } from './LfoControls';
import { LearnContext } from './learn';
import { Mascot } from './Mascot';
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
import { WaveformPicker, WaveIcon } from './WaveformPicker';
import { Wordmark } from './Wordmark';

const LETTER_KEYS = 'limpide.letterKeys';
const TOOLTIPS = 'limpide.tooltips';
const BEND_RANGE = 'limpide.bendRange';
/** Phones and the sections 2 × 2: the stylesheet's breakpoint, where the header's groups take rows of their own. */
const STACKED_HEADER = '(max-width: 860px)';
/** Why a greyed-out control does nothing now, for a screen reader (issue 104): what several controls share. */
const OSC1_SILENT = 'No effect while Osc 1 is silent';
const OSC2_SILENT = 'No effect while Osc 2 is silent';
const FILTER_ENVELOPE_IDLE = "No effect while the Filter Envelope Amount and Osc 2's Env Amount are 0";
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

  const [octave, setOctave] = useState(() => startingOctave(patches.get().patch));
  const octaveRef = useRef(octave);
  octaveRef.current = octave;
  // A Patch loaded starts the keyboard in its own octave, a bass on C2, or else on C4 (issue 125); the octave buttons
  // move it after. The Demo and Listen then show their phrase's octave over it.
  useEffect(() => patches.subscribe(({ after, by }) => by === 'load' && setOctave(startingOctave(after))), [patches]);
  // The octave buttons, Z and X move the keyboard from the octave shown and write it into the Patch, so a saved or
  // shared Patch opens where the player left it (issue 126).
  const moveOctave = useCallback(
    (delta: number) => {
      const next = shiftOctave(octaveRef.current, delta);
      octaveRef.current = next;
      setOctave(next);
      patches.change((p) => ({ ...p, keyboardOctave: next }), 'hand');
    },
    [patches],
  );
  // C, A, D, E played by hand calls the mascot up from behind the Amp, and again sends it away, melting (issue 115);
  // not remembered across a reload.
  const [mascot, setMascot] = useState<'off' | 'up' | 'leaving'>('off');
  useEffect(() => {
    const phrase = createCallingPhrase();
    return session.onPress((note) => phrase.press(note, performance.now() / 1000) && setMascot((m) => (m === 'off' ? 'up' : m === 'up' ? 'leaving' : m)));
  }, [session]);
  const mascotGone = useCallback(() => setMascot((m) => (m === 'leaving' ? 'off' : m)), []);
  const modulationContext = useMemo(() => ({ engine: session.engine, patch: () => patches.get().patch, octave: octaveRef }), [session, patches]);
  // The letter keys play Notes unless turned off in Display (issue 51); remembered.
  const [letterKeys, setLetterKeys] = useState(() => storage.getItem(LETTER_KEYS) !== 'off');
  useEffect(() => storage.setItem(LETTER_KEYS, letterKeys ? 'on' : 'off'), [storage, letterKeys]);
  useComputerKeyboard(session, octaveRef, moveOctave, letterKeys);
  // Tooltips open unless turned off in Display (issue 81); remembered.
  const [tooltips, setTooltips] = useState(() => storage.getItem(TOOLTIPS) !== 'off');
  useEffect(() => storage.setItem(TOOLTIPS, tooltips ? 'on' : 'off'), [storage, tooltips]);
  const { hold, pressHold, pressHoldRef, heldNotes, setPedal } = useHold(session);
  // How far a keyboard's bend wheel takes the pitch, in semitones each way (issue 52); remembered.
  const [bendRange, setBendRange] = useState(() => Number(storage.getItem(BEND_RANGE)) || 2);
  useEffect(() => storage.setItem(BEND_RANGE, String(bendRange)), [storage, bendRange]);

  useSpaceFreezes(viewerStore);
  const narrow = useMediaQuery(STACKED_HEADER);
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

  // The header's groups: Tab meets them as they stand on screen (issue 104). Up to 860 px (phones, and the sections
  // 2 × 2) the playing buttons come before set-up and the keyboard after both, on a row of its own; wider, the
  // keyboard comes before the buttons right of it, set-up on top. The CSS places the groups; this puts them in that
  // order, so the focus follows. React moves them, keyed, when the window crosses 860 px: nothing in them restarts.
  const identity = (
    <div key="identity" className="header-left">
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
    </div>
  );
  // Up before down, as they stand on screen, so Tab meets them in that order (issue 47).
  const keyboard = (
    <div key="keyboard" className="keyboard">
      <button type="button" className="tool tool-icon octave" aria-label="Octave up" {...shifted(octave - DEFAULT_OCTAVE)} onClick={() => moveOctave(1)}>
        {octave > DEFAULT_OCTAVE ? `+${octave - DEFAULT_OCTAVE}` : '+'}
      </button>
      <button type="button" className="tool tool-icon octave" aria-label="Octave down" {...shifted(DEFAULT_OCTAVE - octave)} onClick={() => moveOctave(-1)}>
        {octave < DEFAULT_OCTAVE ? `−${DEFAULT_OCTAVE - octave}` : '−'}
      </button>
      <Tooltip content={TIPS.keyboard} longPress={false}>
        <Piano octave={octave} held={players.playedNotes.length ? [...heldNotes, ...players.playedNotes] : heldNotes} input={session.input} invite={audioStatus === 'waiting'} />
      </Tooltip>
    </div>
  );
  // Hold first among the set-up buttons (the owner, 2026-10-27).
  const setUp = (
    <div key="set" className="header-set">
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
  );
  const play = (
    <div key="play" className="header-play" role="group" aria-label="Play">
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
  );
  // Set-up and playing and learning, right of the keyboard (the owner, 2026-10-29), so the Patch picker sits beside the
  // logo; set-up first there, so Hold stays first on the right (the owner, 2026-10-27).
  const right = (
    <div key="right" className="header-right">
      {narrow ? [play, setUp] : [setUp, play]}
    </div>
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
        {/* The Wordmark and the Patch, the keyboard, set-up (Hold, MIDI, Display, About) and playing and learning (Demo,
            Tutorial, Song), in the order each layout shows them (issues 44 and 104). */}
        <header>{narrow ? [identity, right, keyboard] : [identity, keyboard, right]}</header>
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
                    // A dot on each source's tab while it is heard, as on Osc 2's (the owner).
                    badge: osc1Heard(patch),
                    badgeLabel: 'sounding',
                    content: (
                      <>
                        <SubBlock title="Osc 1" label="Waveform" group>
                          <Tooltip content={TIPS.waveform}>
                            <WaveformPicker
                              label="Osc 1 Waveform"
                              choice="waveform"
                              value={patch.waveform}
                              onChange={(w) => edit((p) => setWaveform(p, w))}
                              inactive={!osc1Heard(patch) && OSC1_SILENT}
                            />
                          </Tooltip>
                          <div className="knobs">
                            <Knob
                              id="pulseWidth"
                              value={patch.pulseWidth}
                              onChange={(v) => change('pulseWidth', v)}
                              inactive={(!osc1Heard(patch) && OSC1_SILENT) || (patch.waveform !== 'pulse' && "No effect unless Osc 1's Waveform is Pulse")}
                            />
                          </div>
                        </SubBlock>
                        {/* Each Oscillator's pitch under its Waveform, on its own tab (the owner, issue 90): Osc 1's
                            Octave, and FM, Osc 2 swinging Osc 1's pitch whatever Osc 2's own fader (issue 89). */}
                        <SubBlock title="Osc 1 Pitch" label="Pitch" tip={TIPS.osc1Pitch} group>
                          <div className="knobs">
                            {/* Greyed out while Osc 1 is not heard (the owner); its Octave also moves the Sub. */}
                            <Knob id="osc1Octave" value={patch.osc1Octave} onChange={(v) => change('osc1Octave', v)} inactive={!osc1Heard(patch) && patch.mixSub === 0 && 'No effect while Osc 1 and the Sub are silent'} />
                            <Knob id="crossMod" value={patch.crossMod} onChange={(v) => change('crossMod', v)} inactive={!osc1Heard(patch) && OSC1_SILENT} />
                          </div>
                        </SubBlock>
                      </>
                    ),
                  },
                  {
                    id: 'osc2',
                    label: 'Osc 2',
                    tip: TIPS.osc2,
                    badge: osc2Heard(patch),
                    badgeLabel: 'sounding',
                    content: (
                      <>
                        <SubBlock title="Osc 2" label="Waveform" group>
                          <Tooltip content={TIPS.waveform}>
                            <WaveformPicker
                              label="Osc 2 Waveform"
                              choice="osc2Waveform"
                              value={patch.osc2Waveform}
                              onChange={(w) => edit((p) => setWaveform(p, w, 'osc2'))}
                              inactive={!osc2Heard(patch) && OSC2_SILENT}
                            />
                          </Tooltip>
                          <div className="knobs">
                            {/* Pulse Width where Osc 1 has it, so it stays put when switching tabs. */}
                            <Knob
                              id="osc2PulseWidth"
                              value={patch.osc2PulseWidth}
                              onChange={(v) => change('osc2PulseWidth', v)}
                              inactive={(!osc2Heard(patch) && OSC2_SILENT) || (patch.osc2Waveform !== 'pulse' && "No effect unless Osc 2's Waveform is Pulse")}
                            />
                          </div>
                        </SubBlock>
                        {/* Osc 2's offsets from the Note, then the Filter Envelope on its pitch (issue 93); greyed out
                            while Osc 2 is not heard. */}
                        <SubBlock title="Tuning" tip={TIPS.tuning} group>
                          <div className="knobs">
                            {(['osc2Octave', 'osc2Semitone', 'osc2Detune', 'osc2EnvAmount'] as const).map((id) => (
                              <Knob key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} inactive={!osc2Heard(patch) && OSC2_SILENT} />
                            ))}
                          </div>
                        </SubBlock>
                      </>
                    ),
                  },
                  {
                    // The Sub's and the Noise's own choices (issues 91 and 92), on a tab of their own (the owner), so
                    // the Mixer is its faders alone and no tab is taller than two rows.
                    id: 'subNoise',
                    label: 'Sub & Noise',
                    tip: TIPS.subNoise,
                    badge: subNoiseHeard(patch),
                    badgeLabel: 'sounding',
                    content: (
                      <>
                        <SubBlock title="Sub" tip={TIPS.subOptions} group>
                          <div className="choice-list">
                            <Segmented
                              label="Sub Octave"
                              caption="Octave"
                              value={patch.subOctave}
                              options={CHOICES.subOctave.map((v) => ({ value: v, label: `−${-v}`, name: `${-v} octave${v === -1 ? '' : 's'} down` }))}
                              onChange={(subOctave) => edit((p) => ({ ...p, subOctave }))}
                              learn={{ kind: 'choice', id: 'subOctave' }}
                              iconic
                              inactive={patch.mixSub === 0 && 'No effect while the Sub is silent'}
                            />
                            <Segmented
                              label="Sub Waveform"
                              caption="Waveform"
                              value={patch.subWaveform}
                              options={CHOICES.subWaveform.map((v) => ({ value: v, label: <WaveIcon waveform={v} />, name: v === 'square' ? 'Square' : 'Sine' }))}
                              onChange={(subWaveform) => edit((p) => ({ ...p, subWaveform }))}
                              learn={{ kind: 'choice', id: 'subWaveform' }}
                              iconic
                              inactive={patch.mixSub === 0 && 'No effect while the Sub is silent'}
                            />
                          </div>
                        </SubBlock>
                        <SubBlock title="Noise" tip={TIPS.noiseColour} group>
                          <div className="choice-list">
                            <Segmented
                              label="Noise Colour"
                              caption="Colour"
                              value={patch.noiseColour}
                              options={CHOICES.noiseColour.map((v) => ({
                                value: v,
                                label: <span className="noise-swatch" data-colour={v} />,
                                name: v === 'white' ? 'White' : 'Pink',
                              }))}
                              onChange={(noiseColour) => edit((p) => ({ ...p, noiseColour }))}
                              learn={{ kind: 'choice', id: 'noiseColour' }}
                              iconic
                              inactive={patch.mixNoise === 0 && 'No effect while the Noise is silent'}
                            />
                          </div>
                        </SubBlock>
                      </>
                    ),
                  },
                  {
                    // The last tab, so the Mixer's faders and the Oscillators' rows take turns and the stage is no
                    // taller than the others (all of them at once made it the tallest).
                    id: 'mixer',
                    label: 'Mixer',
                    tip: TIPS.mixer,
                    fill: true,
                    content: (
                    <SubBlock title="Mixer" label="Levels" tip={TIPS.mixer} group showTitle={false}>
                      {/* The name's column, so five faders share what is left of the width. */}
                      <div className="mixer-side">
                        <Tooltip content={TIPS.mixer}>
                          <h3 className="has-tip">Levels</h3>
                        </Tooltip>
                      </div>
                      <div className="knobs">
                        <Fader id="mixOsc1" value={patch.mixOsc1} onChange={(v) => change('mixOsc1', v)} />
                        <Fader id="mixOsc2" value={patch.mixOsc2} onChange={(v) => change('mixOsc2', v)} />
                        <Fader id="mixRing" value={patch.mixRing} onChange={(v) => change('mixRing', v)} />
                        <Fader id="mixNoise" value={patch.mixNoise} onChange={(v) => change('mixNoise', v)} />
                        <Fader id="mixSub" value={patch.mixSub} onChange={(v) => change('mixSub', v)} />
                      </div>
                    </SubBlock>
                    ),
                  },
                ]}
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
                      <Fader key={id} id={id} value={patch[id]} onChange={(v) => change(id, v)} inactive={patch.filterEnvAmount === 0 && patch.osc2EnvAmount === 0 && FILTER_ENVELOPE_IDLE} />
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
                <Knob id="glide" value={patch.glide} onChange={(v) => change('glide', v)} inactive={patch.voices > 1 && 'No effect with more than one Voice'} />
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
                ? { track: players.demoTrack, index: players.demo, startedAt: players.partStart }
                : null
            }
            tookOver={players.tookOver}
            onStop={() => players.stopDemo()}
            onJump={(from) => players.playDemo({ from })}
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
        {mascot !== 'off' && <Mascot patches={patches} leaving={mascot === 'leaving'} onGone={mascotGone} />}
      </main>
    </MathsContext.Provider>
    </ModulationContext.Provider>
    </LearnContext.Provider>
    </TooltipsContext.Provider>
  );
}
