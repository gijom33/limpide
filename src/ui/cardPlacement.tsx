import { type CSSProperties, type MouseEvent, type PointerEvent, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { safeStorage } from '../app/storage';
import { ChevronIcon } from './icons';

const PHONE = '(max-width: 600px)';

/**
 * A docked card (the Demo's, a Tutorial's) the person can fold to its top row and, from the 2 × 2 layout up, drag
 * by that row to see what it covers (the owner's decisions, issue 59, 2026-10-27). The fold is remembered for each
 * kind of card; the place is not: the card opens at the bottom each time. A double-click on the top row puts it back.
 * On a phone the card spans the bottom edge and only folds.
 */
export function useCardPlacement(card: RefObject<HTMLElement | null>, kind: 'demo' | 'tutorial') {
  const storage = useMemo(safeStorage, []);
  const key = `limpide.cardFolded.${kind}`;
  const [folded, setFolded] = useState(() => storage.getItem(key) === '1');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; from: { x: number; y: number } } | null>(null);

  /** The offset moved as far as the window allows: the card stays whole on screen. */
  const within = (wanted: { x: number; y: number }, current: { x: number; y: number }) => {
    const box = card.current?.getBoundingClientRect();
    if (!box) return wanted;
    const [left, top] = [box.left - current.x, box.top - current.y]; // where it sits unmoved
    return {
      x: Math.min(innerWidth - box.width - left, Math.max(-left, wanted.x)),
      y: Math.min(innerHeight - box.height - top, Math.max(-top, wanted.y)),
    };
  };

  // A smaller window, or the card growing or folding, may leave it partly off screen: bring it back in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: within reads the card's box, which is what changed
  useEffect(() => {
    const keepIn = () =>
      setOffset((o) => {
        const next = matchMedia(PHONE).matches ? { x: 0, y: 0 } : within(o, o);
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
      if (e.button !== 0 || (e.target as Element).closest('button') || matchMedia(PHONE).matches) return;
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
    toggleFold: () =>
      setFolded((f) => {
        storage.setItem(key, f ? '0' : '1');
        return !f;
      }),
    /** On the card: where it has been moved to, and whether it is folded. */
    cardProps: {
      style: { '--card-dx': `${offset.x}px`, '--card-dy': `${offset.y}px` } as CSSProperties,
      'data-folded': folded || undefined,
      'data-moved': offset.x || offset.y ? true : undefined,
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
