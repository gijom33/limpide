export type VoiceEvent =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'pitchChange'; note: number }
  | { type: 'noteOff' };

export interface NoteInput {
  press(note: number, velocity: number): void;
  release(note: number): void;
}

/** Merges Note presses into one monophonic Voice using last-note Note Priority. */
export function createNoteInput(emit: (event: VoiceEvent) => void): NoteInput {
  const held: number[] = []; // oldest first; the last one sounds

  return {
    press(note, velocity) {
      if (held.includes(note)) return;
      held.push(note);
      emit({ type: 'noteOn', note, velocity });
    },
    release(note) {
      const index = held.indexOf(note);
      if (index === -1) return;
      const wasSounding = index === held.length - 1;
      held.splice(index, 1);
      if (!wasSounding) return;
      emit(held.length ? { type: 'pitchChange', note: held[held.length - 1] } : { type: 'noteOff' });
    },
  };
}
