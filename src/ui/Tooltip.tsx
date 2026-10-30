import { createContext, type ReactNode, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { addDescription, removeDescription } from './inactive';
import { placeTooltip } from './placeTooltip';

export interface TipContent {
  title: string;
  /** What it does, in plain words. */
  body: string;
  /** How to use it (optional). */
  how?: string;
}

/** Whether tooltips open at all: Display's Tooltips switch (issue 81). Off, each control keeps its description. */
export const TooltipsContext = createContext(true);

const HOVER_DELAY_MS = 350;
// On a touch screen, holding a control this long without moving shows its explanation (issue 49).
const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 8;

/**
 * Explains the control it wraps: after a short pause on hover, at once on keyboard focus, and on a touch screen
 * when it is held still for half a second; Escape, leaving or pressing dismisses it (on touch, the next touch).
 * Linked to the control with aria-describedby so screen readers announce it too. `longPress` off where holding
 * is how the control is played (the piano).
 */
export function Tooltip({ content, children, longPress = true }: { content: TipContent; children: ReactNode; longPress?: boolean }) {
  const id = useId();
  const enabled = useContext(TooltipsContext);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  // A finger down, waiting to become a long press; and whether one opened the tooltip, which then stays after the
  // finger lifts (a touch "leaves" as it ends) and keeps the control from acting on that release.
  const press = useRef<{ x: number; y: number } | null>(null);
  const pinned = useRef(false);
  const swallowClick = useRef(false);

  // The control itself (not this wrapper) carries the description, so it is announced on focus; after the reason it is
  // greyed out, if it is (issue 104).
  useEffect(() => {
    const target = wrapperRef.current?.querySelector('[role="radiogroup"], [role="group"], button, [role="slider"], [role="img"]');
    if (!target) return;
    addDescription(target, id, 'last');
    return () => removeDescription(target, id);
  }, [id]);

  const show = (delay: number) => {
    if (!enabled) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    press.current = null;
    pinned.current = false;
    swallowClick.current = false;
    setOpen(false);
    setPosition(null);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: hide is rebuilt each render, the same each time
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    // Opened by a long press: the next touch anywhere, or a scroll, puts it away.
    const onTouchElsewhere = (e: PointerEvent) => pinned.current && !wrapperRef.current?.contains(e.target as Node) && hide();
    const onScroll = () => pinned.current && hide();
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onTouchElsewhere);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onTouchElsewhere);
      window.removeEventListener('scroll', onScroll);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !wrapperRef.current || !tipRef.current) return;
    // A wrapper with no box of its own (display: contents, around a Viewer's canvas) is placed by what it wraps.
    const own = wrapperRef.current.getBoundingClientRect();
    const trigger = own.width || own.height ? own : (wrapperRef.current.firstElementChild?.getBoundingClientRect() ?? own);
    const tip = tipRef.current.getBoundingClientRect();
    setPosition(placeTooltip(trigger, tip, { width: window.innerWidth, height: window.innerHeight }));
  }, [open]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: it listens to what bubbles up from the control it wraps
    <span
      className="tip-anchor"
      ref={wrapperRef}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(HOVER_DELAY_MS)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
      onPointerDown={(e) => {
        hide();
        if (e.pointerType !== 'touch' || !longPress || !enabled) return;
        press.current = { x: e.clientX, y: e.clientY };
        timer.current = window.setTimeout(() => {
          pinned.current = true;
          swallowClick.current = true;
          setOpen(true);
        }, LONG_PRESS_MS);
      }}
      onPointerMove={(e) => {
        const start = press.current;
        if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) <= LONG_PRESS_SLOP) return;
        // A drag (a knob turning, the page scrolling) is not a long press, and puts away one already shown.
        if (pinned.current) hide();
        else {
          window.clearTimeout(timer.current);
          press.current = null;
        }
      }}
      onPointerUp={() => {
        if (!pinned.current) window.clearTimeout(timer.current);
        press.current = null;
      }}
      onPointerCancel={() => !pinned.current && hide()}
      // The release that ends a long press only shows the explanation: the control doesn't act on it.
      onClickCapture={(e) => {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
      onContextMenu={(e) => (press.current || pinned.current) && e.preventDefault()}
      onFocus={(e) => e.target.matches(':focus-visible') && show(0)}
      onBlur={hide}
    >
      {children}
      {createPortal(
        <div
          id={id}
          role="tooltip"
          ref={tipRef}
          className="tooltip"
          hidden={!open || !enabled}
          style={position ? { left: position.left, top: position.top } : { left: -9999, top: 0 }}
        >
          <strong>{content.title}</strong>
          <span>{content.body}</span>
          {content.how && <span className="tooltip-how">{content.how}</span>}
        </div>,
        document.body,
      )}
    </span>
  );
}
