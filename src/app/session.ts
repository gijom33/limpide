import { createSynthEngine, type SynthEngine } from '../engine/synthEngine';
import { createNoteInput, type NoteInput } from '../input/noteInput';
import { createLibrary, type Library } from '../patch/library';
import { createPatchStore, type PatchStore } from '../patch/patchStore';
import { createTempoStore, type TempoStore } from '../play/tempoStore';
import { createShows, type Shows } from '../shows/shows';
import { createViewerStore, type ViewerStore } from '../viewers/viewerStore';
import { notesInTests } from './notesInTests';
import { PAUSE_AFTER, pauseInSilence } from './pauseInSilence';
import type { KeyValueStorage } from './storage';
import { needsATapToResume, playThroughSilentMode } from './unlockAudio';

declare global {
  interface Window {
    /** In the end-to-end tests' build only: how long a silence pauses the sound after, in seconds (issue 216). */
    __limpidePauseAfter?: number;
  }
}

export interface AudioSession {
  ctx: AudioContext;
  engine: SynthEngine;
  input: NoteInput;
  /** The Patch being played (ADR-0013): every change reaches the engine and the Note input through it, at once. */
  patches: PatchStore;
  /** What the Viewers read every frame: Freeze, the Snapshot, the axes, the overlays, the Ideal Reference (issue 77). */
  viewers: ViewerStore;
  /** The named Patches, and the autosaved Last session. */
  library: Library;
  /** The page's tempo (issue 112): the person's BPM, or a player's while it plays; synced LFOs follow it. */
  tempo: TempoStore;
  /** What plays or guides the page, the Demo, the Song, a Tutorial and the Tour, and the rules between them (issue 243). */
  shows: Shows;
  /** Whether the page opened on a Share link's Patch. */
  shared: boolean;
  /** Be told which Notes are held (from any source), e.g. to light the on-screen piano. */
  onHeld(listener: (notes: number[]) => void): () => void;
  /** Be told of each Note the player presses (computer keyboard, piano, MIDI), not the players' (issue 115). */
  onPress(listener: (note: number) => void): () => void;
  /** While on, held Notes do not sound by themselves: a Hold rhythm plays them instead. Gate offs still pass. */
  muteInput(on: boolean): void;
  /**
   * Wakes the sound from a pause in a long silence (issue 216) ahead of the Note that may follow, as the page's own
   * keys and pointer do: a Controller's every message (issue 238).
   */
  wake(): void;
}

let session: AudioSession | undefined;

/**
 * The page's one audio session, built at load. Its AudioContext starts suspended until the first interaction
 * (see unlockAudio), but the graph and the Taps exist from the start, so the Viewers can be shown at once.
 * A singleton because React may run initialisers twice, and browsers cap the number of AudioContexts. The Patch store
 * is made here for the same reason: it starts on a Share link's Patch, else the Last session, else Init, and the
 * Share link is cleared from the address only once the page has started.
 */
export function getAudioSession(storage: KeyValueStorage): AudioSession {
  if (session) return session;
  playThroughSilentMode(navigator);
  const ctx = new AudioContext({ latencyHint: 'interactive' });
  const engine = createSynthEngine(ctx);
  notesInTests(engine);
  const library = createLibrary(storage);
  const listeners = new Set<(notes: number[]) => void>();
  const pressListeners = new Set<(note: number) => void>();
  let muted = false;
  const notes = createNoteInput(
    (event) => {
      if (muted && event.type !== 'noteOff') return;
      if (event.type === 'noteOn') engine.noteOn(event.note, event.velocity, undefined, { afresh: event.afresh });
      else if (event.type === 'pitchChange') engine.pitchChange(event.note);
      else if (event.type === 'release') engine.release(event.note);
      else engine.noteOff();
    },
    (held) => listeners.forEach((l) => l(held)),
  );
  const input: NoteInput = {
    ...notes,
    press(note, velocity) {
      notes.press(note, velocity);
      for (const listener of pressListeners) listener(note);
    },
  };
  const patches = createPatchStore({
    hash: location.hash,
    library,
    apply: (patch, { whole }) => {
      engine.applyPatch(patch, { whole });
      input.setVoices(patch.voices);
    },
  });
  const viewers = createViewerStore({ storage, patches, setTapSource: (source) => engine.setTapSource(source) });
  const tempo = createTempoStore({ storage, engine });
  // In a long silence the sound pauses (issue 216), while nothing plays by itself and no Controller's clock is followed.
  const silencePause = pauseInSilence({
    ctx,
    engine,
    page: window,
    busy: () => tempo.get().player || tempo.get().midi,
    allowed: !needsATapToResume(navigator),
    after: (import.meta.env.MODE === 'e2e' && window.__limpidePauseAfter) || PAUSE_AFTER,
  });
  const onHeld = (listener: (notes: number[]) => void) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  };
  const shows = createShows({ engine, patches, viewers, tempo, storage, onHeld, page: window });
  session = {
    ctx,
    engine,
    input,
    patches,
    viewers,
    library,
    tempo,
    shows,
    shared: patches.shared,
    onHeld,
    onPress(listener) {
      pressListeners.add(listener);
      return () => pressListeners.delete(listener);
    },
    muteInput(on) {
      muted = on;
    },
    wake: silencePause.wake,
  };
  return session;
}
