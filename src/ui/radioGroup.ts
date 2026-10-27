import type { KeyboardEvent } from 'react';

const STEPS: Record<string, number | 'first' | 'last'> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last' };

/**
 * A radio group's keys (the WAI-ARIA radio group pattern, issue 51): the arrows move the choice to the next or
 * previous option, round the ends, and Home and End to the first and last. The option chosen takes the focus.
 * Goes on the group's element.
 */
export function radioGroupKeys(e: KeyboardEvent<HTMLElement>) {
  const step = STEPS[e.key];
  if (step === undefined || e.altKey || e.metaKey || e.ctrlKey) return;
  const radios = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
  const at = radios.indexOf(document.activeElement as HTMLElement);
  if (at < 0) return;
  const next = step === 'first' ? 0 : step === 'last' ? radios.length - 1 : (at + step + radios.length) % radios.length;
  e.preventDefault();
  e.stopPropagation();
  radios[next].focus();
  radios[next].click();
}

/** Only the chosen option is a Tab stop, so Tab moves past the group in one step; the first, if none is chosen. */
export const radioTabIndex = (checked: boolean, index: number, anyChecked: boolean) => (checked || (!anyChecked && index === 0) ? 0 : -1);
