import { createContext, useContext } from 'react';
import { targetKey } from '../midi/describe';
import type { Target } from '../midi/mappings';

/** What MIDI Learn needs every learnable control to show: which targets are mapped, and which is selected. */
export const LearnContext = createContext<{
  mapped: ReadonlySet<string>;
  selected: string | null;
}>({ mapped: new Set(), selected: null });

/**
 * The attributes that make an element learnable: in MIDI Learn, clicking it selects it (instead of acting),
 * and it shows whether it is mapped or selected.
 */
export function useLearnable(target: Target) {
  const { mapped, selected } = useContext(LearnContext);
  const key = targetKey(target);
  return {
    'data-learn': key,
    'data-mapped': mapped.has(key) || undefined,
    'data-learn-selected': selected === key || undefined,
  };
}
