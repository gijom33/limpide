import { createSynthEngine, type SynthEngine } from '../engine/synthEngine';
import { createNoteInput, type NoteInput } from '../input/noteInput';
import type { Patch } from '../patch/patch';

export interface AudioSession {
  ctx: AudioContext;
  engine: SynthEngine;
  input: NoteInput;
}

let session: AudioSession | undefined;

/**
 * The page's one audio session, built at load. Its AudioContext starts suspended until the first interaction
 * (see unlockAudio), but the graph and the Taps exist from the start, so the Viewers can be shown at once.
 * A singleton because React may run initialisers twice, and browsers cap the number of AudioContexts.
 */
export function getAudioSession(patch: Patch): AudioSession {
  if (session) return session;
  const ctx = new AudioContext({ latencyHint: 'interactive' });
  const engine = createSynthEngine(ctx);
  engine.applyPatch(patch);
  const input = createNoteInput((event) => {
    if (event.type === 'noteOn') engine.noteOn(event.note, event.velocity);
    else if (event.type === 'pitchChange') engine.pitchChange(event.note);
    else engine.noteOff();
  });
  session = { ctx, engine, input };
  return session;
}
