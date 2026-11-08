import { createContext, useCallback, useContext, useId } from 'react';
import type { PickupWay } from '../midi/controlSurface';
import { targetKey } from '../midi/describe';
import type { Target } from '../midi/mappings';
import { addDescription, removeDescription } from './inactive';

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

/**
 * Pickup waiting for the Controller's knob to catch a control's value (issue 255), said first in the control's
 * description, the way to turn it: a knob's slider and the tempo alike (issue 268). It is drawn inside the control,
 * which `controlOf` finds from it: a function made outside any render, so the description is not added again each one.
 */
export function PickupNote({ way, controlOf }: { way: PickupWay; controlOf: (note: HTMLElement) => Element | null | undefined }) {
  const id = useId();
  const describe = useCallback(
    (note: HTMLElement | null) => {
      const control = note && controlOf(note);
      if (!control) return;
      addDescription(control, id, 'first');
      return () => removeDescription(control, id);
    },
    [id, controlOf],
  );
  return (
    <span id={id} ref={describe} hidden>
      {`Pickup: turn your Controller’s knob ${way} to this value to take it over.`}
    </span>
  );
}
