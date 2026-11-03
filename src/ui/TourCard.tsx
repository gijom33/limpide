import { type RefObject, useEffect, useRef } from 'react';
import { type Looking, TOUR, TOUR_FINDS, TOUR_LENGTH, type TourFind, type TourMove, type TourSection } from '../tutorial/tour';
import { CardShell } from './CardShell';
import { bringClear } from './docked';
import type { Guide } from './mascotCling';
import { reveal } from './reveal';

interface Props {
  index: number;
  /** The control the synth is turning now. */
  moving: TourMove['id'] | null;
  /** What the page shows where that control and the card's Viewers do not fit together (issue 206). */
  looking: Looking;
  /** Whether the synth still freezes the Viewers on this card: not once the person has taken Freeze (issue 130). */
  freezing: boolean;
  /** What the card names while the synth has the Viewers frozen, left to right, or null. */
  naming: string[] | null;
  onBack(): void;
  onNext(): void;
  /** The last card's way on: the first Tutorial, Bass (issue 210: the Tutorials' card). */
  onBass(): void;
  onClose(): void;
}

/** A control on the page, by what it sets: a move's. */
const selectorOf = ({ kind, id }: Pick<TourMove, 'kind' | 'id'>) => `[data-learn="${kind}:${id}"]`;
const controlOf = (move: Pick<TourMove, 'kind' | 'id'>) => document.querySelector(selectorOf(move));

/** The Display button, which stands for an option in its panel while the panel is shut. */
const DISPLAY_BUTTON = 'button[aria-label="Display"]';

/** The control a card after the Sections shows (issue 210): an option in Display's panel, or a button in the header. */
const findSelectorOf = ({ shows }: TourFind) => (shows.kind === 'display' ? `[data-overlay="${shows.overlay}"]` : `header button[aria-label="${shows.name}"]`);
/** That control as the page shows it now: its own, or the Display button standing for an option in its shut panel. */
function findControlOf(find: TourFind) {
  const element = document.querySelector(findSelectorOf(find));
  return find.shows.kind === 'display' && !element?.checkVisibility() ? document.querySelector(DISPLAY_BUTTON) : element;
}

/**
 * What Bead points the way to on a Tour card (issue 151, decision 2): one control a card, a Section's first move's;
 * after the Sections, the control the card shows, the Display button standing for an option in its shut panel (issue 210).
 */
export function tourGuide(index: number): Guide {
  const find = TOUR_FINDS[index - TOUR.length];
  const [selector, standIn] = find ? [findSelectorOf(find), find.shows.kind === 'display' ? DISPLAY_BUTTON : null] : [selectorOf(TOUR[index].moves[0]), null];
  return { selector, standIn, step: `tour ${index}`, made: false, finished: false };
}

/** The keys that scroll the page, unless a control takes them. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);
/** What takes a key, a wheel or a finger for itself, so the page does not scroll: a control, a field. */
const CONTROLS = 'input, textarea, select, [contenteditable], [data-learn], [role="slider"], [role="radiogroup"], [role="radio"], [role="listbox"], [role="menu"]';
const onControl = (e: Event) => e.target instanceof Element && !!e.target.closest(CONTROLS);

/**
 * Calls `onScroll` when the person scrolls the page themselves (the wheel, a finger, the keys, the scroll bar), never
 * for the page's own scrolling, which fires the same scroll events, nor for a control turned by its wheel, a finger
 * or a key (issue 206, decision 5).
 */
function watchPersonScroll(onScroll: () => void) {
  // A knob's wheel is turned in its own listener, which keeps the page from scrolling: it has run by now.
  const onWheel = (e: WheelEvent) => e.defaultPrevented || onScroll();
  let touchedControl = false;
  const onTouchStart = (e: TouchEvent) => {
    touchedControl = onControl(e);
  };
  const onTouchMove = () => touchedControl || onScroll();
  const onKey = (e: KeyboardEvent) => SCROLL_KEYS.has(e.key) && !e.defaultPrevented && !onControl(e) && onScroll();
  // Pressed on the page's scroll bar: on the root itself, which no content covers.
  const onPointer = (e: PointerEvent) => e.target === document.documentElement && onScroll();
  addEventListener('wheel', onWheel, { passive: true });
  addEventListener('touchstart', onTouchStart, { passive: true });
  addEventListener('touchmove', onTouchMove, { passive: true });
  addEventListener('keydown', onKey);
  addEventListener('pointerdown', onPointer);
  return () => {
    removeEventListener('wheel', onWheel);
    removeEventListener('touchstart', onTouchStart);
    removeEventListener('touchmove', onTouchMove);
    removeEventListener('keydown', onKey);
    removeEventListener('pointerdown', onPointer);
  };
}

