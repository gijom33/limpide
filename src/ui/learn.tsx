import { createContext, useContext } from 'react';
import type { PickupWay } from '../midi/controlSurface';
import { targetKey } from '../midi/describe';
import type { Target } from '../midi/mappings';

/**
 * What MIDI Learn needs every learnable control to show: which targets are mapped, which is selected, and which wait
 * for their Controller's knob to catch them (Pickup, issue 255), with the way to turn it.
 */
export const LearnContext = createContext<{
  mapped: ReadonlySet<string>;
  selected: string | null;
  pickups: ReadonlyMap<string, PickupWay>;
}>({ mapped: new Set(), selected: null, pickups: new Map() });

/**
 * The attributes that make an element learnable: in MIDI Learn, clicking it selects it (instead of acting),
 * and it shows whether it is mapped or selected, and whether Pickup waits for its knob ('up' or 'down', the way to turn it).
 */
export function useLearnable(target: Target | undefined) {
  const { mapped, selected, pickups } = useContext(LearnContext);
  if (!target) return {};
  const key = targetKey(target);
  return {
    'data-learn': key,
    'data-mapped': mapped.has(key) || undefined,
    'data-learn-selected': selected === key || undefined,
    'data-pickup': pickups.get(key),
  };
}
