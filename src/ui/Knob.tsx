import { useEffect, useMemo, useRef, useState } from 'react';
import { formatParam, PARAMS, type ParamId } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { useLearnable } from './learn';

const DRAG_PIXELS_FOR_FULL_TRAVEL = 200;
const SWEEP_DEGREES = 270;
/** Readouts sampled across a knob's travel to find the widest it can show. */
const WIDTH_SAMPLES = 128;
/** How long a knob keeps showing its value after it last changed (where values only show while changing). */
const SHOW_VALUE_MS = 1200;

/** The longest readouts a Parameter can show, so its knob can reserve their width and never change size. */
function widestReadouts(id: ParamId): string[] {
  const def = PARAMS[id];
  const values = [def.default, ...Array.from({ length: WIDTH_SAMPLES + 1 }, (_, i) => positionToValue(def, i / WIDTH_SAMPLES))];
  const all = new Set(values.map((v) => formatParam(id, v)));
  return [...all].sort((a, b) => b.length - a.length).slice(0, 4);
}

interface Props {
  id: ParamId;
  value: number;
  onChange(value: number): void;
  /** Dimmed when the Parameter has no audible effect right now (still adjustable). */
  inactive?: boolean;
}

/** A Parameter control: drag vertically (Shift for fine), arrow keys, double-click to reset. */
export function Knob({ id, value, onChange, inactive }: Props) {
  const def = PARAMS[id];
  const position = valueToPosition(def, value);
  const drag = useRef<{ y: number; position: number } | null>(null);
  const setPosition = (p: number) => onChange(positionToValue(def, p));
  const learnable = useLearnable({ kind: 'param', id });
  const widest = useMemo(() => widestReadouts(id), [id]);
  const changing = useChanging(value);

  return (
    <div className="knob" data-inactive={inactive || undefined} data-changing={changing || undefined} {...learnable}>
      <div
        className="knob-dial"
        role="slider"
        tabIndex={0}
        aria-label={def.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position * 100)}
        aria-valuetext={formatParam(id, value)}
        style={{ '--angle': `${(position - 0.5) * SWEEP_DEGREES}deg` } as React.CSSProperties}
        onPointerDown={(e) => {
          // Stops the drag from starting a text selection (Safari does, even with pointer capture);
          // focus is lost with the default action, so restore it for keyboard control.
          e.preventDefault();
          e.currentTarget.focus();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, position };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const scale = e.shiftKey ? 0.1 : 1;
          setPosition(drag.current.position + ((drag.current.y - e.clientY) / DRAG_PIXELS_FOR_FULL_TRAVEL) * scale);
        }}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={() => onChange(def.default)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.002 : 0.02;
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setPosition(position + step);
          else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setPosition(position - step);
          else return;
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      <div className="knob-label">{def.label}</div>
      <div className="knob-value">
        <span>{formatParam(id, value)}</span>
        {widest.map((text) => (
          <span key={text} className="knob-value-sizer" aria-hidden="true">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
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
