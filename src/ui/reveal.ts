/**
 * Asks whatever hides an element (a tab panel) to show it: a Controller moved it, and its movement should be seen.
 * The event bubbles from the element, so any container that hides things can listen for it.
 */
export const REVEAL_EVENT = 'limpide:reveal';

export function reveal(element: Element) {
  if (!element.checkVisibility({ visibilityProperty: true })) element.dispatchEvent(new Event(REVEAL_EVENT, { bubbles: true }));
}
