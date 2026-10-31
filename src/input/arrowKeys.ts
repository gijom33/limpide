/**
 * The keys that move the focus along a group (the WAI-ARIA keys): the arrows a step forward or back, Home and End to
 * the first and last. The radio groups and the Demo card's parts move by them, and the Demo's stop rule lets them by.
 */
export const ARROW_STEPS: Readonly<Record<string, number | 'first' | 'last'>> = {
  ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last',
};
