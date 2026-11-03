import { useEffect, useRef } from 'react';
import { focusLeaves } from '../focusBack';

/**
 * How a header panel closes (Display, MIDI, the Tutorials, a narrow screen's Tempo): Escape, wherever the focus is in
 * it, back to its button, never to the page (issues 51 and 189); a press elsewhere, the focus left where the press
 * went; and the focus moving out of it by Tab, so it never stays open over the controls it covers (issue 189). The
 * wrapper holds the button and the panel.
 */
export function useHeaderPanel(open: boolean, setOpen: (open: boolean) => void) {
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = wrapper.current;
    if (!open || !element) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => !element.contains(e.target as Node) && setOpen(false);
    const onFocusOut = (e: FocusEvent) => focusLeaves(element, e) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    element.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      element.removeEventListener('focusout', onFocusOut);
    };
  }, [open, setOpen]);
  return { wrapper, button };
}
