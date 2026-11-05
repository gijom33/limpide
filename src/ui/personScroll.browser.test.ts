import { afterEach, describe, expect, it } from 'vitest';
import { watchPersonScroll } from './personScroll';

// Issue 227: the Tour's and the Demo's one check of who moved the page. What takes a finger for itself (the piano, Bead,
// a card's handle: `touch-action: none`) is not the person scrolling; the wheel, a finger elsewhere, Page Down and the
// scroll bar are.

let unwatch = () => {};
afterEach(() => {
  unwatch();
  document.body.replaceChildren();
});

/** How many times the person scrolled, as the check says, while `act` runs. */
function scrolls(act: () => void) {
  let count = 0;
  unwatch = watchPersonScroll(() => count++);
  act();
  unwatch();
  return count;
}

/** An element of the page; with `takesTouches`, one that takes a finger for itself, a key of it inside. */
function part(takesTouches: boolean) {
  const outer = document.body.appendChild(document.createElement('div'));
  if (takesTouches) outer.style.touchAction = 'none';
  return outer.appendChild(document.createElement('span'));
}

const slide = (target: Element) => {
  target.dispatchEvent(new Event('touchstart', { bubbles: true }));
  target.dispatchEvent(new Event('touchmove', { bubbles: true }));
};

describe('who moved the page (issue 227)', () => {
  it('a finger slid across what takes touches itself is not the person scrolling, even on a part of it', () => {
    expect(scrolls(() => slide(part(true)))).toBe(0);
  });

  it('a finger slid elsewhere is', () => {
    expect(scrolls(() => slide(part(false)))).toBeGreaterThan(0);
  });

  it('Page Down, the wheel and the scroll bar are; a wheel a control took is not', () => {
    expect(scrolls(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true })))).toBe(1);
    expect(scrolls(() => document.body.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true })))).toBe(1);
    expect(scrolls(() => document.documentElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))).toBe(1);
    const knob = part(true);
    knob.addEventListener('wheel', (e) => e.preventDefault());
    expect(scrolls(() => knob.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true })))).toBe(0);
  });
});
