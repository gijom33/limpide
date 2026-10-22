import { useRef } from 'react';
import { nearestNote, noteToFrequency } from '../music/pitch';
import { keyToNote } from '../input/keyboardLayout';
import type { NoteInput } from '../input/noteInput';

// The computer-keyboard range: C to the E above (17 keys), with each key's letter.
const KEYS = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon'];
const letter = (code: string) => (code === 'Semicolon' ? ';' : code.slice(3));
const isBlack = (semitone: number) => [1, 3, 6, 8, 10].includes(semitone % 12);
const noteName = (note: number) => nearestNote(noteToFrequency(note)).name;

interface Props {
  octave: number;
  held: number[];
  input: NoteInput;
}

/**
 * The on-screen piano: the computer keyboard's range, letters on the keys, lit while a Note sounds from any
 * source. Press lower on a key to play harder (Velocity); drag across keys to slide from Note to Note.
 */
export function Piano({ octave, held, input }: Props) {
  const playing = useRef<number | null>(null);

  const noteAt = (x: number, y: number) => {
    const key = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-note]');
    if (!key) return null;
    const r = key.getBoundingClientRect();
    return { note: Number(key.dataset.note), velocity: 0.35 + 0.65 * Math.min(1, Math.max(0, (y - r.top) / r.height)) };
  };
  const play = (hit: { note: number; velocity: number } | null) => {
    if (hit?.note === playing.current) return;
    if (playing.current !== null) input.release(playing.current);
    playing.current = hit?.note ?? null;
    if (hit) input.press(hit.note, hit.velocity);
  };

  return (
    <div
      className="piano"
      role="group"
      aria-label="Piano"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        play(noteAt(e.clientX, e.clientY));
      }}
      onPointerMove={(e) => e.buttons && play(noteAt(e.clientX, e.clientY))}
      onPointerUp={() => play(null)}
      onPointerCancel={() => play(null)}
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
            <span aria-hidden="true">{letter(code)}</span>
          </button>
        );
      })}
    </div>
  );
}
