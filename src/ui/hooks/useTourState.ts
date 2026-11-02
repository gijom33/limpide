import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { LEAD_IN } from '../../demo/player';
import { type ParamId, type Patch, setParam } from '../../patch/patch';
import type { KeptPatch, PatchStore } from '../../patch/patchStore';
import { TOUR, TOUR_PATCH, type TourMove, type TourSection, tourAt } from '../../tutorial/tour';
import type { ViewerStore } from '../../viewers/viewerStore';

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

/**
 * The synth's hand on Freeze for one card (issue 130): it freezes and unfreezes as the card says until the person
 * freezes or unfreezes themselves, or had Freeze on as the card came up; from then on Freeze is theirs. `follow` says
 * whether the synth still has it; `release` lets go of the synth's own Freeze, never of theirs.
 */
function freezeHand(viewers: Host['viewers']) {
  const isFrozen = () => viewers.get().viewer.frozen;
  let mine = false;
  let theirs = isFrozen();
  // Freeze as the synth last left it: any other change is the person's.
  let expected = isFrozen();
  const unwatch = viewers.subscribe(() => {
    if (isFrozen() === expected) return;
    expected = isFrozen();
    theirs = true;
    mine = false;
  });
  const set = (on: boolean) => {
    if (isFrozen() === on) return;
    expected = on;
    mine = on;
    viewers.dispatch({ type: 'toggleFreeze' });
  };
  return {
    follow(on: boolean) {
      if (!theirs) set(on);
      return !theirs;
    },
    release() {
      unwatch();
      if (mine) set(false);
    },
  };
}

interface Host {
  /** Where the Tour plays: its own Patch loaded in, the person's given back. */
  patches: PatchStore;
  /** Where Freeze is (issue 130): the Tour freezes the Viewers on a card that says when. */
  viewers: Pick<ViewerStore, 'get' | 'dispatch' | 'subscribe'>;
  /** The Tour starts: whatever plays by itself stops, a Tutorial ends. */
  onStart(): void;
  /** A card comes up: its phrase plays, over and over. */
  onCard(card: TourSection): void;
  /** The Tour ends: its phrase stops. */
  onEnd(): void;
}

/**
 * The Tour (issue 128): the person's Patch kept aside, the Tour's own loaded, then a card for each Section, the synth
 * turning its controls (`tourAt`) while its phrase plays. A control turned by hand or by a Controller is the person's
 * for the rest of that card: the synth leaves it where they put it. So is Freeze, frozen or unfrozen by the person on
 * a card where the synth freezes the Viewers (issue 130): the synth freezes no more on that card, and lets go of its
 * own Freeze whenever the card changes or the Tour ends. Ending or closing it, or the page closing, gives the person's
 * Patch back; a Patch the person loads meanwhile ends it and stays.
 */
export function useTourState({ patches, viewers, onStart, onCard, onEnd }: Host) {
  const [index, setIndex] = useState<number | null>(null);
  // The control the synth is turning now, for the card to ring.
  const [moving, setMoving] = useState<TourMove['id'] | null>(null);
  // Whether the synth still freezes the Viewers on this card, and what the card names while it has them frozen.
  const [freezing, setFreezing] = useState(false);
  const [naming, setNaming] = useState<string[] | null>(null);
  const kept = useRef<KeptPatch | null>(null);

  /** Ends the Tour, giving back the person's Patch unless `restore` is false (they loaded another). */
  const finish = (restore = true) => {
    const mine = kept.current;
    if (!mine) return;
    // Let go first: the Patch given back is heard as a load, which would end the Tour again.
    kept.current = null;
    onEnd();
    if (restore) patches.restore(mine);
    setIndex(null);
    setMoving(null);
    setFreezing(false);
    setNaming(null);
  };
  const finishNow = useEffectEvent(finish);
  const showCard = useEffectEvent((card: TourSection) => onCard(card));

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
    showCard(card);
    const taken = new Set<keyof Patch>();
    const unsubscribe = patches.subscribe(({ before, after, by }) => {
      if (by === 'load') finishNow(false);
      else if (by === 'hand' || by === 'controller') for (const m of card.moves) if (before[m.id] !== after[m.id]) taken.add(m.id);
    });
    const hand = freezeHand(viewers);
    const began = performance.now();
    const turn = () => {
      // Ended by a load between this card's last render and its cleanup: the Patch loaded is the person's.
      if (!kept.current) return;
      // Counted from the phrase's first beat, so a stage set before a Note, and a freeze once it has faded, fall there.
      const { values, moving, naming } = tourAt(card, Math.max(0, (performance.now() - began) / 1000 - LEAD_IN));
      setMoving(moving);
      const holding = hand.follow(naming !== null);
      setFreezing(holding && card.freezes !== undefined);
      setNaming(holding ? naming : null);
      const patch = patches.get().patch;
      const due = Object.fromEntries(Object.entries(values).filter(([id, value]) => !taken.has(id as keyof Patch) && patch[id as keyof Patch] !== value));
      if (Object.keys(due).length) patches.change((p) => withValues(p, due), 'tour');
    };
    turn();
    const timer = setInterval(turn, TICK_MS);
    // A page closed or reloaded mid-Tour keeps the person's Patch as its Last session, not the Tour's.
    const onHide = () => finishNow();
    addEventListener('pagehide', onHide);
    return () => {
      clearInterval(timer);
      unsubscribe();
      hand.release();
      setFreezing(false);
      setNaming(null);
      removeEventListener('pagehide', onHide);
    };
  }, [index, patches, viewers]);

  // Nothing turns on after the page goes.
  useEffect(() => () => finishNow(), []);

  return { index, moving, freezing, naming, start, end: () => finish(), move };
}
