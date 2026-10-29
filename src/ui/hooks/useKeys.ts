import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect } from 'react';
import type { AudioSession } from '../../app/session';
import { keyToNote, octaveKey, shiftOctave } from '../../input/keyboardLayout';
import type { ViewerAction } from '../../viewers/viewerState';

/**
 * The computer keyboard as a piano (`A W S E D F T G…`), `Z` and `X` for the octave. A key released after an octave
 * shift still releases its own Note; leaving the window releases them all.
 */
export function useComputerKeyboard(
  session: AudioSession,
  octaveRef: MutableRefObject<number>,
  setOctave: Dispatch<SetStateAction<number>>,
  /** Off: the letter keys are left alone (issue 51, WCAG 2.1.4: single-key shortcuts can be turned off). */
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
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
  }, [session, octaveRef, setOctave, enabled]);
}

/** What Space already presses or types into when it has the focus: a button, an option, a tab, a link, a field. */
const SPACE_USERS = 'button, a[href], input, select, textarea, [role="radio"], [role="tab"], [role="menuitemradio"], [role="checkbox"], [role="switch"], [contenteditable="true"]';

/** Whether this key is Space for Freeze, not for what has the focus. */
export const freezesOnSpace = (e: KeyboardEvent) => e.code === 'Space' && !(e.target instanceof Element && e.target.closest(SPACE_USERS));

/**
 * Space Freezes the Viewers, unless what has the focus uses Space itself (a button, an option: issue 51, WCAG 2.1.1);
 * on a knob, a Viewer or nothing in particular it Freezes. It never plays a Note, and must not scroll.
 */
export function useSpaceFreezes(dispatchViewer: (action: ViewerAction) => void) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!freezesOnSpace(e)) return;
      e.preventDefault();
      if (!e.repeat) dispatchViewer({ type: 'toggleFreeze' });
    };
    const up = (e: KeyboardEvent) => {
      if (freezesOnSpace(e)) e.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [dispatchViewer]);
}
