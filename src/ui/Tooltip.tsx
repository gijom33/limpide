import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { placeTooltip } from './placeTooltip';

export interface TipContent {
  title: string;
  /** What it does, in plain words. */
  body: string;
  /** How to use it (optional). */
  how?: string;
}

const HOVER_DELAY_MS = 350;

/**
 * Explains the control it wraps: after a short pause on hover, at once on keyboard focus; Escape, leaving
 * or pressing dismisses it. Linked to the control with aria-describedby so screen readers announce it too.
 */
export function Tooltip({ content, children }: { content: TipContent; children: ReactNode }) {
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  // The control itself (not this wrapper) carries the description, so it is announced on focus.
  useEffect(() => {
    const target = wrapperRef.current?.querySelector('[role="radiogroup"], [role="group"], button, [role="slider"]');
    target?.setAttribute('aria-describedby', id);
  }, [id]);

  const show = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
    setPosition(null);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !wrapperRef.current || !tipRef.current) return;
    const trigger = wrapperRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    setPosition(placeTooltip(trigger, tip, { width: window.innerWidth, height: window.innerHeight }));
  }, [open]);

  return (
    <span
      className="tip-anchor"
      ref={wrapperRef}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(HOVER_DELAY_MS)}
      onPointerLeave={hide}
      onPointerDown={hide}
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
          hidden={!open}
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
