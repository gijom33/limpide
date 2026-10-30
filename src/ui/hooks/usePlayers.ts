import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useRef, useState } from 'react';
import type { AudioSession } from '../../app/session';
import { createDemoKnobs } from '../../demo/demoKnobs';
import { startDemo, startPhraseLoop } from '../../demo/player';
import { startSong } from '../../demo/song';
import { demoStop, type Touched } from '../../demo/stopRule';
import { SHARED_RIFF, TRACK, type Track } from '../../demo/track';
import { shiftOctave } from '../../input/keyboardLayout';
import { PRESETS } from '../../patch/presets';
import type { TransportHost } from '../../play/transport';
import type { Tutorial } from '../../tutorial/tutorial';
import { SECTION_OF, type SectionName } from '../sections';
import { freezesOnSpace } from './useKeys';

type Playing = 'demo' | 'song' | 'listen';

/** What a key press or a touch was on, for the Demo's stop rule: the one place its selectors live (issue 79). */
function touchedBy(target: EventTarget | null): Touched {
  if (!(target instanceof Element)) return 'outside';
  if (target.closest('[data-demo]')) return 'demo';
  if (target.closest('.display-menu')) return 'display';
  if (target.closest('.knob, .block-controls [role="radio"], .timeline-controls [role="radio"], .destination-picker, .section-strip, [role="tab"]')) return 'sound';
  if (!target.closest('main')) return 'outside';
  if (target.closest('.piano')) return 'piano';
  return 'page';
}

interface Host {
  session: AudioSession;
  octaveRef: MutableRefObject<number>;
  setOctave: Dispatch<SetStateAction<number>>;
  /** The Notes held by hand: one ends the Song. */
  heldNotes: number[];
  /** The Demo starts: what else must stop (a Tutorial, the page following a Controller's bank). */
  onDemoStart(): void;
}

/**
 * The three things that play by themselves: the Demo (a track of Presets, knobs turning, until anything is touched),
 * the Song (a loop on the loaded Patch, which it never changes) and a Tutorial's Listen (its phrase, over and over).
 * One plays at a time; the Notes they play are lit on the piano.
 */
