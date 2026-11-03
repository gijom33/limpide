import { createContext, type ReactNode, useContext, useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Formula } from '../music/geek';
import { GeekOnContext } from './geekContext';
import type { HistoryLine } from './history';
import { addDescription, removeDescription } from './inactive';
import { placeTooltip } from './placeTooltip';

export interface TipContent {
  title: string;
  /** What it does, in plain words. */
  body: string;
  /** How to use it (optional). */
  how?: string;
  /** A knob's or fader's steps for the keys (issue 160): shown where there is a keyboard, not on a touch screen. */
  keys?: string;
  /** Its steps while the Synth Geek Layer is on, where it reads another unit there: a Mixer fader's dB (issue 201). */
  geekKeys?: string;
  /** The formula behind it (issue 133, decision 2): shown with the Synth Geek Layer on, above History. */
  underTheHood?: Formula;
  /** Where the control comes from (issue 134): shown last, with the Synth Geek Layer on. */
  history?: HistoryLine;
}

/**
 * Whether tooltips open at all: Display's Tooltips switch (issue 81). Off, each control keeps its description, and a
 * header button showing its icon alone still shows its name (issue 106).
 */
export const TooltipsContext = createContext(true);

// A header button's word, which it drops where the header is short of room (861 to 1099 px; Hold's, MIDI's and
// Display's up to 1279 px, issue 154).
const WORD = '.tool-word, .demo-word';

const HOVER_DELAY_MS = 350;
// On a touch screen, holding a control this long without moving shows its explanation (issue 49).
const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 8;
// A control whose menu, list or panel is open (the LFOs' Destinations, Patch, Display, MIDI, Tutorial, Tempo).
const EXPANDED = '[aria-expanded="true"]';
// A panel open from the header (Patches, Display, MIDI, Tutorial, Tempo): while one is, only its own controls show
// their tips, so no other tip lies over its rows (issue 188).
const PANEL = '[data-panel]';

/**
 * Explains the control it wraps: after a short pause on hover, at once on keyboard focus, and on a touch screen
 * when it is held still for half a second; Escape, leaving or pressing dismisses it (on touch, the next touch).
 * Linked to the control with aria-describedby so screen readers announce it too. `longPress` off where holding
 * is how the control is played (the piano). With Tooltips off, only a header button showing its icon alone opens one,
 * on hover or focus, with its name alone. None opens while the control's menu, list or panel is open, and opening it
 * puts away the one shown, so a tip never hides a choice (issue 175); the next hover or focus shows it again. While a
 * header panel is open, only its own controls' tips open (issue 188).
 */
export function Tooltip({ content, children, longPress = true }: { content: TipContent; children: ReactNode; longPress?: boolean }) {
  const id = useId();
  const enabled = useContext(TooltipsContext);
  const geek = useContext(GeekOnContext);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  // Open with its name alone, the tip's title: Tooltips off, on a button whose word is hidden (issue 106).
  const [named, setNamed] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  // A finger down, waiting to become a long press; and whether one opened the tooltip, which then stays after the
  // finger lifts (a touch "leaves" as it ends) and keeps the control from acting on that release.
  const press = useRef<{ x: number; y: number } | null>(null);
  const pinned = useRef(false);
  const swallowClick = useRef(false);

  // The control itself (not this wrapper) carries the description, so it is announced on focus; after the reason it is
  // greyed out, if it is (issue 104).
  useEffect(() => {
    const target = wrapperRef.current?.querySelector('[role="radiogroup"], [role="group"], button, [role="slider"], [role="spinbutton"], [role="img"]');
    if (!target) return;
    addDescription(target, id, 'last');
    return () => removeDescription(target, id);
  }, [id]);

  const expanded = () => !!wrapperRef.current?.querySelector(EXPANDED);
  const outsideOpenPanel = () => {
    const panels = [...document.querySelectorAll(PANEL)];
    return panels.length > 0 && !panels.some((panel) => panel.contains(wrapperRef.current));
  };
  const blocked = () => expanded() || outsideOpenPanel();
  const show = (delay: number) => {
    const word = wrapperRef.current?.querySelector(WORD);
    const iconAlone = !!word && word.getClientRects().length === 0;
    if (!enabled && !iconAlone) return;
    setNamed(!enabled);
    window.clearTimeout(timer.current);
    // Asked again when the delay is out: a click in between may have opened the control's menu.
    timer.current = window.setTimeout(() => !blocked() && setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    press.current = null;
    pinned.current = false;
    swallowClick.current = false;
    setOpen(false);
    setNamed(false);
    setPosition(null);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hideNow = useEffectEvent(hide);
  const expandedNow = useEffectEvent(expanded);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hideNow();
    // Opened by a long press: the next touch anywhere, or a scroll, puts it away.
    const onTouchElsewhere = (e: PointerEvent) => pinned.current && !wrapperRef.current?.contains(e.target as Node) && hideNow();
    const onScroll = () => pinned.current && hideNow();
    // The control opens its menu, list or panel (a click, Enter or Space): the tip goes at once.
    const onExpand = new MutationObserver(() => expandedNow() && hideNow());
    if (wrapperRef.current) onExpand.observe(wrapperRef.current, { subtree: true, attributeFilter: ['aria-expanded'] });
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onTouchElsewhere);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      onExpand.disconnect();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onTouchElsewhere);
      window.removeEventListener('scroll', onScroll);
    };
  }, [open]);

  useLayoutEffect(() => {
    const tipEl = (named ? nameRef : tipRef).current;
    if (!open || !wrapperRef.current || !tipEl) return;
    // A wrapper with no box of its own (display: contents, around a Viewer's canvas) is placed by what it wraps.
    const own = wrapperRef.current.getBoundingClientRect();
    const trigger = own.width || own.height ? own : (wrapperRef.current.firstElementChild?.getBoundingClientRect() ?? own);
    const tip = tipEl.getBoundingClientRect();
    setPosition(placeTooltip(trigger, tip, { width: window.innerWidth, height: window.innerHeight }));
  }, [open, named]);

  const place = position ? { left: position.left, top: position.top } : { left: -9999, top: 0 };
  // The steps in the unit the control reads: a Mixer fader's dB in the Synth Geek Layer (issue 201).
  const keys = (geek && content.geekKeys) || content.keys;
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
          if (blocked()) return;
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
        <div id={id} role="tooltip" ref={tipRef} className="tooltip" hidden={!open || named || !enabled} style={place}>
          <strong>{content.title}</strong>
          <span>{content.body}</span>
          {content.how && <span className="tooltip-how">{content.how}</span>}
          {keys && <span className="tooltip-keys">{keys}</span>}
          {geek && content.underTheHood && (
            <span className="tooltip-hood">
              <b>Under the hood</b> <span className="tooltip-formula">{content.underTheHood.formula}</span> {content.underTheHood.where}
            </span>
          )}
          {geek && content.history && (
            <span className="tooltip-history">
              <b>History</b> {content.history.line}
            </span>
          )}
        </div>,
        document.body,
      )}
      {/* The name alone, where the tip would open; the button's own name already says it to a screen reader. */}
      {open &&
        named &&
        createPortal(
          <div ref={nameRef} className="tooltip" aria-hidden="true" style={place}>
            <strong>{content.title}</strong>
          </div>,
          document.body,
        )}
    </span>
  );
}
