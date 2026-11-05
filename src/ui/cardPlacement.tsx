import { type CSSProperties, type MouseEvent, type PointerEvent, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { recall, remember } from '../app/rememberedSettings';
import { safeStorage } from '../app/storage';
import { ChevronIcon } from './icons';

/** Whether the card may move: the CSS says, so the phone's breakpoint is written once (issue 67). */
const pinned = (card: HTMLElement | null) => !!card && getComputedStyle(card).getPropertyValue('--card-pinned').trim() === '1';

/**
 * A docked card (the Demo's, a Tutorial's, the Tour's) the person can fold to its top row and, from the 2 × 2 layout up, drag
 * by that row to see what it covers (the owner's decisions, issue 59, 2026-10-27). The fold is remembered for each
 * kind of card; the place is not: the card opens at the bottom each time. A double-click on the top row puts it back.
 * On a phone the card spans the bottom edge and only folds.
 *
 * With `opensFolded` (the Demo's card in three and four across, issue 230) the card opens folded each time, whatever
 * fold is remembered, and a fold made then is not remembered: it is the layout's, not the person's.
 */
export function useCardPlacement(card: RefObject<HTMLElement | null>, kind: 'demo' | 'tutorial' | 'tour', opening: unknown, { opensFolded = false } = {}) {
  const storage = useMemo(safeStorage, []);
  const setting = `cardFolded.${kind}` as const;
  const [folded, setFolded] = useState(() => opensFolded || recall(storage, setting) === '1');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; from: { x: number; y: number } } | null>(null);
  // A card opening anew (Play again, another Tutorial) starts at the bottom, wherever the last one was left; folded,
  // where it opens folded.
  // biome-ignore lint/correctness/useExhaustiveDependencies: opening is the trigger; opensFolded is read as it opens
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    if (opensFolded) setFolded(true);
  }, [opening]);

  /** The offset moved as far as the window allows: the card stays whole on screen. */
  const within = (wanted: { x: number; y: number }, current: { x: number; y: number }) => {
    const box = card.current?.getBoundingClientRect();
    if (!box) return wanted;
    // The document's width, not the window's: a scroll bar is not room for the card.
    const { clientWidth, clientHeight } = document.documentElement;
    // Where it sits unmoved. Its top from its fixed bottom, not its box: while the page shrinks under a scroll (the card
    // shrinking, its room with it), WebKit reports a fixed box off by the scroll's change (issue 210).
    const [left, top] = [box.left - current.x, clientHeight - parseFloat(getComputedStyle(card.current!).bottom) - box.height];
    return {
      x: Math.min(clientWidth - box.width - left, Math.max(-left, wanted.x)),
      y: Math.min(clientHeight - box.height - top, Math.max(-top, wanted.y)),
    };
  };

  // A smaller window, or the card growing or folding, may leave it partly off screen: bring it back in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: within reads the card's box, which is what changed
  useEffect(() => {
    const keepIn = () =>
      setOffset((o) => {
        const next = pinned(card.current) ? { x: 0, y: 0 } : within(o, o);
        return next.x === o.x && next.y === o.y ? o : next; // unmoved: no new render
      });
    addEventListener('resize', keepIn);
    const observer = new ResizeObserver(keepIn);
    if (card.current) observer.observe(card.current);
    return () => {
      removeEventListener('resize', keepIn);
      observer.disconnect();
    };
  }, [card]);

  const handle = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (e.button !== 0 || (e.target as Element).closest('button') || pinned(card.current)) return;
      drag.current = { x: e.clientX, y: e.clientY, from: offset };
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const d = drag.current;
      if (!d) return;
      setOffset(within({ x: d.from.x + e.clientX - d.x, y: d.from.y + e.clientY - d.y }, offset));
    },
    onPointerUp() {
      drag.current = null;
    },
    onPointerCancel() {
      drag.current = null;
    },
    onDoubleClick(e: MouseEvent<HTMLElement>) {
      if (!(e.target as Element).closest('button')) setOffset({ x: 0, y: 0 });
    },
    'data-card-handle': true,
  };

  return {
    folded,
    toggleFold: () => {
      if (!opensFolded) remember(storage, setting, folded ? '0' : '1');
      setFolded(!folded);
    },
    /** On the card: where it has been moved to, and whether it is folded. */
    cardProps: {
      style: { '--card-dx': `${offset.x}px`, '--card-dy': `${offset.y}px` } as CSSProperties,
      'data-folded': folded || undefined,
    },
    /** On the card's top row: the handle it is dragged by. */
    handle,
  };
}

/** The card's fold button: ⌄ folds it to its top row, ⌃ opens it again. */
export function FoldButton({ folded, onToggle }: { folded: boolean; onToggle(): void }) {
  return (
    <button type="button" className="tool tool-icon card-fold" aria-expanded={!folded} aria-label={folded ? 'Unfold the card' : 'Fold the card'} onClick={onToggle}>
      <ChevronIcon up={folded} />
    </button>
  );
}