/**
 * Brings the card's Section into view: its controls shown (on their tab), and its Viewers and its controls between the
 * header and the card, together where they fit (issue 128, decision 10). Where the control moving and the Viewers do
 * not fit together, the page shows each in turn, as the card's clock says (`looking`, issue 206): the control as it
 * starts to move, with as many Viewers as fit beside it, then the Viewers, with the control if it fits; so where all
 * fit the page holds still. It glides, or jumps with reduced motion. The person's own scroll stops it for the rest of
 * the card (decision 5). The LFO card points at the Timeline (issue 158, decided by the owner): its Depth knob shows
 * with it, or in turn.
 */
function useSectionInView(card: TourSection | undefined, docked: RefObject<HTMLElement | null>, moving: TourMove['id'] | null, looking: Looking) {
  // What the card's clock says now, read by each scroll; and the scroll, set up for the card shown.
  const now = useRef({ moving, looking });
  now.current = { moving, looking };
  const bring = useRef(() => {});
  useEffect(() => {
    if (!card) return;
    const controls = card.moves.map((move) => ({ id: move.id, element: controlOf(move) }));
    for (const { element } of controls) if (element) reveal(element);
    const viewers = card.viewers.map((name) => document.querySelector(`[aria-label="${name}"]`)).filter((e) => e !== null);
    for (const viewer of viewers) viewer.setAttribute('data-tutorial-viewer', '');
    // The person scrolled: the page is theirs for the rest of this card.
    let theirs = false;
    let shown = false;
    const unwatch = watchPersonScroll(() => {
      theirs = true;
    });
    bring.current = () => {
      if (!shown || theirs || !docked.current) return;
      const { moving, looking } = now.current;
      const elementsOf = (wanted: (id: TourMove['id']) => boolean) => controls.filter((c) => wanted(c.id) && c.element).map((c) => c.element!);
      const [mover, others] = [elementsOf((id) => id === moving), elementsOf((id) => id !== moving)];
      const elements = looking === 'control' ? [...mover, ...viewers, ...others] : [...viewers, ...mover, ...others];
      const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      bringClear(docked.current, elements, behavior);
    };
    // After the tab it was on has had a frame to show, and the card its new height; then again whenever the card or the
    // page changes size while it is shown (on GitHub's Linux the last card came out 22 px taller after the scroll).
    const resized = new ResizeObserver(() => bring.current());
    if (docked.current) resized.observe(docked.current, { box: 'border-box' });
    resized.observe(document.querySelector('main')!);
    const scroll = setTimeout(() => {
      shown = true;
      bring.current();
    }, 50);
    return () => {
      clearTimeout(scroll);
      resized.disconnect();
      unwatch();
      bring.current = () => {};
      for (const viewer of viewers) viewer.removeAttribute('data-tutorial-viewer');
    };
  }, [card, docked]);
  // The card's clock turns from the control to the Viewers and back, or on to the next control.
  // biome-ignore lint/correctness/useExhaustiveDependencies: they are the trigger; the scroll reads them from now
  useEffect(() => bring.current(), [moving, looking]);
}

