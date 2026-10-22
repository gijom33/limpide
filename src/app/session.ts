import { createSynthEngine, type SynthEngine } from '../engine/synthEngine';
import { createNoteInput, type NoteInput } from '../input/noteInput';
import type { Patch } from '../patch/patch';

export interface AudioSession {
  ctx: AudioContext;
  engine: SynthEngine;
  input: NoteInput;
}

/** Creates the live AudioContext. Must be called from a user gesture (autoplay policy). */
export async function startAudioSession(patch: Patch): Promise<AudioSession> {
  const ctx = new AudioContext({ latencyHint: 'interactive' });
  await ctx.resume();
  const engine = createSynthEngine(ctx);
  engine.applyPatch(patch);
  const input = createNoteInput((event) => {
    if (event.type === 'noteOn') engine.noteOn(event.note, event.velocity);
    else if (event.type === 'pitchChange') engine.pitchChange(event.note);
    else engine.noteOff();
  });
  return { ctx, engine, input };
}
