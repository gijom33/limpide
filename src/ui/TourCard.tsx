import { type RefObject, useEffect, useRef, useState } from 'react';
import { type TourCard as Card, TOUR, type TourMove } from '../tutorial/tour';
import { FoldButton, useCardPlacement } from './cardPlacement';
import { bringClear, useDocked } from './docked';
import { CloseIcon } from './icons';
import { reveal } from './reveal';
import { useCardFocus } from './TutorialCard';

interface Props {
  index: number;
  /** The control the synth is turning now. */
  moving: TourMove['id'] | null;
  /** What the card names while the synth has the Viewers frozen, or null (issue 130). */
  naming: string | null;
  onBack(): void;
  onNext(): void;
  /** The last card's way on: the first Tutorial, Bass. */
  onBass(): void;
  onClose(): void;
}

/** A control on the page, by what it sets: a move's, or the one a card watches. */
const controlOf = ({ kind, id }: Pick<TourMove, 'kind' | 'id'>) => document.querySelector(`[data-learn="${kind}:${id}"]`);

/**
 * Brings the card's Section into view: its controls shown (on their tab), and its Viewers, its controls and the one it
 * watches between the header and the card, the Viewers first where not all fit, as each card speaks of them (issue
 * 128, decision 10).
 */
function useSectionInView(card: Card, docked: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const controls = card.moves.map(controlOf).filter((e) => e !== null);
    for (const control of controls) reveal(control);
    const viewers = card.viewers.map((name) => document.querySelector(`[aria-label="${name}"]`)).filter((e) => e !== null);
    for (const viewer of viewers) viewer.setAttribute('data-tutorial-viewer', '');
    const bring = () => {
      const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      const watched = card.watch ? controlOf({ kind: 'param', id: card.watch }) : null;
      if (docked.current) bringClear(docked.current, [...viewers, ...controls, ...(watched ? [watched] : [])], behavior);
    };
    // After the tab it was on has had a frame to show, and the card its new height; then again whenever the card or the
    // page changes size while it is shown (on GitHub's Linux the last card came out 22 px taller after the scroll).
    let shown = false;
    const resized = new ResizeObserver(() => shown && bring());
    if (docked.current) resized.observe(docked.current, { box: 'border-box' });
    resized.observe(document.querySelector('main')!);
    const scroll = setTimeout(() => {
      shown = true;
      bring();
    }, 50);
    return () => {
      clearTimeout(scroll);
      resized.disconnect();
      for (const viewer of viewers) viewer.removeAttribute('data-tutorial-viewer');
    };
  }, [card, docked]);
}

/** Rings the control the synth is turning, as a Tutorial rings the one to turn, and marks its section in the phone's strip. */
function useRing(card: Card, moving: TourMove['id'] | null) {
  useEffect(() => {
    const move = card.moves.find((m) => m.id === moving);
    if (!move) return;
    let marked: Element[] = [];
    const clear = () => {
      for (const e of marked) e.removeAttribute('data-tutorial');
      marked = [];
    };
    const mark = () => {
      clear();
      const element = controlOf(move);
      const section = element?.closest('section[aria-label]')?.getAttribute('aria-label');
      const strip = section && document.querySelector(`.section-strip [data-section="${section}"]`);
      marked = [element, strip].filter((e) => e instanceof Element);
      for (const e of marked) e.setAttribute('data-tutorial', '');
    };
    mark();
    // A tab switched by the person: the ring follows its control.
    let again: ReturnType<typeof setTimeout> | undefined;
    const follow = () => {
      clearTimeout(again);
      again = setTimeout(mark, 0);
    };
    document.addEventListener('click', follow);
    return () => {
      clearTimeout(again);
      document.removeEventListener('click', follow);
      clear();
    };
  }, [card, moving]);
}

/**
 * On a card where the synth freezes the Viewers (issue 130), a line under its words, shown however the card is folded on
 * a phone: what the picture shows while it is frozen, the stage changed or all four; a word on what is coming while it
 * runs. Every line it can say takes the same place, so the card keeps one height, and a screen reader hears the names.
 */
function FrozenLine({ freezes, naming }: { freezes: NonNullable<Card['freezes']>; naming: string | null }) {
  const lines = [null, ...freezes.map((f) => f.names)];
  return (
    <p className="tour-frozen" aria-live="polite">
      {lines.map((names, i) => (
        <span key={names ?? ''} data-shown={names === naming || undefined} aria-hidden={names === null || names !== naming || undefined}>
          {names === null ? (
            'The picture freezes once each Note has faded.'
          ) : (
            <>
              <strong>{i === lines.length - 1 ? 'Frozen, left to right:' : 'Frozen:'}</strong> {names}
            </>
          )}
        </span>
      ))}
    </p>
  );
}

/**
 * The Tour's card (issue 128), docked where a Tutorial's card docks: one Section of the page in the signal's order,
 * where the signal comes from and goes, what the Section does and what its Viewers show, while the synth turns its
 * controls. Back and Next move between the cards; the last offers the Bass Tutorial. It takes the focus on its Next when
 * the Tour starts; turning the controls never takes it.
 */
export function TourCard({ index, moving, naming, onBack, onNext, onBass, onClose }: Props) {
  const tour = TOUR[index];
  const last = index === TOUR.length - 1;
  const card = useRef<HTMLElement>(null);
  // On a phone the card shows two lines; a tap on them, or on +, shows the rest, as a Tutorial's does.
  const [expanded, setExpanded] = useState(false);
  useDocked(card);
  useSectionInView(tour, card);
  useRing(tour, moving);
  const place = useCardPlacement(card, 'tour', null);
  const focus = useCardFocus(card, null);

  const primary = last ? (
    <button type="button" className="tool tool-primary" onClick={onBass}>
      Build a Bass
    </button>
  ) : (
    <button type="button" className="tool tool-primary" onClick={onNext}>
      Next
    </button>
  );
  return (
    <section ref={card} className="docked tutorial tour" aria-label="Tour" data-expanded={expanded || undefined} {...place.cardProps} {...focus}>
      <div className="tutorial-top" {...place.handle}>
        <span className="tutorial-name">{tour.title}</span>
        <span className="tutorial-progress">
          {index + 1} of {TOUR.length}
        </span>
        <button type="button" className="tool tool-icon tutorial-more" aria-expanded={expanded} aria-label="Show the whole text" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '−' : '+'}
        </button>
        {place.folded && primary}
        <FoldButton folded={place.folded} onToggle={place.toggleFold} />
        <button type="button" className="tool tool-icon" aria-label="Close the Tour" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a tap on the text is the touch shortcut; the + button is the keyboard's and the screen reader's */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: as above, + is the keyboard route */}
      <div className="tutorial-words" aria-live="polite" onClick={() => setExpanded((e) => !e)}>
        <p>{tour.chain}</p>
        <p>{tour.does}</p>
        <p className="tutorial-then">{tour.sees}</p>
        {last && <p className="tutorial-then">That is the whole chain. Now build a sound yourself: the Bass Tutorial goes through it one control at a time.</p>}
      </div>
      {tour.freezes && <FrozenLine freezes={tour.freezes} naming={naming} />}
      <div className="tutorial-actions">
        <span className="tutorial-spacer" />
        {index > 0 && (
          <button type="button" className="tool" onClick={onBack}>
            Back
          </button>
        )}
        {!place.folded && primary}
        {last && (
          <button type="button" className="tool" onClick={onClose}>
            Done
          </button>
        )}
      </div>
    </section>
  );
}
