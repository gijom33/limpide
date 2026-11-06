import type { KeyValueStorage } from '../app/storage';
import type { PhraseAtTempo } from '../demo/phrase';
import { LEAD_IN, startDemo, startPhraseLoop } from '../demo/player';
import { startSong } from '../demo/song';
import { SHARED_RIFF, TRACK, type Track } from '../demo/track';
import { shiftOctave } from '../input/keyboardLayout';
import type { Patch } from '../patch/patch';
import type { KeptPatch, PatchStore } from '../patch/patchStore';
import { PRESETS, type Preset } from '../patch/presets';
import type { TempoStore } from '../play/tempoStore';
import type { TransportHost } from '../play/transport';
import { loadFinished, saveFinished } from '../tutorial/progress';
import { type Looking, TOUR, TOUR_LENGTH, TOUR_PATCH, type TourMove, tourAt, tourCardAt } from '../tutorial/tour';
import { applyStep, controlName, differences, doStep, type Held, held, isMade, onTarget, readyFor, type Tutorial } from '../tutorial/tutorial';
import { SECTION_OF, type SectionName } from '../ui/sections';
import type { Overlay } from '../viewers/overlays';
import type { ViewerStore } from '../viewers/viewerStore';
import { createSynthHand, withValues } from './synthHand';

/** What plays by itself: the Demo, the Song, or a Tutorial's or a Tour card's phrase (Listen). */
export type Playing = 'demo' | 'song' | 'listen';

/** How long the Demo's "you are playing now" stays once the person takes over. */
const TOOK_OVER_MS = 6000;
/** How long a Tutorial's control must rest within reach of its target for the Step to count. */
const SETTLE_MS = 400;
/** How often the Tour's hand moves the card's control: as often as the Demo's knobs. */
const TOUR_TICK_MS = 40;
/** Every control a Tour card turns: each card starts with them on the Tour's Patch's values. */
const TOUR_TURNED = [...new Set(TOUR.flatMap((card) => card.moves.map((m) => m.id)))];

/** A Tutorial under way: its card, which Steps are made, and what it changed in the Display itself (issue 158). */
interface UnderWay {
  tutorial: Tutorial;
  index: number;
  done: boolean[];
  /** What the Step's control held when the card came to it. */
  since?: Held;
  /** The Display Steps that came with their overlay on, which the Tutorial turned off. */
  turnedOff: number[];
  /** The Snapshot its Snapshot Step took, by its number, while it is still the one shown. */
  took?: number;
}

/** What the page shows of the Shows: what plays, the Tutorial or the Tour open, and their cards. */
export interface ShowsNow {
  playing: Playing | null;
  /** The Notes the Demo, the Song or Listen is playing, lit on the piano. */
  playedNotes: number[];
  /** The Demo's part playing, or null. */
  demo: number | null;
  /** The Demo's track: its own, or a riff on a shared sound. */
  demoTrack: Track;
  /** When the part playing began, on the page's clock, so the Demo's card can fill its segment in time. */
  partStart: number;
  /** The Section of the knob the Demo is turning, for the page to follow; `key` counts the moves. */
  follow: { name: SectionName; key: number } | null;
  /** The person played or touched something, and the Demo's card says it stopped. */
  tookOver: boolean;
  /**
   * The Tutorial open: its card (`index` −1 on the first, `steps.length` on the last), which Steps are made, its
   * Preset, and on the last card what differs from it.
   */
  tutorial: { tutorial: Tutorial; index: number; done: boolean[]; preset: Preset; differs: string[] } | null;
  /** The Tutorials finished, remembered. */
  finished: ReadonlySet<string>;
  /**
   * The Tour open: its card; the control the synth is turning; what the page shows where that control and the
   * Viewers do not fit together (issue 206); whether the synth still freezes the Viewers, and what the card names
   * meanwhile; and whether the person scrolled the page during this card, which is then theirs.
   */
  tour: { index: number; moving: TourMove['id'] | null; looking: Looking; freezing: boolean; naming: string[] | null; theirs: boolean } | null;
}

