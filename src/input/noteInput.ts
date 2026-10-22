export type VoiceEvent =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'pitchChange'; note: number }
  | { type: 'noteOff' };

export interface NoteInput {
  press(note: number, velocity: number): void;
  release(note: number): void;
  /** Hold keeps the Gate open after the last key is released, until a new key or Hold off. */
  setHold(on: boolean): void;
}

/** Merges Note presses into one monophonic Voice using last-note Note Priority, with Hold. */
export function createNoteInput(emit: (event: VoiceEvent) => void): NoteInput {
  const held: number[] = []; // keys down, oldest first; the last one sounds
  let hold = false;
  let gateOpen = false;

  return {
    press(note, velocity) {
      if (held.includes(note)) return;
      held.push(note);
      gateOpen = true;
      emit({ type: 'noteOn', note, velocity });
    },
    release(note) {
      const index = held.indexOf(note);
      if (index === -1) return;
      const wasSounding = index === held.length - 1;
      held.splice(index, 1);
      if (!wasSounding) return;
      if (held.length) emit({ type: 'pitchChange', note: held[held.length - 1] });
      else if (!hold) {
        gateOpen = false;
        emit({ type: 'noteOff' });
      }
    },
    setHold(on) {
      hold = on;
      if (!on && gateOpen && !held.length) {
        gateOpen = false;
        emit({ type: 'noteOff' });
      }
    },
  };
}
