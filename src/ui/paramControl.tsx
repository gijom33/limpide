import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { mathsReadout, widestMathsReadout } from '../music/maths';
import { formatParam, PARAMS, type ParamId, paramName } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { useLearnable } from './learn';
import { MathsContext } from './mathsContext';

/** Readouts sampled across a control's travel to find the widest it can show. */
const WIDTH_SAMPLES = 128;
/** How long a control keeps showing its value after it last changed (where values only show while changing). */
const SHOW_VALUE_MS = 1200;

/** The longest readouts a Parameter can show, so its control can reserve their width and never change size. */
function widestReadouts(id: ParamId): string[] {
  const def = PARAMS[id];
  const values = [def.default, ...Array.from({ length: WIDTH_SAMPLES + 1 }, (_, i) => positionToValue(def, i / WIDTH_SAMPLES))];
  const all = new Set(values.map((v) => formatParam(id, v)));
  return [...all].sort((a, b) => b.length - a.length).slice(0, 4);
}

/**
 * What every Parameter control shares, knob or fader: its position, the arrow keys (Shift for fine), double-click
 * to reset, MIDI Learn, the moment it changes, and the value bubble above a finger that drags it.
 */
export function useParamControl(id: ParamId, value: number, onChange: (value: number) => void) {
  const def = PARAMS[id];
  const position = valueToPosition(def, value);
  const setPosition = (p: number) => onChange(positionToValue(def, Math.min(1, Math.max(0, p))));
  const learnable = useLearnable({ kind: 'param', id });
  // In the Maths Layer some controls read the quantity behind their value instead (Q, dB): sized for it while on.
  const mathsPatch = useContext(MathsContext);
  const maths = mathsPatch ? mathsReadout(id, value, mathsPatch) : undefined;
  const readout = maths ?? formatParam(id, value);
  const widestMaths = mathsPatch ? widestMathsReadout(id) : undefined;
  const widest = useMemo(() => [...widestReadouts(id), ...(widestMaths ? [widestMaths] : [])], [id, widestMaths]);
  const changing = useChanging(value);
  const [touching, setTouching] = useState(false);

  const slider = {
    role: 'slider',
    tabIndex: 0,
    'aria-label': paramName(id),
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': Math.round(position * 100),
    'aria-valuetext': formatParam(id, value),
    onDoubleClick: () => onChange(def.default),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement | SVGElement>) => {
      delete (e.currentTarget as HTMLElement).dataset.pointer; // keyboard focus from now on: show the ring
      // A stepped Parameter (Octave, Semitone) moves a whole step per key: less would round back to where it was.
      const unit = def.step ? def.step / (def.max - def.min) : 0;
      const step = Math.max(unit, e.shiftKey ? 0.002 : 0.02);
      // Page Up and Down a tenth of the travel, Home and End to its ends (the WAI-ARIA slider pattern, issue 51).
      const page = Math.max(unit, 0.1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setPosition(position + step);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setPosition(position - step);
      else if (e.key === 'PageUp') setPosition(position + page);
      else if (e.key === 'PageDown') setPosition(position - page);
      else if (e.key === 'Home') setPosition(0);
      else if (e.key === 'End') setPosition(1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    },
  } as const;

  /** Takes the focus for the keys, marked as the pointer's, so no keyboard-focus ring shows for a click or a drag. */
  const focusByPointer = (target: HTMLElement | SVGElement) => {
    target.dataset.pointer = '';
    target.addEventListener('blur', () => delete target.dataset.pointer, { once: true });
    target.focus();
  };
  /** A press on the control's dial or cap: keeps the drag (and Safari's text selection) to itself. */
  const grab = (e: React.PointerEvent, target: HTMLElement | SVGElement) => {
    e.preventDefault();
    focusByPointer(target);
    target.setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch') setTouching(true);
  };
  const release = () => setTouching(false);

  const attributes = {
    'data-changing': changing || undefined,
    'data-bubble': touching || undefined,
    ...learnable,
  };
  const text = (
    <>
      {touching && <div className="value-bubble">{readout}</div>}
      <div className="knob-label">{def.label}</div>
      <div className="knob-value">
        <span data-maths={maths !== undefined || undefined}>{readout}</span>
        {widest.map((t) => (
          <span key={t} className="knob-value-sizer" aria-hidden="true">
            {t}
          </span>
        ))}
      </div>
    </>
  );
  return { def, position, setPosition, slider, grab, focusByPointer, release, attributes, text };
}

/**
 * A press that may turn a control: the main button only, so a right- or Ctrl-click (whose context menu takes the
 * release) never starts a drag that outlives it (the owner's bug).
 */
export const pressed = (e: React.PointerEvent) => e.button === 0 && !(e.pointerType === 'mouse' && e.ctrlKey);

/** Whether the press is still on: a move with no button held means its release never reached the page. */
export const held = (e: React.PointerEvent) => (e.buttons & 1) === 1;

/** True for a moment after `value` changes, however it was changed (hand, keys, MIDI, the Demo, a Patch). */
function useChanging(value: number): boolean {
  const [changing, setChanging] = useState(false);
  const shown = useRef(value);
  useEffect(() => {
    if (value === shown.current) return; // not on mount (which StrictMode repeats)
    shown.current = value;
    setChanging(true);
    const timer = setTimeout(() => setChanging(false), SHOW_VALUE_MS);
    return () => clearTimeout(timer);
  }, [value]);
  return changing;
}

/** Travel per pixel of wheel or trackpad scroll: a mouse wheel's notch (about 100 px) turns a control 4 %. */
const WHEEL_TRAVEL = 0.0004;

/**
 * The mouse wheel or a two-finger scroll over a control turns it (issue 53), Shift for fine, and the page does not
 * scroll meanwhile. React's wheel listeners cannot stop the scroll (they are passive), so this is the element's own.
 */
export function useWheel(position: number, setPosition: (p: number) => void) {
  const latest = useRef({ position, setPosition });
  latest.current = { position, setPosition };
  const listening = useRef<{ element: Element; listener: (e: WheelEvent) => void } | null>(null);
  // A ref callback, so it follows the element however it is mounted.
  return useCallback((element: Element | null) => {
    if (listening.current) listening.current.element.removeEventListener('wheel', listening.current.listener as EventListener);
    listening.current = null;
    if (!element) return;
    const listener = (e: WheelEvent) => {
      const pixels = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 33 : e.deltaY;
      if (!pixels) return;
      e.preventDefault();
      const { position, setPosition } = latest.current;
      setPosition(position - pixels * WHEEL_TRAVEL * (e.shiftKey ? 0.1 : 1));
    };
    element.addEventListener('wheel', listener as EventListener, { passive: false });
    listening.current = { element, listener };
  }, []);
}
