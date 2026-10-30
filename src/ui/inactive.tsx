import { useCallback, useId } from 'react';

/** What a control's description is read from: its slider or its radio group, inside what is greyed out. */
const DESCRIBED = '[role="slider"], [role="radiogroup"]';

/**
 * Adds an element's id to a control's `aria-describedby`, first or last, beside the others there: a control's tooltip
 * and the reason it is greyed out share it, each added and taken away on its own.
 */
export function addDescription(control: Element, id: string, place: 'first' | 'last') {
  const ids = (control.getAttribute('aria-describedby') ?? '').split(' ').filter((i) => i && i !== id);
  control.setAttribute('aria-describedby', (place === 'first' ? [id, ...ids] : [...ids, id]).join(' '));
}

export function removeDescription(control: Element, id: string) {
  const ids = (control.getAttribute('aria-describedby') ?? '').split(' ').filter((i) => i && i !== id);
  if (ids.length) control.setAttribute('aria-describedby', ids.join(' '));
  else control.removeAttribute('aria-describedby');
}

/**
 * A control greyed out while it has no audible effect (issue 104, WCAG 1.3.1): it still turns, and a screen reader
 * hears why after its name and value, ahead of its tooltip. `why` is that sentence ("No effect while Osc 2 is silent"),
 * or false while the control acts. `props` go on the control's outer element, which the CSS dims, and `note` inside it.
 */
export function useInactive(why: string | false | undefined) {
  const id = useId();
  const ref = useCallback(
    (outer: HTMLElement | null) => {
      const control = why && outer ? (outer.matches(DESCRIBED) ? outer : outer.querySelector(DESCRIBED)) : null;
      if (!control) return;
      addDescription(control, id, 'first');
      return () => removeDescription(control, id);
    },
    [id, why],
  );
  return {
    props: { ref, 'data-inactive': why ? true : undefined },
    note: why ? (
      <span id={id} hidden>
        {`${why}.`}
      </span>
    ) : null,
  };
}
