import type { Voices } from '../patch/patch';

export type VoiceEvent =
  | { type: 'noteOn'; note: number; velocity: number }
  /** Monophonic: the sounding Note changes pitch without a new Gate (last-note priority, Glide). */
  | { type: 'pitchChange'; note: number }
  /** The Gate closes: every Voice releases. */
  | { type: 'noteOff' }
  /** Polyphonic: the Voice playing this Note releases; the others keep sounding. */
  | { type: 'release'; note: number };

export interface NoteInput {
  press(note: number, velocity: number): void;
  release(note: number): void;
  /** Hold keeps Notes sounding after their keys are released, until a new key (1 Voice) or Hold off. */
  setHold(on: boolean): void;
  /** How many Notes may sound at once (the Patch's Voices). Changing it releases everything sounding. */
  setVoices(count: Voices): void;
}

/**
 * Merges Note presses from every source (computer keyboard, on-screen piano, MIDI) into Voice events. With one
 * Voice, last-note Note Priority: the newest held Note sounds, and releasing it returns to the previous one. With
 * more, every press is a Note On and every release a release of that Note (ADR-0007). A Note held by two
 * sources sounds until both let go. Hold keeps sounding Notes going after their keys are released.
 * `onHeld` hears the Notes the on-screen piano lights: the keys down, and the Notes Hold keeps sounding.
 */
export function createNoteInput(emit: (event: VoiceEvent) => void, onHeld: (notes: number[]) => void = () => {}): NoteInput {
  const held: number[] = []; // Notes down, oldest first; with one Voice the last one sounds
  const holders = new Map<number, number>(); // how many sources hold each Note
  let hold = false;
  let gateOpen = false; // one Voice: whether anything sounds
  const sustained = new Set<number>(); // several Voices: Notes kept sounding by Hold after their key went up
  let kept: number | null = null; // one Voice: the Note Hold keeps sounding once every key is up
  let voices: Voices = 1;

  const report = () =>
    onHeld(
      voices === 1
        ? held.length || kept === null ? [...held] : [kept]
        : [...held, ...[...sustained].filter((note) => !held.includes(note))],
    );

  const mono = {
    press(note: number, velocity: number) {
      gateOpen = true;
      kept = null;
      emit({ type: 'noteOn', note, velocity });
    },
    release(index: number) {
      const wasSounding = index === held.length - 1;
      const [note] = held.splice(index, 1);
      if (wasSounding && !held.length && hold) kept = note;
      report();
      if (!wasSounding) return;
      if (held.length) emit({ type: 'pitchChange', note: held[held.length - 1] });
      else if (!hold) {
        gateOpen = false;
        emit({ type: 'noteOff' });
      }
    },
    holdOff() {
      kept = null;
      if (gateOpen && !held.length) {
        gateOpen = false;
        emit({ type: 'noteOff' });
      }
    },
  };

  const poly = {
    press(note: number, velocity: number) {
      sustained.delete(note); // a key pressed again retriggers its own Voice
      emit({ type: 'noteOn', note, velocity });
    },
    release(index: number) {
      const [note] = held.splice(index, 1);
      if (hold) sustained.add(note);
      report();
      if (!hold) emit({ type: 'release', note });
    },
    holdOff() {
      for (const note of sustained) emit({ type: 'release', note });
      sustained.clear();
    },
  };
  const mode = () => (voices === 1 ? mono : poly);

  return {
    press(note, velocity) {
      holders.set(note, (holders.get(note) ?? 0) + 1);
      if (held.includes(note)) return;
      held.push(note);
      mode().press(note, velocity);
      report();
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
      mode().release(index);
    },
    setHold(on) {
      hold = on;
      if (!on) mode().holdOff();
      report();
    },
    setVoices(count) {
      if (count === voices) return;
      const wasSounding = gateOpen || sustained.size > 0 || (voices > 1 && held.length > 0);
      voices = count;
      sustained.clear();
      kept = null;
      gateOpen = false;
      report();
      // Keys still down keep their place in `held` (the piano stays lit); they sound again when pressed anew.
      if (wasSounding) emit({ type: 'noteOff' });
    },
  };
}
