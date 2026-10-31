import { useEffect, useRef, useState } from 'react';
import { type ParamId, type Patch, setParam } from '../../patch/patch';
import type { KeptPatch, PatchStore } from '../../patch/patchStore';
import { TOUR, TOUR_PATCH, type TourCard, type TourMove, tourAt } from '../../tutorial/tour';

/** How often the synth's hand moves the card's control: as often as the Demo's knobs. */
const TICK_MS = 40;

/** Every control a card turns: each card starts with them on the Tour's Patch's values. */
const TURNED = [...new Set(TOUR.flatMap((card) => card.moves.map((m) => m.id)))];

/** The Patch with these values of the Tour's controls, a knob's kept in its range. */
function withValues(patch: Patch, values: Partial<Patch>): Patch {
  let next = { ...patch, ...values };
  for (const [id, value] of Object.entries(values)) if (typeof value === 'number') next = setParam(next, id as ParamId, value);
  return next;
}

interface Host {
  /** Where the Tour plays: its own Patch loaded in, the person's given back. */
  patches: PatchStore;
  /** The Tour starts: whatever plays by itself stops, a Tutorial ends. */
  onStart(): void;
  /** A card comes up: its phrase plays, over and over. */
  onCard(card: TourCard): void;
  /** The Tour ends: its phrase stops. */
  onEnd(): void;
}

/**
 * The Tour (issue 128): the person's Patch kept aside, the Tour's own loaded, then a card for each Section, the synth
 * turning its controls (`tourAt`) while its phrase plays. A control turned by hand or by a Controller is the person's
 * for the rest of that card: the synth leaves it where they put it. Ending or closing it, or the page closing, gives
 * the person's Patch back; a Patch the person loads meanwhile ends it and stays.
 */
export function useTourState({ patches, onStart, onCard, onEnd }: Host) {
  const [index, setIndex] = useState<number | null>(null);
  // The control the synth is turning now, for the card to ring.
  const [moving, setMoving] = useState<TourMove['id'] | null>(null);
  const kept = useRef<KeptPatch | null>(null);
  const host = useRef({ onCard, onEnd });
  host.current = { onCard, onEnd };

  /** Ends the Tour, giving back the person's Patch unless `restore` is false (they loaded another). */
  const finish = (restore = true) => {
    const mine = kept.current;
    if (!mine) return;
    // Let go first: the Patch given back is heard as a load, which would end the Tour again.
    kept.current = null;
    host.current.onEnd();
    if (restore) patches.restore(mine);
    setIndex(null);
    setMoving(null);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  /** Starts the Tour; started again while it runs, back to its first card. */
  const start = () => {
    if (kept.current) return setIndex(0);
    onStart();
    kept.current = patches.keep();
    patches.load(TOUR_PATCH.name, TOUR_PATCH.patch);
    setIndex(0);
  };
  const move = (delta: number) => setIndex((i) => (i === null ? i : Math.min(TOUR.length - 1, Math.max(0, i + delta))));

  useEffect(() => {
    if (index === null) return;
    const card = TOUR[index];
    patches.change((p) => withValues(p, Object.fromEntries(TURNED.map((id) => [id, TOUR_PATCH.patch[id]]))), 'tour');
    host.current.onCard(card);
    const taken = new Set<keyof Patch>();
    const unsubscribe = patches.subscribe(({ before, after, by }) => {
      if (by === 'load') finishRef.current(false);
      else if (by === 'hand' || by === 'controller') for (const m of card.moves) if (before[m.id] !== after[m.id]) taken.add(m.id);
    });
    const began = performance.now();
    const turn = () => {
      const { values, moving } = tourAt(card, (performance.now() - began) / 1000);
      setMoving(moving);
      const patch = patches.get().patch;
      const mine = Object.fromEntries(Object.entries(values).filter(([id, value]) => !taken.has(id as keyof Patch) && patch[id as keyof Patch] !== value));
      if (Object.keys(mine).length) patches.change((p) => withValues(p, mine), 'tour');
    };
    turn();
    const timer = setInterval(turn, TICK_MS);
    // A page closed or reloaded mid-Tour keeps the person's Patch as its Last session, not the Tour's.
    const onHide = () => finishRef.current();
    addEventListener('pagehide', onHide);
    return () => {
      clearInterval(timer);
      unsubscribe();
      removeEventListener('pagehide', onHide);
    };
  }, [index, patches]);

  // Nothing turns on after the page goes.
  useEffect(() => () => finishRef.current(), []);

  return { index, card: index === null ? null : TOUR[index], moving, start, end: () => finish(), move };
}
