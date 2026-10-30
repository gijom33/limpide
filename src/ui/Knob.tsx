import { useId, useRef } from 'react';
import { MODULATED } from '../modulation/destinations';
import { PARAMS, type ParamId } from '../patch/patch';
import { valueToPosition } from '../patch/taper';
import { ModulationRing } from './modulationRing';
import { held, pressed, useParamControl, useWheel } from './paramControl';
import { Tooltip } from './Tooltip';
import { PARAM_TIPS } from './tips';

const DRAG_PIXELS_FOR_FULL_TRAVEL = 200;
/** How far a pointer may wander before a press counts as a drag rather than a click. */
const CLICK_SLOP = 3;
const SWEEP_DEGREES = 270;

/**
 * The dial's drawing, in its own units: big knobs are drawn on 68, small ones on 52, then sized by CSS (smaller
 * together on compact windows). The cap sits inside the arc; the marker runs from partway in to near the cap's edge,
 * on a small cap the big one's marker scaled down with it (the owner, 2026-10-27): shorter and thinner.
 */
const GEOMETRY = {
  play: { size: 68, arcWidth: 6, cap: 19, markerFrom: 7, markerTo: 16, markerWidth: 3 },
  set: { size: 52, arcWidth: 4, cap: 12, markerFrom: 4.5, markerTo: 10, markerWidth: 2 },
} as const;

const angleOf = (position: number) => (position - 0.5) * SWEEP_DEGREES;
function point(c: number, r: number, degrees: number): [number, number] {
  const a = (degrees * Math.PI) / 180;
  return [c + r * Math.sin(a), c - r * Math.cos(a)];
}
/** The arc from one position to another (0–1 along the sweep), clockwise. */
function arc(c: number, r: number, from: number, to: number): string {
  const [a0, a1] = [angleOf(Math.min(from, to)), angleOf(Math.max(from, to))];
  const [x0, y0] = point(c, r, a0);
  const [x1, y1] = point(c, r, Math.max(a1, a0 + 0.5)); // never empty, so the round end still shows the value
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

interface Props {
  id: ParamId;
  value: number;
  onChange(value: number): void;
  /** Dimmed when the Parameter has no audible effect right now (still adjustable). */
  inactive?: boolean;
}

/**
 * A Parameter knob (look B, issue 18): the value as an arc in the stage colour around a raised cap with one marker
 * line, big for Parameters worth turning while playing and small for the others (ADR-0008). Drag vertically (Shift
 * for fine), arrow keys, double-click to reset.
 */
export function Knob({ id, value, onChange, inactive }: Props) {
  const c = useParamControl(id, value, onChange);
  const g = GEOMETRY[PARAMS[id].control === 'play' ? 'play' : 'set'];
  const centre = g.size / 2;
  const groove = centre - 8;
  // A bipolar Parameter's arc starts at zero, so −1 oct and +1 oct fill away from the middle.
  const origin = c.def.min < 0 && c.def.max > 0 ? valueToPosition(c.def, 0) : 0;
  const [markerX0, markerY0] = point(centre, g.markerFrom, angleOf(c.position));
  const [markerX1, markerY1] = point(centre, g.markerTo, angleOf(c.position));
  const gradient = `knob-cap-${useId().replace(/[^\w-]/g, '')}`; // a plain id, safe inside url(#…)
  const drag = useRef<{ x: number; y: number; position: number; moved: boolean } | null>(null);
  const wheel = useWheel(c.position, c.setPosition);

  return (
    <Tooltip content={PARAM_TIPS[id]}>
      <div className="knob" data-size={g === GEOMETRY.play ? 'big' : 'small'} data-inactive={inactive || undefined} {...c.attributes}>
        <svg
          ref={wheel}
          className="knob-dial"
          viewBox={`0 0 ${g.size} ${g.size}`}
          {...c.slider}
          onPointerDown={(e) => {
            if (!pressed(e)) return;
            c.grab(e, e.currentTarget);
            drag.current = { x: e.clientX, y: e.clientY, position: c.position, moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            if (!held(e)) {
              // The button was let go where the page never heard it: the drag is over.
              drag.current = null;
              c.release();
              return;
            }
            if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > CLICK_SLOP) d.moved = true;
            const scale = e.shiftKey ? 0.1 : 1;
            c.setPosition(d.position + ((d.y - e.clientY) / DRAG_PIXELS_FOR_FULL_TRAVEL) * scale);
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            c.release();
            // A click on the arc, outside the cap: the single-pointer way to set a value (WCAG 2.5.7).
            if (!d || d.moved) return;
            const r = e.currentTarget.getBoundingClientRect();
            const [dx, dy] = [e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)];
            const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
            if (Math.hypot(dx, dy) > (g.cap / g.size) * r.width && Math.abs(degrees) <= SWEEP_DEGREES / 2) {
              c.setPosition(degrees / SWEEP_DEGREES + 0.5);
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
            c.release();
          }}
          onLostPointerCapture={() => {
            drag.current = null;
            c.release();
          }}
        >
          <defs>
            <radialGradient id={gradient} cx="50%" cy="38%" r="65%">
              <stop offset="0%" className="knob-cap-hi" />
              <stop offset="100%" className="knob-cap-lo" />
            </radialGradient>
          </defs>
          <path className="knob-groove" d={arc(centre, groove, 0, 1)} strokeWidth={g.arcWidth} />
          <path className="knob-arc" d={arc(centre, groove, origin, c.position)} strokeWidth={g.arcWidth} />
          <circle className="knob-cap" cx={centre} cy={centre} r={g.cap} fill={`url(#${gradient})`} />
          <line className="knob-marker" x1={markerX0} y1={markerY0} x2={markerX1} y2={markerY1} strokeWidth={g.markerWidth} />
          {MODULATED.has(id) && (
            <ModulationRing
              id={id}
              centre={centre}
              radius={centre - 2}
              trackRadius={groove}
              dotRadius={g === GEOMETRY.play ? 5 : 4}
              arc={(from, to, r) => arc(centre, r, from, to)}
              point={(p, r) => point(centre, r, angleOf(p))}
            />
          )}
        </svg>
        {c.text}
      </div>
    </Tooltip>
  );
}
