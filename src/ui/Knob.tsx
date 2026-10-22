import { useRef } from 'react';
import { formatParam, PARAMS, type ParamId } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';

const DRAG_PIXELS_FOR_FULL_TRAVEL = 200;
const SWEEP_DEGREES = 270;

interface Props {
  id: ParamId;
  value: number;
  onChange(value: number): void;
  /** Dimmed when the Parameter has no audible effect right now (still adjustable). */
  inactive?: boolean;
  /** Why it is inactive, shown as a tooltip. */
  inactiveHint?: string;
}

/** A Parameter control: drag vertically (Shift for fine), arrow keys, double-click to reset. */
export function Knob({ id, value, onChange, inactive, inactiveHint }: Props) {
  const def = PARAMS[id];
  const position = valueToPosition(def, value);
  const drag = useRef<{ y: number; position: number } | null>(null);
  const setPosition = (p: number) => onChange(positionToValue(def, p));

  return (
    <div className="knob" data-inactive={inactive || undefined} title={inactive ? inactiveHint : undefined}>
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
      <div className="knob-value">{formatParam(id, value)}</div>
    </div>
  );
}
