import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useRef, useState } from 'react';
import type { AudioSession } from '../../app/session';
import { type DemoHost, startDemo } from '../../demo/player';
import { startSong } from '../../demo/song';
import { SHARED_RIFF, TRACK, type Track } from '../../demo/track';
import { shiftOctave } from '../../input/keyboardLayout';
import { type ParamId, type Patch, setParam } from '../../patch/patch';
import { PRESETS } from '../../patch/presets';
import type { Tutorial } from '../../tutorial/tutorial';
import { SECTION_OF, type SectionName } from '../sections';
import { freezesOnSpace } from './useKeys';

interface Host {
  session: AudioSession;
  patchRef: MutableRefObject<Patch>;
  patchName: string;
  setPatch: Dispatch<SetStateAction<Patch>>;
  loadPatch(name: string, patch: Patch): void;
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
export function usePlayers({ session, patchRef, patchName, setPatch, loadPatch, octaveRef, setOctave, heldNotes, onDemoStart }: Host) {
  const { engine } = session;
  const onDemoStartRef = useRef(onDemoStart);
  onDemoStartRef.current = onDemoStart;
  // The Notes the Demo, the Song or Listen is playing, lit on the piano.
  const [playedNotes, setPlayedNotes] = useState<number[]>([]);
  const notes: Pick<DemoHost, 'now' | 'voices' | 'noteOn' | 'noteOff' | 'release'> = {
    now: () => engine.now(),
    voices: () => patchRef.current.voices,
    noteOn: (note, velocity, at) => engine.noteOn(note, velocity, at),
    noteOff: (at) => engine.noteOff(at),
    release: (note, at) => engine.release(note, at),
  };

  // The Demo: which part plays (null when stopped), the track (the Demo's, or a riff on a shared sound), and whether a
  // Note or a control just stopped it (its card says so).
  const [demo, setDemo] = useState<number | null>(null);
  const [demoTrack, setDemoTrack] = useState<Track>(TRACK);
  const [tookOver, setTookOver] = useState(false);
  const demoStop = useRef<(() => void) | null>(null);
  // Knobs turned by hand while the Demo plays stay where they were put until its next Preset: its own moves skip them.
  const turnedByHand = useRef(new Set<ParamId>());
  // The section of the knob the Demo is turning, for the page to follow; a scroll of the person's own stops the
  // following until the Demo's next part.
  const [follow, setFollow] = useState<{ name: SectionName; key: number } | null>(null);
  const followPaused = useRef(false);

  /** `tookOver`: the person played or touched something, and the Demo's card says it stopped. */
  const stopDemo = (tookOver = false) => {
    if (tookOver && demoStop.current) setTookOver(true);
    demoStop.current?.();
    demoStop.current = null;
    setDemo(null);
  };
  const stopDemoRef = useRef(stopDemo);
  stopDemoRef.current = stopDemo;

  // The Song: it moves with the piano's octave. Playing a Note, the Demo or the Song button stops it.
  const [song, setSong] = useState(false);
  const songStop = useRef<(() => void) | null>(null);
  const stopSong = () => {
    songStop.current?.();
    songStop.current = null;
    setSong(false);
  };

  // Listen: a Tutorial's phrase, played over and over on the Patch as it is now, so both hands are free.
  const [listening, setListening] = useState(false);
  const listenStop = useRef<(() => void) | null>(null);
  const stopListen = () => {
    listenStop.current?.();
    listenStop.current = null;
    setListening(false);
  };

  /** The track; or, with `shared`, only a riff, played on the Patch loaded now (a Share link's). */
  const playDemo = ({ shared = false } = {}) => {
    stopDemo();
    stopSong();
    stopListen();
    onDemoStartRef.current();
    setTookOver(false);
    const track = shared
      ? { bpm: TRACK.bpm, parts: [{ preset: patchName, phrase: SHARED_RIFF, caption: 'The sound someone shared with you: turn any knob and hear it change.' }] }
      : TRACK;
    setDemoTrack(track);
    demoStop.current = startDemo(
      {
        ...notes,
        // The Patch goes to the engine at once, not on the next render: the part's first Notes follow straight away.
        load: (part) => {
          turnedByHand.current.clear();
          followPaused.current = false;
          if (shared) return patchRef.current;
          const preset = PRESETS.find((p) => p.name === part.preset)!;
          loadPatch(preset.name, preset.patch);
          patchRef.current = preset.patch;
          engine.applyPatch(preset.patch);
          return preset.patch;
        },
        setParam: (id, value) => {
          if (turnedByHand.current.has(id)) return;
          patchRef.current = setParam(patchRef.current, id, value);
          engine.applyPatch(patchRef.current);
          setPatch((p) => setParam(p, id, value));
        },
        onMove: (id) => {
          if (!followPaused.current) setFollow((f) => ({ name: SECTION_OF[id], key: (f?.key ?? 0) + 1 }));
        },
        onStep: setDemo,
        onNotes: setPlayedNotes,
        showOctave: (o) => setOctave(shiftOctave(o, 0)),
        onEnd: () => {
          // The track is over: back to the starting point, silent, as if nothing had been touched. The shared sound
          // stays loaded.
          demoStop.current = null;
          setDemo(null);
          if (shared) return;
          const init = PRESETS[0];
          loadPatch(init.name, init.patch);
        },
      },
      track,
    );
  };
  const toggleDemo = () => (demoStop.current ? stopDemo() : playDemo());

  const toggleSong = () => {
    if (songStop.current) return stopSong();
    stopDemo();
    stopListen();
    songStop.current = startSong({ ...notes, octave: () => octaveRef.current, onNotes: setPlayedNotes });
    setSong(true);
  };

  const startListen = (tutorial: Tutorial) => {
    stopDemo();
    stopSong();
    const play = () => {
      listenStop.current = startDemo(
        {
          ...notes,
          load: () => patchRef.current,
          setParam: () => {},
          onMove: () => {},
          onStep: () => {},
          onNotes: setPlayedNotes,
          showOctave: (o) => setOctave(shiftOctave(o, 0)),
          onEnd: play,
        },
        // The phrase many times over, as one track: the player starts each part on the last one's end, so the loop
        // keeps time (started again at each end, it fell off the beat by the player's lead-in).
        { bpm: tutorial.bpm, parts: Array.from({ length: 64 }, () => ({ preset: tutorial.preset, phrase: tutorial.phrase })) },
      );
    };
    play();
    setListening(true);
  };

  // Playing anything, or touching a control that does not shape the sound, ends the Demo: the person has taken over.
  // Knobs, faders and the stages' switches (Waveforms, Filter Mode and Slope, Voices, the LFOs' shapes and
  // destinations) can be changed while it plays, and the sound follows; moving around the page (the section strip,
  // the Oscillator tabs) leaves it playing too. So does Display, which shows the sound without changing it (issue 64):
  // opening it, its settings, Space's Freeze, and the click or Escape that closes it, unless that click is on the
  // piano, which plays (issue 71).
  useEffect(() => {
    if (demo === null) return;
    const stop = () => stopDemoRef.current(true);
    const shapesSound = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest('.knob, .block-controls [role="radio"], .timeline-controls [role="radio"], .destination-picker, .section-strip, [role="tab"]');
    const inDisplay = (target: EventTarget | null) => target instanceof Element && !!target.closest('.display-menu');
    const displayOpen = () => !!document.querySelector('.display-panel');
    const onKey = (e: KeyboardEvent) => {
      if (freezesOnSpace(e) || (e.key === 'Escape' && displayOpen())) return;
      if (e.key === 'Enter' && shapesSound(e.target)) return;
      if ((e.key === 'Enter' || e.key === ' ') && inDisplay(e.target)) return;
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !['Shift', 'Tab'].includes(e.key)) stop();
    };
    // A finger on the page may only be scrolling it: unless it lands on a control that takes touches itself
    // (knobs, piano), wait for it to lift. If the browser took it over to scroll, it is cancelled instead.
    let tap: number | null = null;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element;
      if ((!target.closest('main') && !target.closest('.section-strip')) || target.closest('[data-demo]') || shapesSound(target)) return;
      if (inDisplay(target) || (displayOpen() && !target.closest('.piano'))) return;
      if (e.pointerType === 'mouse' || getComputedStyle(target).touchAction === 'none') stop();
      else tap = e.pointerId;
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
  useEffect(() => {
    if (!heldNotes.length || !songStop.current) return;
    songStop.current();
    songStop.current = null;
    setSong(false);
  }, [heldNotes]);
  // The Demo's "you are playing now" stays a moment, then goes.
  useEffect(() => {
    if (!tookOver) return;
    const timer = setTimeout(() => setTookOver(false), 6000);
    return () => clearTimeout(timer);
  }, [tookOver]);
  // Nothing plays on after the page goes.
  useEffect(
    () => () => {
      listenStop.current?.();
      songStop.current?.();
      demoStop.current?.();
    },
    [],
  );

  return {
    playedNotes, turnedByHand,
    demo, demoTrack, follow, tookOver, setTookOver, playDemo, stopDemo, stopDemoRef, toggleDemo,
    song, stopSong, toggleSong,
    listening, startListen, stopListen,
  };
}
