import { createSynthEngine, type SynthEngine } from '../engine/synthEngine';
import { createNoteInput, type NoteInput } from '../input/noteInput';
import { createLibrary, type Library } from '../patch/library';
import { createPatchStore, type PatchStore } from '../patch/patchStore';
import { initialPatch } from '../patch/presets';
import type { KeyValueStorage } from './storage';
import { playThroughSilentMode } from './unlockAudio';

export interface AudioSession {
  ctx: AudioContext;
  engine: SynthEngine;
  input: NoteInput;
  /** The Patch being played (ADR-0013): every change reaches the engine and the Note input through it, at once. */
  patches: PatchStore;
  /** The named Patches, and the autosaved Last session. */
  library: Library;
  /** Whether the page opened on a Share link's Patch. */
  shared: boolean;
  /** Be told which Notes are held (from any source), e.g. to light the on-screen piano. */
  onHeld(listener: (notes: number[]) => void): () => void;
  /** While on, held Notes do not sound by themselves: a Hold rhythm plays them instead. Gate offs still pass. */
  muteInput(on: boolean): void;
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
  const library = createLibrary(storage);
  const start = initialPatch(location.hash, library);
  const listeners = new Set<(notes: number[]) => void>();
  let muted = false;
  const input = createNoteInput(
    (event) => {
      if (muted && event.type !== 'noteOff') return;
      if (event.type === 'noteOn') engine.noteOn(event.note, event.velocity);
      else if (event.type === 'pitchChange') engine.pitchChange(event.note);
      else if (event.type === 'release') engine.release(event.note);
      else engine.noteOff();
    },
    (notes) => listeners.forEach((l) => l(notes)),
  );
  const patches = createPatchStore({
    start,
    library,
    apply: (patch) => {
      engine.applyPatch(patch);
      input.setVoices(patch.voices);
    },
  });
  session = {
    ctx,
    engine,
    input,
    patches,
    library,
    shared: start.shared,
    onHeld(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    muteInput(on) {
      muted = on;
    },
  };
  return session;
}
