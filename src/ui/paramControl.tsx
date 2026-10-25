import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { mathsReadout, widestMathsReadout } from '../music/maths';
import { formatParam, PARAMS, type ParamId } from '../patch/patch';
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
    'aria-label': def.label,
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
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setPosition(position + step);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setPosition(position - step);
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
