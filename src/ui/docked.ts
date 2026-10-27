import { type RefObject, useEffect } from 'react';

/**
 * A card docked at the bottom of the page (a Tutorial's, the Demo's). Its height is `--docked-h`, so a control
 * brought into view lands above it. With `room: 'always'` the page keeps room for it below its last section; with
 * `'when-scrolling'` only where the page scrolls anyway (a phone), so a page that fits its window (a laptop) gets no
 * scroll bar just for the card, which then sits over the page's bottom edge.
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
    return () => {
      observer.disconnect();
      removeEventListener('resize', update);
      root.removeAttribute('data-docked');
      root.style.removeProperty('--docked-h');
    };
  }, [card, room]);
}
