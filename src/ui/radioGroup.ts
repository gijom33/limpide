import type { KeyboardEvent } from 'react';

const STEPS: Record<string, number | 'first' | 'last'> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last' };

/**
 * Where an arrow key moves the focus along the group's `items` (the WAI-ARIA keys): to the next or previous one, past
 * the ends round them (`wrap`) or not, and Home and End to the first and last. The key's default is prevented. None
 * for any other key, or when the focus is not on one of them.
 */
export function arrowTarget(e: KeyboardEvent<HTMLElement>, items: string, { wrap }: { wrap: boolean }): HTMLElement | undefined {
  const step = STEPS[e.key];
  if (step === undefined || e.altKey || e.metaKey || e.ctrlKey) return;
  const all = [...e.currentTarget.querySelectorAll<HTMLElement>(items)];
  const at = all.indexOf(document.activeElement as HTMLElement);
  if (at < 0) return;
  const last = all.length - 1;
  const next = step === 'first' ? 0 : step === 'last' ? last : wrap ? (at + step + all.length) % all.length : Math.min(last, Math.max(0, at + step));
  e.preventDefault();
  return all[next];
}

/**
 * A radio group's keys (the WAI-ARIA radio group pattern, issue 51): the arrows move the choice to the next or
 * previous option, round the ends, and Home and End to the first and last. The option chosen takes the focus.
 * Goes on the group's element.
 */
export function radioGroupKeys(e: KeyboardEvent<HTMLElement>) {
  const next = arrowTarget(e, '[role="radio"]', { wrap: true });
  if (!next) return;
  e.stopPropagation();
  next.focus();
  next.click();
}

/** Only the chosen option is a Tab stop, so Tab moves past the group in one step; the first, if none is chosen. */
export const radioTabIndex = (checked: boolean, index: number, anyChecked: boolean) => (checked || (!anyChecked && index === 0) ? 0 : -1);