export function usePlayers({ session, octaveRef, setOctave, heldNotes, onDemoStart }: Host) {
  const { engine, patches } = session;
  const onDemoStartRef = useRef(onDemoStart);
  onDemoStartRef.current = onDemoStart;
  // The Notes the Demo, the Song or Listen is playing, lit on the piano.
  const [playedNotes, setPlayedNotes] = useState<number[]>([]);
  const transport: TransportHost & { onNotes(notes: number[]): void } = {
    now: () => engine.now(),
    noteOn: (note, velocity, at) => engine.noteOn(note, velocity, at),
    noteOff: (at) => engine.noteOff(at),
    release: (note, at) => engine.release(note, at),
    onNotes: setPlayedNotes,
  };
  const showOctave = (octave: number) => setOctave(shiftOctave(octave, 0));

  // What plays by itself, one at a time (issue 75): starting one stops the one playing.
  const [playing, setPlaying] = useState<Playing | null>(null);
  const current = useRef<{ kind: Playing; stop(): void } | null>(null);
  /** Stops what plays, or only `kind` if that is what plays. */
  const stop = (kind?: Playing) => {
    if (!current.current || (kind && current.current.kind !== kind)) return;
    current.current.stop();
    current.current = null;
    setPlaying(null);
  };
  const play = (kind: Playing, start: () => () => void) => {
    stop();
    current.current = { kind, stop: start() };
    setPlaying(kind);
  };

  // The Demo: which part plays, the track (the Demo's, or a riff on a shared sound), and whether a Note or a control
  // just stopped it (its card says so).
  const [part, setPart] = useState(0);
  const [demoTrack, setDemoTrack] = useState<Track>(TRACK);
  const [tookOver, setTookOver] = useState(false);
  // The section of the knob the Demo is turning, for the page to follow; a scroll of the person's own stops the
  // following until the Demo's next part.
  const [follow, setFollow] = useState<{ name: SectionName; key: number } | null>(null);
  const followPaused = useRef(false);

  /** `tookOver`: the person played or touched something, and the Demo's card says it stopped. */
  const stopDemo = (tookOver = false) => {
    if (tookOver && current.current?.kind === 'demo') setTookOver(true);
    stop('demo');
  };
  const stopDemoRef = useRef(stopDemo);
  stopDemoRef.current = stopDemo;

  /**
   * The track; or, with `shared`, only a riff, played on the Patch loaded now (a Share link's). `from` starts it at
   * that part: a dot on its card (the owner).
   */
  const playDemo = ({ shared = false, from = 0 } = {}) => {
    stop();
    onDemoStartRef.current();
    setTookOver(false);
    const track = shared
      ? { bpm: TRACK.bpm, parts: [{ preset: patches.get().name, phrase: SHARED_RIFF, caption: 'The sound someone shared with you: turn any knob and hear it change.' }] }
      : TRACK;
    setDemoTrack(track);
    play('demo', () => {
      // Knobs turned by hand while the Demo plays stay where they were put until its next part.
      const knobs = createDemoKnobs(patches);
      const stopPlayer = startDemo(
        {
          ...transport,
          showOctave,
          load: (p) => {
            followPaused.current = false;
            return knobs.newPart(shared ? undefined : PRESETS.find((preset) => preset.name === p.preset)!);
          },
          setParam: knobs.turn,
          onMove: (id) => {
            if (!followPaused.current) setFollow((f) => ({ name: SECTION_OF[id], key: (f?.key ?? 0) + 1 }));
          },
          onStep: setPart,
          onEnd: () => {
            // The track is over: back to the starting point, silent, as if nothing had been touched. The shared sound
            // stays loaded.
            knobs.stop();
            current.current = null;
            setPlaying(null);
            if (shared) return;
            const init = PRESETS[0];
            patches.load(init.name, init.patch);
          },
        },
        track,
        from,
      );
      return () => {
        stopPlayer();
        knobs.stop();
      };
    });
  };
  const toggleDemo = () => (current.current?.kind === 'demo' ? stopDemo() : playDemo());

  // The Song: it moves with the piano's octave. Playing a Note, the Demo or the Song button stops it.
  const stopSong = () => stop('song');
  const toggleSong = () =>
    current.current?.kind === 'song' ? stopSong() : play('song', () => startSong({ ...transport, octave: () => octaveRef.current }));

  // Listen: a Tutorial's phrase, played over and over on the Patch as it is now, so both hands are free.
  const stopListen = () => stop('listen');
  const startListen = (tutorial: Tutorial) => play('listen', () => startPhraseLoop({ ...transport, showOctave }, tutorial));

  const demo = playing === 'demo' ? part : null;

  // While the Demo plays, each key press and touch is described to its stop rule (`demoStop`, issue 79), which says
  // whether the person has taken over.
  useEffect(() => {
    if (demo === null) return;
    const stop = () => stopDemoRef.current(true);
    const displayOpen = () => !!document.querySelector('.display-panel');
    const onKey = (e: KeyboardEvent) => {
      const event = { kind: 'key', key: e.key, freezes: freezesOnSpace(e), modifier: e.metaKey || e.ctrlKey || e.altKey } as const;
      if (demoStop({ ...event, touched: touchedBy(e.target), displayOpen: displayOpen() }) === 'stop') stop();
    };
    // A finger on the page may only be scrolling it: unless it lands on a control that takes touches itself
    // (knobs, piano), wait for it to lift. If the browser took it over to scroll, it is cancelled instead.
    let tap: number | null = null;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element;
      const decision = demoStop({
        kind: 'pointer',
        touched: touchedBy(target),
        displayOpen: displayOpen(),
        mouse: e.pointerType === 'mouse',
        takesTouches: getComputedStyle(target).touchAction === 'none',
      });
      if (decision === 'stop') stop();
      else if (decision === 'onLift') tap = e.pointerId;
    };
    const onLift = (e: PointerEvent) => {
      if (e.pointerId === tap) stop();
    };
    const onCancel = () => (tap = null);
    // The person scrolling: the page stops following the Demo's knobs until its next part. A finger on a knob or the
    // piano (which take touches themselves) is not scrolling.
    const onWheel = () => (followPaused.current = true);
    const onTouchMove = (e: TouchEvent) => {
      if (e.target instanceof Element && getComputedStyle(e.target).touchAction !== 'none') followPaused.current = true;
    };
    // In the capture phase, before Display's own Escape or outside click closes it.
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('pointerup', onLift);
    document.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('pointerup', onLift);
      document.removeEventListener('pointercancel', onCancel);
    };
  }, [demo]);

  // A Note played by hand (keyboard, piano or MIDI) ends the Song: the person has taken over. Only a Note played
  // after it started: one already held (Hold) when the Song starts does not.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a new Note only; stopSong reads the ref of what plays
  useEffect(() => {
    if (heldNotes.length) stopSong();
  }, [heldNotes]);
  // The Demo's "you are playing now" stays a moment, then goes.
  useEffect(() => {
    if (!tookOver) return;
    const timer = setTimeout(() => setTookOver(false), 6000);
    return () => clearTimeout(timer);
  }, [tookOver]);
  // Nothing plays on after the page goes.
  useEffect(
    () => () => current.current?.stop(),
    [],
  );

  return {
    playedNotes, stopAll: () => stop(),
    demo, demoTrack, follow, tookOver, setTookOver, playDemo, stopDemo, stopDemoRef, toggleDemo,
    song: playing === 'song', stopSong, toggleSong,
    listening: playing === 'listen', startListen, stopListen,
  };
}
