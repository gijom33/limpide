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

/**
 * Merges Note presses from every source (computer keyboard, on-screen piano, MIDI) into one monophonic Voice
 * using last-note Note Priority, with Hold. A Note held by two sources sounds until both let go.
 */
export function createNoteInput(emit: (event: VoiceEvent) => void, onHeld: (notes: number[]) => void = () => {}): NoteInput {
  const held: number[] = []; // Notes down, oldest first; the last one sounds
  const holders = new Map<number, number>(); // how many sources hold each Note
  let hold = false;
  let gateOpen = false;

  return {
    press(note, velocity) {
      holders.set(note, (holders.get(note) ?? 0) + 1);
      if (held.includes(note)) return;
      held.push(note);
      onHeld([...held]);
      gateOpen = true;
      emit({ type: 'noteOn', note, velocity });
    },
    release(note) {
      const index = held.indexOf(note);
      if (index === -1) return;
      const remaining = (holders.get(note) ?? 1) - 1;
      if (remaining > 0) {
        holders.set(note, remaining);
        return;
      }
      holders.delete(note);
      const wasSounding = index === held.length - 1;
      held.splice(index, 1);
      onHeld([...held]);
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
