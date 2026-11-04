import { type RefObject, useEffect } from 'react';
import { headerBottomAt } from './SectionStrip';
import { STACKED } from './sections';

/**
 * A card docked at the bottom of the page (a Tutorial's, the Tour's, the Demo's). Its height is `--docked-h`, so a
 * control brought into view lands above it. With `room: 'always'` the page keeps room for it below its last section,
 * so the page scrolls what the card points at clear of it; with `'when-stacked'` (the Demo's, which points at
 * nothing) only on a phone and in 2 × 2, and there only where the page is taller than its window (a tall tablet in
 * 2 × 2 may fit it), so a page that fits gets no scroll bar just for the card: in three and four across, meant to
 * show everything (issue 212, decided by the owner), the card sits over the page's bottom edge and the page scrolls
 * only as it would without it. A control the keyboard reaches under the card is scrolled clear above it, where the
 * page can scroll (issue 104, WCAG 2.4.11): the browser only scrolls to what is off screen, and the card is on screen,
 * over it; where it cannot, the card folds or moves off it.
 */
export function useDocked(card: RefObject<HTMLElement | null>, room: 'always' | 'when-stacked' = 'always') {
  useEffect(() => {
    const root = document.documentElement;
    const main = document.querySelector('main')!;
    const update = () => {
      root.style.setProperty('--docked-h', `${card.current!.offsetHeight}px`);
      // The page's own height, without the room (a margin, which offsetHeight leaves out).
      const tall = main.offsetTop + main.offsetHeight > innerHeight;
      root.toggleAttribute('data-docked', room === 'always' || (matchMedia(STACKED).matches && tall));
    };
    const observer = new ResizeObserver(update);
    observer.observe(card.current!, { box: 'border-box' }); // its offsetHeight, padding and border included
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
  bringClear(card, [focused], 'instant');
}

/**
 * Scrolls the page the least that shows the elements between the header and the card (issue 105: a Tutorial Step's
 * control and the Viewer it points at), none of them in the header, each with its scroll margins. Where they do not fit
 * together, the first ones do, the first alone at least.
 */
export function bringClear(card: HTMLElement, elements: readonly Element[], behavior: ScrollBehavior) {
  const floor = card.getBoundingClientRect().top - CLEARANCE;
  const end = document.documentElement.scrollHeight - innerHeight;
  const ceiling = (y: number) => headerBottomAt(y) + CLEARANCE;
  for (let n = elements.length; n > 0; n--) {
    // Each element's own scroll margins too: the room its ring and target take round it.
    const boxes = elements.slice(0, n).map((e) => {
      const box = e.getBoundingClientRect();
      const style = getComputedStyle(e);
      return { top: box.top - parseFloat(style.scrollMarginTop), bottom: box.bottom + parseFloat(style.scrollMarginBottom) };
    });
    const [top, bottom] = [Math.min(...boxes.map((b) => b.top)), Math.max(...boxes.map((b) => b.bottom))];
    // Lifted above the card, or lowered below the header as it will be on the way up (its rows come back).
    let y = scrollY;
    if (bottom > floor) y = Math.min(end, scrollY + bottom - floor);
    else if (top < ceiling(scrollY)) y = Math.max(0, scrollY + top - ceiling(scrollY - 1));
    const fits = top + scrollY - y >= ceiling(y) - 1 && bottom + scrollY - y <= floor + 1;
    if (fits || n === 1) {
      if (Math.abs(y - scrollY) >= 1) scrollTo({ top: y, behavior });
      return;
    }
  }
}
