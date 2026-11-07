import { type RefObject, useEffect, useRef } from 'react';
import { type Looking, TOUR_LENGTH, type TourFind, type TourMove, type TourSection, tourCardAt } from '../tutorial/tour';
import { TUTORIALS } from '../tutorial/tutorials';
import { CardShell } from './CardShell';
import { cardAside } from './cardAside';
import { DISPLAY_BUTTON, optionOrDisplay, overlaySelector } from './displayOption';
import { bringClear, fitsBeside } from './docked';
import { scrollBehavior } from './glide';
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
  /** Whether the person has scrolled the page during this card: it is then theirs, and the card brings nothing into view. */
  pageTheirs(): boolean;
  onBack(): void;
  onNext(): void;
  /** The last card's way on: the first Tutorial, Sub Ladder (issue 210: the Tutorials' card; issue 233). */
  onFirstTutorial(): void;
  onClose(): void;
}

/** A control on the page, by what it sets: a move's. */
const selectorOf = ({ kind, id }: Pick<TourMove, 'kind' | 'id'>) => `[data-learn="${kind}:${id}"]`;
const controlOf = (move: Pick<TourMove, 'kind' | 'id'>) => document.querySelector(selectorOf(move));

/**
 * The control a card after the Sections shows (issue 210), as the page finds it: an option in Display's panel, the
 * Display button standing for it while the panel is shut; or a button in the header.
 */
function findControl({ shows }: TourFind): { selector: string; standIn: string | null } {
  return shows.kind === 'display' ? { selector: overlaySelector(shows.overlay), standIn: DISPLAY_BUTTON } : { selector: `header button[aria-label="${shows.name}"]`, standIn: null };
}
/** That control as the page shows it now: its own, or the Display button standing for an option in its shut panel. */
function findControlOf(find: TourFind) {
  const { selector, standIn } = findControl(find);
  const element = document.querySelector(selector);
  return standIn ? optionOrDisplay(element) : element;
}

/**
 * What Bead points the way to on a Tour card (issue 151, decision 2): one control a card, a Section's first move's;
 * after the Sections, the control the card shows, the Display button standing for an option in its shut panel (issue 210).
 */
export function tourGuide(index: number): Guide {
  const card = tourCardAt(index);
  const shown = card.kind === 'find' ? findControl(card.find) : { selector: selectorOf(card.section.moves[0]), standIn: null };
  return { ...shown, step: `tour ${index}`, made: false, finished: false };
}

/** How far the Tour has moved its card along the bottom, to stand beside what it shows (issue 254). */
const ASIDE = '--card-aside';

/**
 * Moves the card along the bottom, the least, where it would cover what it shows (`elements`) and they do not all fit
 * above it, to a place beside them all from which they all show (issue 254); else puts it back in the middle. Never a
 * card the person has moved: it stays where they put it.
 */
function standAside(card: HTMLElement, elements: readonly Element[]) {
  if (card.hasAttribute('data-moved')) return;
  const moved = parseFloat(card.style.getPropertyValue(ASIDE)) || 0;
  const box = card.getBoundingClientRect();
  const home = { left: box.left - moved, right: box.right - moved, top: box.top };
  let aside = 0;
  if (!fitsBeside(home, elements)) {
    const by = cardAside({ left: home.left, width: box.width }, elements.map((e) => e.getBoundingClientRect()), document.documentElement.clientWidth);
    if (by !== null && fitsBeside({ left: home.left + by, right: home.right + by, top: home.top }, elements)) aside = by;
  }
  if (aside === moved) return;
  if (aside) card.style.setProperty(ASIDE, `${aside}px`);
  else card.style.removeProperty(ASIDE);
}

/**
 * Brings the card's Section into view: its controls shown (on their tab), and its Viewers and its controls between the
 * header and the card, or beside the card where it does not cover them, together where they fit (issue 128, decision
 * 10). Where the card would cover them and another place along the bottom lets them all show, it moves there (issue
 * 254). Where the control moving and the Viewers still do not fit together, the page shows each in turn, as the card's
 * clock says (`looking`, issue 206): the control as it starts to move, with as many Viewers as fit beside it, then
 * the Viewers, with the control if it fits; so where all fit the page holds still. It glides, or jumps with reduced
 * motion. The person's own scroll stops it for the rest of the card (decision 5). The LFO card points at the Timeline
 * (issue 158, decided by the owner): its Depth knob shows with it, or in turn.
 */
