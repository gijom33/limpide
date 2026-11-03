import { type RefObject, useLayoutEffect, useRef } from 'react';

/** The focus fell to the page: no element has it. */
export const focusLost = () => !document.activeElement || document.activeElement === document.body;

/** Whether the focus is moving from inside the element to somewhere else on the page (not to the page itself). */
export const focusLeaves = (element: Element, e: FocusEvent) => e.relatedTarget instanceof Node && !element.contains(e.relatedTarget);

/**
 * A docked card that loses the button the focus was on, or goes altogether, gives the focus back (issue 189, decision
 * 1): to `back()`, never to the page. Only where the focus was in the card: a card ended by a press elsewhere (the Demo
 * button, a knob), or left by a click on the page, leaves it there. Returns the card's focus handlers, which keep the
 * element the focus is on in the card, so a button that went is told from a focus that left. Given back after a click
 * (no keyboard ring on the button), the page does not scroll to it.
 */
export function useFocusBack(card: RefObject<HTMLElement | null>, back: () => HTMLElement | null | undefined) {
  const backNow = useRef(back);
  backNow.current = back;
  const last = useRef<Element | null>(null);
  const byKeyboard = useRef(false);
  const giveBack = () => backNow.current()?.focus({ preventScroll: !byKeyboard.current });
  useLayoutEffect(() => {
    if (last.current && !last.current.isConnected && focusLost()) {
      last.current = null;
      giveBack();
    }
  });
  // On the way out the card is still on the page: the focus is in it, or fell from it.
  useLayoutEffect(
    () => () => {
      if (!card.current?.contains(document.activeElement) && !(last.current && focusLost())) return;
      requestAnimationFrame(() => focusLost() && backNow.current()?.focus({ preventScroll: !byKeyboard.current }));
    },
    [card],
  );
  return {
    onFocus: (e: { target: EventTarget }) => {
      last.current = e.target as Element;
      byKeyboard.current = last.current.matches(':focus-visible');
    },
    // Left for somewhere else, or for the page by a click (the element still there): not the card's to give back.
    onBlur: (e: { target: EventTarget; relatedTarget: EventTarget | null }) => {
      const to = e.relatedTarget;
      if (!(to instanceof Node && card.current?.contains(to)) && (e.target as Element).isConnected) last.current = null;
    },
  };
}
