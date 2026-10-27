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
  /**
   * Hold keeps Notes sounding after their keys are released, until a new key (1 Voice), the same key pressed
   * again, or Hold off. `letGo: false` is a sustain pedal's hold: a key pressed again strikes its Note anew.
   */
  setHold(on: boolean, options?: { letGo?: boolean }): void;
  /** How many Notes may sound at once (the Patch's Voices). Changing it releases everything sounding. */
  setVoices(count: Voices): void;
}

/**
 * Merges Note presses from every source (computer keyboard, on-screen piano, MIDI) into Voice events. With one
 * Voice, last-note Note Priority: the newest held Note sounds, and releasing it returns to the previous one. With
 * more, every press is a Note On and every release a release of that Note (ADR-0007). A Note held by two
 * sources sounds until both let go. Hold keeps sounding Notes going after their keys are released; pressing one of
 * their keys again lets that Note go (the owner's call, 2026-10-27), and the key coming up does nothing more.
 * `onHeld` hears the Notes the on-screen piano lights: the keys down, and the Notes Hold keeps sounding.
 */
export function createNoteInput(emit: (event: VoiceEvent) => void, onHeld: (notes: number[]) => void = () => {}): NoteInput {
  const held: number[] = []; // Notes down, oldest first; with one Voice the last one sounds
  const holders = new Map<number, number>(); // how many sources hold each Note
  let hold = false;
  let letGoOnPress = true; // the Hold button's hold; a sustain pedal's strikes again
  let gateOpen = false; // one Voice: whether anything sounds
  const sustained = new Set<number>(); // several Voices: Notes kept sounding by Hold after their key went up
  // Several Voices: the Notes sounding by hand, oldest first (keys down and Notes Hold keeps). Never more than the
  // Voices: a Note beyond them takes the oldest one's Voice, as the engine does.
  let sounding: number[] = [];
  let kept: number | null = null; // one Voice: the Note Hold keeps sounding once every key is up
  let voices: Voices = 1;

  const report = () =>
    onHeld(
      voices === 1
        ? held.length || kept === null ? [...held] : [kept]
        : [...sounding],
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
    /** The Note Hold keeps, pressed again: it stops. */
    letGo(note: number) {
      if (kept !== note) return false;
      kept = null;
      gateOpen = false;
      emit({ type: 'noteOff' });
      return true;
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
      sounding = [...sounding.filter((n) => n !== note), note];
      emit({ type: 'noteOn', note, velocity });
      while (sounding.length > voices) {
        // The oldest Note's Voice went to the new one: a Note Hold kept is let go; a key still down falls silent.
        const oldest = sounding.shift()!;
        if (sustained.delete(oldest)) emit({ type: 'release', note: oldest });
      }
    },
    release(index: number) {
      const [note] = held.splice(index, 1);
      if (hold && sounding.includes(note)) sustained.add(note);
      else sounding = sounding.filter((n) => n !== note);
      report();
      if (!hold) emit({ type: 'release', note });
    },
    letGo(note: number) {
      if (!sustained.delete(note)) return false;
      sounding = sounding.filter((n) => n !== note);
      emit({ type: 'release', note });
      return true;
    },
    holdOff() {
      for (const note of sustained) emit({ type: 'release', note });
      sounding = sounding.filter((n) => !sustained.has(n));
      sustained.clear();
    },
  };
  const mode = () => (voices === 1 ? mono : poly);

  return {
    press(note, velocity) {
      // Not counted as held: its key coming up finds nothing to release.
      if (hold && letGoOnPress && !held.includes(note) && mode().letGo(note)) return report();
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
    setHold(on, { letGo = true } = {}) {
      hold = on;
      letGoOnPress = letGo;
      if (!on) mode().holdOff();
      report();
    },
    setVoices(count) {
      if (count === voices) return;
      const wasSounding = gateOpen || sustained.size > 0 || (voices > 1 && held.length > 0);
      voices = count;
      sustained.clear();
      // Keys still down keep their place in `held` (the piano stays lit); they sound again when pressed anew.
      sounding = count > 1 ? held.slice(-count) : [];
      kept = null;
      gateOpen = false;
      report();
      if (wasSounding) emit({ type: 'noteOff' });
    },
  };
}