export interface ShowsHost {
  /** The engine's clock and Note calls. */
  engine: Pick<TransportHost, 'now' | 'noteOn' | 'noteOff' | 'release'>;
  patches: PatchStore;
  viewers: Pick<ViewerStore, 'get' | 'dispatch' | 'subscribe'>;
  tempo: Pick<TempoStore, 'take' | 'giveBack'>;
  /** Where the finished Tutorials are remembered. */
  storage: KeyValueStorage;
  /** Be told of the Notes held by hand: one ends the Song. */
  onHeld(listener: (notes: number[]) => void): () => void;
  /** The page, for its hide and show. */
  page: Pick<EventTarget, 'addEventListener'>;
  /** The page's clock, in ms. */
  clock?: () => number;
}

/** The Preset a Tutorial rebuilds. */
const presetOf = (tutorial: Tutorial) => PRESETS.find((p) => p.name === tutorial.preset)!;
/** Init, where the Demo ends and a Tutorial starts. */
const INIT = PRESETS[0];

/**
 * The synth's hand on Freeze for one Tour card (issue 130): it freezes and unfreezes as the card says until the
 * person freezes or unfreezes themselves, or had Freeze on as the card came up; from then on Freeze is theirs.
 * `follow` says whether the synth still has it; `release` lets go of the synth's own Freeze, never of theirs.
 */
function freezeHand(viewers: ShowsHost['viewers']) {
  const isFrozen = () => viewers.get().viewer.frozen;
  let mine = false;
  let theirs = isFrozen();
  // Freeze as the synth last left it: any other change is the person's.
  let expected = isFrozen();
  const unwatch = viewers.subscribe(() => {
    if (isFrozen() === expected) return;
    expected = isFrozen();
    theirs = true;
    mine = false;
  });
  const set = (on: boolean) => {
    if (isFrozen() === on) return;
    expected = on;
    mine = on;
    viewers.dispatch({ type: 'toggleFreeze' });
  };
  return {
    follow(on: boolean) {
      if (!theirs) set(on);
      return !theirs;
    },
    release() {
      unwatch();
      if (mine) set(false);
    },
  };
}

/**
 * The Shows (issue 243): what plays or guides the page, the Demo, the Song, a Tutorial and the Tour, and the rules
 * between them, built once in the audio session beside the Patch and Viewer stores (ADR-0014). One of the Demo, the
 * Song and a card's phrase (Listen) plays at a time; one of a Tutorial and the Tour is open. The Demo ends any other
 * Show, the Song ends the Tour; a Tutorial or the Tour starting stops whatever plays. React reads `get` and sends the
 * commands; the module runs its own timers.
 */
