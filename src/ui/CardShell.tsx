import { type FocusEvent, type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FoldButton, useCardPlacement } from './cardPlacement';
import { useDocked } from './docked';
import { CloseIcon } from './icons';

/**
 * Where the keyboard's focus goes on the card (issue 104): to its way forward (Start) when a Tutorial is picked, after
 * the Tour's card, the header's list or the panel it was picked from has put it back on their buttons; and there again
 * when a button it was on goes (Back on the first card, "Do it for me" once the Step is made, Finish at the end: Done),
 * never to the page. The Tour's card does the same (issue 128); `opening` is what was picked.
 */
function useCardFocus(card: RefObject<HTMLElement | null>, opening: unknown) {
  const forward = () => card.current?.querySelector<HTMLElement>('.tool-primary')?.focus();
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new opening is the trigger; forward reads the card's ref
  useEffect(() => {
    const frame = requestAnimationFrame(forward);
    return () => cancelAnimationFrame(frame);
  }, [opening]);
  // The last element the focus was on in the card, to tell a button that went from a click elsewhere on the page.
  const last = useRef<Element | null>(null);
  useLayoutEffect(() => {
    if (last.current && !last.current.isConnected && document.activeElement === document.body) forward();
  });
  return { onFocus: (e: FocusEvent) => (last.current = e.target) };
}

interface Props {
  card: RefObject<HTMLElement | null>;
  kind: 'tutorial' | 'tour';
  /** What the card opens on: a new one starts at the bottom and takes the focus on its way forward. */
  opening: unknown;
  label: string;
  name: string;
  progress: string;
  /** The Step shown is made: its tick in the top row, its note whole (a Tutorial's). */
  made?: boolean;
  closeLabel: string;
  onClose(): void;
  /** The way forward (Next, Start, Finish), in the top row while the card is folded, else among the actions. */
  primary: ReactNode;
  /** The words, announced as each new text comes. */
  children: ReactNode;
  /** Under the words, shown however the card is folded on a phone (the Tour's Frozen line). */
  under?: ReactNode;
  /** The actions before the gap (Listen), then before and after the way forward. */
  actions: { start?: ReactNode; before?: ReactNode; after?: ReactNode };
}

/**
 * The shell a Tutorial's card (issue 57) and the Tour's (issue 128) share, docked at the bottom of the page: a top row
 * with the name, the progress, + for the whole text on a phone, the fold and the close button, by which the card is
 * dragged; the words; then the actions. On a phone the words show two lines; a tap on them, or on +, shows the rest
 * (issue 40, decision 7).
 */
export function CardShell({ card, kind, opening, label, name, progress, made, closeLabel, onClose, primary, children, under, actions }: Props) {
  const [expanded, setExpanded] = useState(false);
  useDocked(card);
  const place = useCardPlacement(card, kind, opening);
  const focus = useCardFocus(card, opening);
  return (
    <section ref={card} className={`docked card-shell ${kind}`} aria-label={label} data-expanded={expanded || undefined} data-made={made || undefined} {...place.cardProps} {...focus}>
      <div className="card-top" {...place.handle}>
        <span className="card-name">{name}</span>
        <span className="card-progress" data-done={made || undefined}>
          {progress}
        </span>
        <button type="button" className="tool tool-icon card-more" aria-expanded={expanded} aria-label="Show the whole text" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '−' : '+'}
        </button>
        {/* Folded, the card keeps its way forward in the top row. */}
        {place.folded && primary}
        <FoldButton folded={place.folded} onToggle={place.toggleFold} />
        <button type="button" className="tool tool-icon" aria-label={closeLabel} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a tap on the text is the touch shortcut; the + button is the keyboard's and the screen reader's */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: as above, + is the keyboard route */}
      <div className="card-words" aria-live="polite" onClick={() => setExpanded((e) => !e)}>
        {children}
      </div>
      {under}
      <div className="card-actions">
        {actions.start}
        <span className="card-spacer" />
        {actions.before}
        {!place.folded && primary}
        {actions.after}
      </div>
    </section>
  );
}
