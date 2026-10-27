import { useRef } from 'react';
import { keyToNote } from '../input/keyboardLayout';
import type { NoteInput } from '../input/noteInput';
import { nearestNote, noteToFrequency } from '../music/pitch';
import { PitchMarker } from './PitchMarker';

// The computer-keyboard range: C to the E above (17 keys).
const KEYS = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon'];
const isBlack = (semitone: number) => [1, 3, 6, 8, 10].includes(semitone % 12);
const noteName = (note: number) => nearestNote(noteToFrequency(note)).name;

interface Props {
  octave: number;
  held: number[];
  input: NoteInput;
  /** Sound has not started yet (the browser waits for the page to be used): the piano invites a first Note. */
  invite?: boolean;
}

/**
 * The on-screen piano: the computer keyboard's range, each C named with its octave (C3, C4…), lit while a Note
 * sounds from any source. Press lower on a key to play harder (Velocity); drag across keys to slide from Note
 * to Note. Each finger on a touch screen plays its own Note, as each key of the computer keyboard does (issue 39).
 */
export function Piano({ octave, held, input, invite }: Props) {
  // The Note each pointer plays. Two fingers on one key both hold it: the Note input counts its holders.
  const playing = useRef(new Map<number, number>());

  const noteAt = (x: number, y: number) => {
    const key = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-note]');
    if (!key) return null;
    const r = key.getBoundingClientRect();
    return { note: Number(key.dataset.note), velocity: 0.35 + 0.65 * Math.min(1, Math.max(0, (y - r.top) / r.height)) };
  };
  const play = (pointer: number, hit: { note: number; velocity: number } | null) => {
    const current = playing.current.get(pointer);
    if (hit?.note === current) return;
    if (current !== undefined) input.release(current);
    if (hit) {
      playing.current.set(pointer, hit.note);
      input.press(hit.note, hit.velocity);
    } else playing.current.delete(pointer);
  };

  return (
    <div
      className="piano"
      role="group"
      aria-label="Piano"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        play(e.pointerId, noteAt(e.clientX, e.clientY));
      }}
      onPointerMove={(e) => e.buttons && play(e.pointerId, noteAt(e.clientX, e.clientY))}
      onPointerUp={(e) => play(e.pointerId, null)}
      onPointerCancel={(e) => play(e.pointerId, null)}
    >
      {KEYS.map((code) => {
        const note = keyToNote(code, octave)!;
        return (
          <button
            key={code}
            type="button"
            tabIndex={-1}
            data-note={note}
            data-black={isBlack(note) || undefined}
            aria-label={noteName(note)}
            aria-pressed={held.includes(note)}
          >
            {note % 12 === 0 && <span aria-hidden="true">{noteName(note)}</span>}
          </button>
        );
      })}
      <PitchMarker />
      {invite && (
        <p className="play-invite" role="status">
          <span className="play-invite-pointer">Play to start the sound</span>
          <span className="play-invite-touch">Tap a key to start the sound</span>
        </p>
      )}
    </div>
  );
}
