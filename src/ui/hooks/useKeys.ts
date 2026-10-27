import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect } from 'react';
import type { AudioSession } from '../../app/session';
import { keyToNote, octaveKey, shiftOctave } from '../../input/keyboardLayout';
import type { ViewerAction } from '../../viewers/viewerState';

/**
 * The computer keyboard as a piano (`A W S E D F T G…`), `Z` and `X` for the octave. A key released after an octave
 * shift still releases its own Note; leaving the window releases them all.
 */
export function useComputerKeyboard(session: AudioSession, octaveRef: MutableRefObject<number>, setOctave: Dispatch<SetStateAction<number>>) {
  useEffect(() => {
    const { input } = session;
    const isTyping = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey;
    // The Note each key started, so a key released after an octave shift still releases its own Note.
    const keyNotes = new Map<string, number>();

    const down = (e: KeyboardEvent) => {
      if (e.repeat || isTyping(e)) return;
      const shift = octaveKey(e.code);
      if (shift) return setOctave((o) => shiftOctave(o, shift));
      const note = keyToNote(e.code, octaveRef.current);
      if (note === undefined) return;
      keyNotes.set(e.code, note);
      input.press(note, 1);
    };
    const up = (e: KeyboardEvent) => {
      const note = keyNotes.get(e.code);
      if (note === undefined) return;
      keyNotes.delete(e.code);
      input.release(note);
    };
    const releaseAll = () => {
      for (const note of keyNotes.values()) input.release(note);
      keyNotes.clear();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', releaseAll);
    };
  }, [session, octaveRef, setOctave]);
}

/** Space Freezes the Viewers. It never plays a Note, and must not also press a focused button or scroll. */
export function useSpaceFreezes(dispatchViewer: Dispatch<ViewerAction>) {
  useEffect(() => {
    const isSpace = (e: KeyboardEvent) => e.code === 'Space' && !(e.target instanceof HTMLInputElement);
    const down = (e: KeyboardEvent) => {
      if (!isSpace(e)) return;
      e.preventDefault();
      if (!e.repeat) dispatchViewer({ type: 'toggleFreeze' });
    };
    const up = (e: KeyboardEvent) => {
      if (isSpace(e)) e.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [dispatchViewer]);
}
