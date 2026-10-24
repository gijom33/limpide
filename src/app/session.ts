import { createSynthEngine, type SynthEngine } from '../engine/synthEngine';
import { createNoteInput, type NoteInput } from '../input/noteInput';
import type { Patch } from '../patch/patch';
import { playThroughSilentMode } from './unlockAudio';

export interface AudioSession {
  ctx: AudioContext;
  engine: SynthEngine;
  input: NoteInput;
  /** Be told which Notes are held (from any source), e.g. to light the on-screen piano. */
  onHeld(listener: (notes: number[]) => void): () => void;
  /** While on, held Notes do not sound by themselves: a Hold rhythm plays them instead. Gate offs still pass. */
  muteInput(on: boolean): void;
}

let session: AudioSession | undefined;

/**
 * The page's one audio session, built at load. Its AudioContext starts suspended until the first interaction
 * (see unlockAudio), but the graph and the Taps exist from the start, so the Viewers can be shown at once.
 * A singleton because React may run initialisers twice, and browsers cap the number of AudioContexts.
 */
export function getAudioSession(patch: Patch): AudioSession {
  if (session) return session;
  playThroughSilentMode(navigator);
  const ctx = new AudioContext({ latencyHint: 'interactive' });
  const engine = createSynthEngine(ctx);
  engine.applyPatch(patch);
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
  session = {
    ctx,
    engine,
    input,
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