/** Rings the control the synth is turning, as a Tutorial rings the one to turn, and marks its section in the phone's strip. */
function useRing(card: TourSection | undefined, moving: TourMove['id'] | null) {
  useEffect(() => {
    const move = card?.moves.find((m) => m.id === moving);
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
 * On a card after the Sections (issue 210), rings the control it names and brings it into view, the header's rows back
 * for it: the Display button for an option in its shut panel, the option itself once the person opens it (the ring
 * follows a click or a key, as a Tutorial's does). Nothing is pressed or switched on for the person.
 */
function useFindShown(find: TourFind | undefined) {
  useEffect(() => {
    if (!find) return;
    let marked: Element | null = null;
    const mark = () => {
      marked?.removeAttribute('data-tutorial');
      marked = findControlOf(find);
      marked?.setAttribute('data-tutorial', '');
    };
    mark();
    // After the card has had a frame to take its new height.
    const scroll = setTimeout(() => {
      const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      marked?.scrollIntoView({ block: 'nearest', behavior });
    }, 50);
    // Display's panel opened or shut by the person: the ring follows its option.
    let again: ReturnType<typeof setTimeout> | undefined;
    const follow = () => {
      clearTimeout(again);
      again = setTimeout(mark, 0);
    };
    document.addEventListener('click', follow);
    document.addEventListener('keyup', follow);
    return () => {
      clearTimeout(scroll);
      clearTimeout(again);
      document.removeEventListener('click', follow);
      document.removeEventListener('keyup', follow);
      marked?.removeAttribute('data-tutorial');
    };
  }, [find]);
}

/**
 * On a card where the synth freezes the Viewers (issue 130), a line under its words, shown however the card is folded on
 * a phone: what the frozen picture shows, the stage changed or all four; while it runs, a word on what is coming, until
 * the person takes Freeze. Every line it can say takes the same place, so the card keeps one height; a screen reader
 * hears the names alone.
 */
function FrozenLine({ freezes, freezing, naming }: { freezes: NonNullable<TourSection['freezes']>; freezing: boolean; naming: string[] | null }) {
  const shown = naming ? 1 + freezes.findIndex((f) => f.names === naming) : freezing ? 0 : -1;
  return (
    <div className="tour-frozen">
      <p aria-hidden="true">
        <span data-shown={shown === 0 || undefined}>The picture freezes once each Note has faded.</span>
        {freezes.map(({ names }, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the card's freezes never change while it is shown
          <span key={i} data-shown={shown === i + 1 || undefined}>
            <strong className="tour-frozen-badge">Frozen</strong> {names.join('; ')}
          </span>
        ))}
      </p>
      <span className="visually-hidden" aria-live="polite">
        {naming && `Frozen: ${naming.join('; ')}`}
      </span>
    </div>
  );
}

/**
 * The Tour's card (issue 128), docked where a Tutorial's card docks: one Section of the page in the signal's order,
 * where the signal comes from and goes, what the Section does and what its Viewers show, while the synth turns its
 * controls; after the Sections, what else there is to find, and where (issue 210). Back and Next move between the
 * cards; the last offers the Bass Tutorial. It takes the focus on its Next when the Tour starts; turning the controls
 * never takes it.
 */
export function TourCard({ index, moving, looking, freezing, naming, onBack, onNext, onBass, onClose }: Props) {
  const section: TourSection | undefined = TOUR[index];
  const find = TOUR_FINDS[index - TOUR.length];
  const last = index === TOUR_LENGTH - 1;
  const card = useRef<HTMLElement>(null);
  useSectionInView(section, card, moving, looking);
  useRing(section, moving);
  useFindShown(find);

  const primary = last ? (
    <button type="button" className="tool tool-primary" onClick={onBass}>
      Build a Bass
    </button>
  ) : (
    <button type="button" className="tool tool-primary" onClick={onNext}>
      Next
    </button>
  );
  const actions = {
    before: index > 0 && (
      <button type="button" className="tool" onClick={onBack}>
        Back
      </button>
    ),
    after: last && (
      <button type="button" className="tool" onClick={onClose}>
        Done
      </button>
    ),
  };
  return (
    <CardShell
      card={card}
      kind="tour"
      opening={null}
      label="Tour"
      name={section?.title ?? find.title}
      progress={`${index + 1} of ${TOUR_LENGTH}`}
      closeLabel="Close the Tour"
      onClose={onClose}
      primary={primary}
      under={section?.freezes && <FrozenLine freezes={section.freezes} freezing={freezing} naming={naming} />}
      actions={actions}
    >
      {/* What to watch first: folded on a phone, it is all the card shows (issue 129). */}
      {section ? (
        <>
          <p>{section.look}</p>
          <p>{section.chain}</p>
          <p>{section.does}</p>
          <p className="card-then">{section.sees}</p>
        </>
      ) : (
        <>
          <p>{find.look}</p>
          {find.says.map((line, i) => (
            <p key={line} className={i === find.says.length - 1 ? 'card-then' : undefined}>
              {line}
            </p>
          ))}
        </>
      )}
    </CardShell>
  );
}