function useSectionInView(
  card: TourSection | undefined,
  docked: RefObject<HTMLElement | null>,
  { moving, looking, pageTheirs }: { moving: TourMove['id'] | null; looking: Looking; pageTheirs: () => boolean },
) {
  // What the card's clock says now, read by each scroll; and the scroll, set up for the card shown.
  const now = useRef({ moving, looking, pageTheirs });
  // Kept after each render, not while rendering (issue 228), before the scroll below reads it.
  useEffect(() => {
    now.current = { moving, looking, pageTheirs };
  }, [moving, looking, pageTheirs]);
  const bring = useRef(() => {});
  useEffect(() => {
    if (!card) {
      // A card after the Sections, in the middle again (unless the person moved it).
      if (docked.current && !docked.current.hasAttribute('data-moved')) docked.current.style.removeProperty(ASIDE);
      return;
    }
    const controls = card.moves.map((move) => ({ id: move.id, element: controlOf(move) }));
    for (const { element } of controls) if (element) reveal(element);
    const viewers = card.viewers.map((name) => document.querySelector(`[aria-label="${name}"]`)).filter((e) => e !== null);
    for (const viewer of viewers) viewer.setAttribute('data-tutorial-viewer', '');
    let shown = false;
    bring.current = () => {
      if (!shown || !docked.current) return;
      standAside(docked.current, [...controls.flatMap((c) => (c.element ? [c.element] : [])), ...viewers]);
      // The person scrolled: the page is theirs for the rest of this card (the Shows keep it, issue 243).
      if (now.current.pageTheirs()) return;
      const { moving, looking } = now.current;
      const elementsOf = (wanted: (id: TourMove['id']) => boolean) => controls.filter((c) => wanted(c.id) && c.element).map((c) => c.element!);
      const [mover, others] = [elementsOf((id) => id === moving), elementsOf((id) => id !== moving)];
      const elements = looking === 'control' ? [...mover, ...viewers, ...others] : [...viewers, ...mover, ...others];
      bringClear(docked.current, elements, scrollBehavior(), { beside: true });
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
      const behavior = scrollBehavior();
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
 * cards; the last offers the first Tutorial. It takes the focus on its Next when the Tour starts; turning the controls
 * never takes it.
 */
export function TourCard({ index, moving, looking, freezing, naming, pageTheirs, onBack, onNext, onFirstTutorial, onClose }: Props) {
  const shown = tourCardAt(index);
  const section = shown.kind === 'section' ? shown.section : undefined;
  const last = index === TOUR_LENGTH - 1;
  const card = useRef<HTMLElement>(null);
  useSectionInView(section, card, { moving, looking, pageTheirs });
  useRing(section, moving);
  useFindShown(shown.kind === 'find' ? shown.find : undefined);

  const primary = last ? (
    <button type="button" className="tool tool-primary" onClick={onFirstTutorial}>
      Build a {TUTORIALS[0].preset}
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
      name={shown.kind === 'section' ? shown.section.title : shown.find.title}
      progress={`${index + 1} of ${TOUR_LENGTH}`}
      closeLabel="Close the Tour"
      onClose={onClose}
      primary={primary}
      under={section?.freezes && <FrozenLine freezes={section.freezes} freezing={freezing} naming={naming} />}
      actions={actions}
    >
      {/* What to watch first: folded on a phone, it is all the card shows (issue 129). */}
      {shown.kind === 'section' ? (
        <>
          <p>{shown.section.look}</p>
          <p>{shown.section.chain}</p>
          <p>{shown.section.does}</p>
          <p className="card-then">{shown.section.sees}</p>
        </>
      ) : (
        <>
          <p>{shown.find.look}</p>
          {shown.find.says.map((line, i, says) => (
            <p key={line} className={i === says.length - 1 ? 'card-then' : undefined}>
              {line}
            </p>
          ))}
        </>
      )}
    </CardShell>
  );
}
