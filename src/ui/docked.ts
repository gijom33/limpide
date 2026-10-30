import { type RefObject, useEffect } from 'react';

/**
 * A card docked at the bottom of the page (a Tutorial's, the Demo's). Its height is `--docked-h`, so a control
 * brought into view lands above it. With `room: 'always'` the page keeps room for it below its last section; with
 * `'when-scrolling'` only where the page scrolls anyway (a phone), so a page that fits its window (a laptop) gets no
 * scroll bar just for the card, which then sits over the page's bottom edge. A control the keyboard reaches under
 * the card is scrolled clear above it, where the page can scroll (issue 104, WCAG 2.4.11): the browser only scrolls
 * to what is off screen, and the card is on screen, over it.
 */
export function useDocked(card: RefObject<HTMLElement | null>, room: 'always' | 'when-scrolling' = 'always') {
  useEffect(() => {
    const root = document.documentElement;
    const main = document.querySelector('main')!;
    const update = () => {
      root.style.setProperty('--docked-h', `${card.current!.offsetHeight}px`);
      // The page's own height, without the room (a margin, which offsetHeight leaves out).
      root.toggleAttribute('data-docked', room === 'always' || main.offsetTop + main.offsetHeight > innerHeight);
    };
    const observer = new ResizeObserver(update);
    observer.observe(card.current!);
    observer.observe(main);
    addEventListener('resize', update);
    update();
    // After the browser's own scroll to the focus, if any.
    let frame = 0;
    const onFocus = (e: FocusEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => clearOfCard(card.current, e.target));
    };
    document.addEventListener('focusin', onFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('focusin', onFocus);
      observer.disconnect();
      removeEventListener('resize', update);
      root.removeAttribute('data-docked');
      root.style.removeProperty('--docked-h');
    };
  }, [card, room]);
}

/** The room left between a control brought out from under the card and the card's top: its focus ring and a little. */
const CLEARANCE = 12;

/**
 * Scrolls the page so the focused control sits above the card, if the card is over it (not under a panel above both).
 * Only for the keyboard's focus: a knob pressed by its edge above the card must not move under the pointer.
 */
function clearOfCard(card: HTMLElement | null, focused: EventTarget | null) {
  if (!card || !(focused instanceof Element) || card.contains(focused) || !focused.matches(':focus-visible')) return;
  const control = focused.getBoundingClientRect();
  const over = card.getBoundingClientRect();
  const [left, right] = [Math.max(control.left, over.left), Math.min(control.right, over.right)];
  const [top, bottom] = [Math.max(control.top, over.top), Math.min(control.bottom, over.bottom)];
  if (left >= right || top >= bottom) return;
  if (!card.contains(document.elementFromPoint((left + right) / 2, (top + bottom) / 2))) return;
  scrollBy({ top: control.bottom + CLEARANCE - over.top, behavior: 'instant' });
}