export function createShows({ engine, patches, viewers, tempo, storage, onHeld, page, clock = () => performance.now() }: ShowsHost) {
  const listeners = new Set<() => void>();
  const octaveListeners = new Set<(octave: number) => void>();

  // What plays by itself, one at a time (issue 75).
  let current: { kind: Playing; stop(): void } | null = null;
  let playing: Playing | null = null;
  let playedNotes: number[] = [];
  // The Demo: its part, its track, and the page following its knobs until the person scrolls.
  let part = 0;
  let partStart = 0;
  let demoTrack: Track = TRACK;
  let follow: ShowsNow['follow'] = null;
  let followPaused = false;
  let tookOver = false;
  let tookOverTimer: ReturnType<typeof setTimeout> | undefined;
  // A Tutorial.
  let lesson: UnderWay | null = null;
  let finished: ReadonlySet<string> = loadFinished(storage);
  // The Tour: the person's Patch kept aside, its card, and what its card shows.
  let kept: KeptPatch | null = null;
  let tour: ShowsNow['tour'] = null;
  let leaveCard: (() => void) | null = null;

  let state: ShowsNow;
  const tutorialNow = (): ShowsNow['tutorial'] => {
    if (!lesson) return null;
    const preset = presetOf(lesson.tutorial);
    const atEnd = lesson.index >= lesson.tutorial.steps.length;
    const differs = atEnd ? differences(patches.get().patch, preset.patch).map(controlName) : [];
    const was = state?.tutorial;
    if (was && was.tutorial === lesson.tutorial && was.index === lesson.index && was.done === lesson.done && was.differs.join() === differs.join()) return was;
    return { tutorial: lesson.tutorial, index: lesson.index, done: lesson.done, preset, differs };
  };
  const build = (): ShowsNow => ({
    playing, playedNotes, demo: playing === 'demo' ? part : null, demoTrack, partStart, follow, tookOver,
    tutorial: tutorialNow(), finished, tour,
  });
  state = build();
  /** The page told of what changed, once something has. */
  const publish = () => {
    const next = build();
    if ((Object.keys(next) as (keyof ShowsNow)[]).every((key) => next[key] === state[key])) return;
    state = next;
    for (const listener of listeners) listener();
  };
  const showOctave = (octave: number) => {
    for (const listener of octaveListeners) listener(shiftOctave(octave, 0));
  };

  const transport: TransportHost & { onNotes(notes: number[]): void } = {
    now: () => engine.now(),
    noteOn: (note, velocity, at) => engine.noteOn(note, velocity, at),
    noteOff: (at) => engine.noteOff(at),
    release: (note, at) => engine.release(note, at),
    onNotes: (notes) => {
      playedNotes = notes;
      publish();
    },
    // While a player plays, its BPM is the page's, counted from its first Note; the person's comes back after (issue 112).
    onTempo: (bpm, first) => tempo.take(bpm, first),
  };

  /** Nothing plays any more: the person's tempo comes back. */
  const stopped = () => {
    current = null;
    playing = null;
    publish();
    tempo.giveBack();
  };
  /** Stops what plays, or only `kind` if that is what plays. */
  const stop = (kind?: Playing) => {
    if (!current || (kind && current.kind !== kind)) return;
    current.stop();
    stopped();
  };
  const play = (kind: Playing, start: () => () => void) => {
    stop();
    current = { kind, stop: start() };
    playing = kind;
    publish();
  };

  // The Demo's "you are playing now" stays a moment, then goes.
  const setTookOver = (on: boolean) => {
    if (on === tookOver) return;
    tookOver = on;
    clearTimeout(tookOverTimer);
    if (on) tookOverTimer = setTimeout(() => setTookOver(false), TOOK_OVER_MS);
    publish();
  };

  // ---- A Tutorial (issue 57): a Preset rebuilt from Init, the person turning each control. A Step is made when its
  // control reaches the target, however it got there (hand, keys, MIDI, "Do it for me"); a knob or fader then snaps to
  // the exact value, so the finished sound is the Preset's.

  const scene = () => ({ patch: patches.get().patch, overlays: viewers.get().overlays, snapshot: viewers.get().viewer.snapshot });
  const showOverlay = (overlay: Overlay) => viewers.dispatch({ type: 'showOverlay', overlay });
  const hideOverlay = (overlay: Overlay) => viewers.dispatch({ type: 'hideOverlay', overlay });
  /** The overlays the Tutorial turned off whose Steps the person has not made: off still, unless they turned one on. */
  const stillOff = (l: UnderWay) => l.turnedOff.flatMap((i) => (!l.done[i] && l.tutorial.steps[i].kind === 'display' ? [l.tutorial.steps[i].overlay] : []));
  /**
   * What the Tutorial changed in the Display is given back as the person had it (issue 158): an overlay it turned off
   * and they never turned on again; the Snapshot its Step took, unless they cleared it or took another since.
   */
  const giveBackDisplay = (l: UnderWay | null) => {
    if (!l) return;
    for (const overlay of stillOff(l)) showOverlay(overlay);
    if (l.took !== undefined) viewers.dispatch({ type: 'clearSnapshot' });
  };
  const setLesson = (next: UnderWay | null) => {
    lesson = next;
    tutorialRules();
  };

  // A Step counts once its control rests within reach, not as a drag passes through on its way past (review 5,
  // 2026-10-27): any change of the Patch, the Snapshot or the card before then starts the wait again.
  let settle: { timer?: ReturnType<typeof setTimeout>; lesson?: UnderWay | null; patch?: Patch; made?: boolean; snapshot?: number | null } = {};
  let ruling = false;
  let again = false;
  /** The Tutorial's rules, after anything it reads changed: run to rest, never inside themselves. */
  const tutorialRules = () => {
    if (ruling) return void (again = true);
    ruling = true;
    try {
      do {
        again = false;
        ruleOnce();
      } while (again);
    } finally {
      ruling = false;
    }
    publish();
  };
  const ruleOnce = () => {
    const { patch, overlays, snapshot } = scene();
    // A Snapshot the person clears, or takes over the Tutorial's, is theirs: the Tutorial's is no longer shown to clear.
    if (lesson?.took !== undefined && lesson.took !== snapshot) lesson = { ...lesson, took: undefined };

    const step = lesson?.tutorial.steps[lesson.index];
    const made = !!step && !!lesson && isMade(step, { patch, overlays, snapshot }, lesson.since);
    if (settle.lesson !== lesson || settle.patch !== patch || settle.made !== made || settle.snapshot !== snapshot) {
      clearTimeout(settle.timer);
      settle = { lesson, patch, made, snapshot };
      if (lesson && step && !lesson.done[lesson.index] && made)
        settle.timer = setTimeout(() => {
          if (!onTarget(step, patch)) patches.change((p) => applyStep(p, step), 'tutorial');
          if (lesson) setLesson({ ...lesson, done: lesson.done.map((d, i) => d || i === lesson!.index), took: step.kind === 'action' && snapshot !== null ? snapshot : lesson.took });
        }, SETTLE_MS);
    }

    // The last card: the Tutorial counts as finished, and a sound that matches is named after its Preset.
    if (!lesson || lesson.index < lesson.tutorial.steps.length) return;
    const preset = presetOf(lesson.tutorial);
    if (!finished.has(preset.name)) {
      finished = new Set(finished).add(preset.name);
      saveFinished(storage, finished);
    }
    if (differences(patch, preset.patch).length === 0 && patches.get().name !== preset.name) patches.load(preset.name, preset.patch);
  };

  const quitTutorial = () => {
    giveBackDisplay(lesson);
    stop('listen');
    setLesson(null);
  };

  // ---- The Tour (issue 128): the person's Patch kept aside, the Tour's own loaded, then a card for each Section, the
  // synth turning its controls (`tourAt`) while its phrase plays; the cards after the Sections (issue 210) turn nothing
  // and play nothing, the Tour's Patch at rest. Its close, Done, the page hiding or going give the person's Patch back;
  // a Patch the person loads meanwhile ends it and stays.

  /** Ends the Tour, giving back the person's Patch unless `restore` is false (they loaded another). */
  const endTour = (restore = true) => {
    const mine = kept;
    if (!mine) return;
    // Let go first: the Patch given back is heard as a load, which would end the Tour again.
    kept = null;
    stop('listen');
    if (restore) patches.restore(mine);
    leaveCard?.();
    leaveCard = null;
    tour = null;
    publish();
  };
  const setTour = (changes: Partial<NonNullable<ShowsNow['tour']>>) => {
    if (!tour) return;
    const next = { ...tour, ...changes };
    const same = (Object.keys(next) as (keyof typeof next)[]).every((key) =>
      key === 'naming' ? next.naming?.join() === tour!.naming?.join() && (next.naming === null) === (tour!.naming === null) : next[key] === tour![key],
    );
    if (same) return;
    tour = next;
    publish();
  };
  /** A Tour card comes up: a Section's, its phrase playing and the synth turning its controls, or one after them. */
  const showCard = (index: number) => {
    if (tour?.index === index) return;
    leaveCard?.();
    tour = { index, moving: null, looking: 'control', freezing: false, naming: null, theirs: false };
    const shown = tourCardAt(index);
    const card = shown.kind === 'section' ? shown.section : undefined;
    patches.change((p) => withValues(p, Object.fromEntries(TOUR_TURNED.map((id) => [id, TOUR_PATCH.patch[id]]))), 'tour');
    // After the Sections, nothing plays (issue 210).
    if (card) listen(card);
    else stop('listen');
    const hand = createSynthHand(patches, 'tour');
    const unsubscribe = patches.subscribe(({ by }) => by === 'load' && endTour(false));
    const freeze = freezeHand(viewers);
    const began = clock();
    let timer: ReturnType<typeof setInterval> | undefined;
    if (card) {
      const turn = () => {
        // Ended by a load meanwhile: the Patch loaded is the person's.
        if (!kept) return;
        // Counted from the phrase's first beat, so a stage set before a Note, and a freeze once it has faded, fall there.
        const { values, moving, naming, looking } = tourAt(card, Math.max(0, (clock() - began) / 1000 - LEAD_IN));
        const holding = freeze.follow(naming !== null);
        setTour({ moving, looking, freezing: holding && card.freezes !== undefined, naming: holding ? naming : null });
        hand.turn(values);
      };
      turn();
      timer = setInterval(turn, TOUR_TICK_MS);
    }
    publish();
    leaveCard = () => {
      clearInterval(timer);
      unsubscribe();
      hand.stop();
      freeze.release();
    };
  };

  // ---- What the Shows hear by themselves.

  // A Note played by hand (keyboard, piano or MIDI) ends the Song: the person has taken over. Only a Note played after
  // it started: one already held (Hold) when the Song starts does not.
  onHeld((notes) => {
    if (notes.length) stop('song');
  });
  patches.subscribe(() => lesson && tutorialRules());
  viewers.subscribe(() => lesson && tutorialRules());
  page.addEventListener('pagehide', () => {
    // A page closed or reloaded mid-Tour keeps the person's Patch as its Last session, not the Tour's.
    endTour();
    // One closed mid-Tutorial keeps the overlays as the person had them, since they are remembered (the Snapshot is not).
    for (const overlay of lesson ? stillOff(lesson) : []) showOverlay(overlay);
  });
  // One kept by the browser to come back to finds them off again, the Steps still to make.
  page.addEventListener('pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) for (const overlay of lesson ? stillOff(lesson) : []) hideOverlay(overlay);
  });

  const stopDemo = (byThePerson = false) => {
    if (byThePerson && current?.kind === 'demo') setTookOver(true);
    stop('demo');
  };
  /**
   * The Demo: the track; or, with `shared`, only a riff, played on the Patch loaded now (a Share link's). `from` starts
   * it at that part: a segment on its card (the owner). It ends the Tour and a Tutorial.
   */
  const playDemo = ({ shared = false, from = 0 }: { shared?: boolean; from?: number } = {}) => {
    stop();
    endTour();
    quitTutorial();
    setTookOver(false);
    const track = shared
      ? { bpm: TRACK.bpm, parts: [{ preset: patches.get().name, phrase: SHARED_RIFF, caption: 'The sound someone shared with you: turn any knob and hear it change.' }] }
      : TRACK;
    demoTrack = track;
    play('demo', () => {
      // Knobs turned by hand while the Demo plays stay where they were put until its next part.
      const hand = createSynthHand(patches, 'demo');
      const stopPlayer = startDemo(
        {
          ...transport,
          showOctave,
          load: (p) => {
            followPaused = false;
            return hand.newPart(shared ? undefined : PRESETS.find((preset) => preset.name === p.preset)!, p.synced);
          },
          setParam: (id, value) => hand.turn({ [id]: value }),
          onMove: (id) => {
            if (followPaused) return;
            follow = { name: SECTION_OF[id], key: (follow?.key ?? 0) + 1 };
            publish();
          },
          onStep: (index, wait) => {
            part = index;
            partStart = clock() + wait * 1000;
            publish();
          },
          onEnd: () => {
            // The track is over: back to the starting point, silent, as if nothing had been touched. The shared sound
            // stays loaded.
            hand.stop();
            stopped();
            if (!shared) patches.load(INIT.name, INIT.patch);
          },
        },
        track,
        from,
      );
      return () => {
        stopPlayer();
        hand.stop();
      };
    });
  };
  /** The Song, which moves with the piano's `octave`. It ends the Tour, the person's Patch given back for it (issue 242). */
  const playSong = (octave: () => number) => {
    endTour();
    setTookOver(false);
    play('song', () => startSong({ ...transport, octave }));
  };
  /** A phrase over and over on the Patch as it is now, so both hands are free: a Tutorial's, or a Tour card's. */
  const listen = (phrase: PhraseAtTempo) => play('listen', () => startPhraseLoop({ ...transport, showOctave }, phrase));

  return {
    get: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    /** Be told of the octave the piano should show, so the Notes of the Demo's part or of Listen's phrase are in view. */
    onOctave(listener: (octave: number) => void) {
      octaveListeners.add(listener);
      return () => void octaveListeners.delete(listener);
    },

    playDemo,
    /** Stops the Demo; `byThePerson`, they played or touched something, and its card says so. */
    stopDemo,
    /**
     * The person took over: a key the Demo's stop rule does not let through, a press on the page, a Controller's Note
     * or Program Change. The Demo stops, and its card says so.
     */
    takeOver: () => stopDemo(true),
    dismissTookOver: () => setTookOver(false),
    toggleSong: (octave: () => number) => (current?.kind === 'song' ? stop('song') : playSong(octave)),
    /** The Tutorial's Listen: its phrase, or stopped. */
    toggleListen: () => (current?.kind === 'listen' ? stop('listen') : lesson && listen(lesson.tutorial)),

    /** A Tutorial starts on Init: whatever plays stops, the Tour ends, one under way gives back its Display. */
    startTutorial(tutorial: Tutorial) {
      giveBackDisplay(lesson);
      endTour();
      stop();
      setTookOver(false);
      patches.load(INIT.name, INIT.patch);
      setLesson({ tutorial, index: -1, done: tutorial.steps.map(() => false), turnedOff: [] });
    },
    /**
     * The next (+1) or previous (−1) card. A Display Step whose overlay is on already starts by turning it off, so the
     * person turns it on and sees what it adds (issue 158); a Rate Step not yet made starts with its knob turning what it
     * asks, Sync switched to suit (issue 193).
     */
    moveTutorial(delta: number) {
      if (!lesson) return;
      const before = scene();
      const index = Math.min(lesson.tutorial.steps.length, Math.max(-1, lesson.index + delta));
      const next = lesson.tutorial.steps[index];
      const off = next?.kind === 'display' && !lesson.done[index] && before.overlays[next.overlay];
      if (off) hideOverlay(next.overlay);
      if (next && !lesson.done[index] && readyFor(next, before.patch) !== before.patch) patches.change((p) => readyFor(next, p), 'tutorial');
      setLesson({ ...lesson, index, since: held(next, before), turnedOff: off && !lesson.turnedOff.includes(index) ? [...lesson.turnedOff, index] : lesson.turnedOff });
    },
    /** "Do it for me": the Step's change made for the person. */
    doStep() {
      const step = lesson?.tutorial.steps[lesson.index];
      if (step) doStep(step, { setPatch: (change) => patches.change(change, 'tutorial'), showOverlay, takeSnapshot: () => viewers.dispatch({ type: 'takeSnapshot' }) });
    },
    /** The last card's way to the Preset itself. */
    matchPreset() {
      const preset = state.tutorial?.preset;
      if (preset) patches.load(preset.name, preset.patch);
    },
    /** A Tutorial left: the Patch stays as the person built it, its Display changes given back, its Listen stopped. */
    quitTutorial,

    /**
     * The Tour starts: whatever plays stops, a Tutorial ends, the person's Patch is kept aside for the Tour's. Started
     * again while it runs, back to its first card.
     */
    startTour() {
      if (kept) return showCard(0);
      quitTutorial();
      stop();
      setTookOver(false);
      kept = patches.keep();
      patches.load(TOUR_PATCH.name, TOUR_PATCH.patch);
      showCard(0);
    },
    moveTour(delta: number) {
      if (tour) showCard(Math.min(TOUR_LENGTH - 1, Math.max(0, tour.index + delta)));
    },
    /** Done, or the Tour's close: the person's Patch given back. */
    endTour: () => endTour(),

    /**
     * The person scrolled the page themselves: it stops following the Demo's knobs until its next part (issue 227), and
     * a Tour card's Section for the rest of the card.
     */
    personScrolled() {
      if (playing === 'demo') followPaused = true;
      setTour({ theirs: true });
    },
    /** The page goes: nothing plays on, and the Tour gives the person's Patch back. */
    leave() {
      stop();
      endTour();
    },
  };
}

export type Shows = ReturnType<typeof createShows>;
