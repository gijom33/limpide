import { useEffect, useEffectEvent, useRef } from 'react';
import { focusLeaves } from '../focusBack';

/**
 * How a header panel closes (Display, MIDI, the Tutorials, a narrow screen's Tempo, the Patches): Escape, wherever the
 * focus is in it, back to its button, never to the page (issues 51 and 189); a press elsewhere, the focus left where
 * the press went; and the focus moving out of it by Tab, so it never stays open over the controls it covers (issue
 * 189). The wrapper holds the button and the panel. Each event reads the wrapper on the page at that moment: a narrow
 * screen's Tempo, still open, is drawn in a new wrapper after a turn to a wide layout and back (issue 188). `onEscape`,
 * if given, is asked first and returns true where it took the key (the Patches panel's search, cleared before the
 * panel closes).
 */
export function useHeaderPanel(open: boolean, setOpen: (open: boolean) => void, onEscape?: () => boolean) {
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const escapeFirst = useEffectEvent(() => onEscape?.() ?? false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || escapeFirst()) return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => !wrapper.current?.contains(e.target as Node) && setOpen(false);
    const onFocusOut = (e: FocusEvent) => {
      const element = wrapper.current;
      if (element?.contains(e.target as Node) && focusLeaves(element, e)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [open, setOpen]);
  return { wrapper, button };
}
