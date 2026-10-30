import { useRef } from 'react';
import type { ParamId } from '../patch/patch';
import { held, pressed, useParamControl, useWheel } from './paramControl';
import { Tooltip } from './Tooltip';
import { PARAM_TIPS } from './tips';

/** How far a pointer may wander before a press on the track counts as a drag (a scroll, on touch screens). */
const TAP_SLOP = 4;

interface Props {
  id: ParamId;
  value: number;
  onChange(value: number): void;
  /** Dimmed when the Parameter has no audible effect right now (still adjustable). */
  inactive?: boolean;
}

/**
 * A level or an envelope stage (ADR-0008): a vertical fader. Drag the cap (Shift for fine), or click the track
 * without dragging to set the value there; arrow keys, double-click to reset. A drag that starts on the track is
 * the page's scroll on touch screens, so a finger crossing a fader never changes the sound.
 */
export function Fader({ id, value, onChange, inactive }: Props) {
  const c = useParamControl(id, value, onChange);
  const cap = useRef<HTMLDivElement>(null);
  const press = useRef<{ y: number; position: number; onCap: boolean; moved: boolean } | null>(null);
  const wheel = useWheel(c.position, c.setPosition);

  // Where the cap's centre would be for a pointer at `clientY`: the cap travels the track less its own height.
  const positionAt = (track: HTMLElement, clientY: number) => {
    const r = track.getBoundingClientRect();
    const capHeight = cap.current!.offsetHeight;
    return 1 - (clientY - r.top - capHeight / 2) / (r.height - capHeight);
  };

  return (
    <Tooltip content={PARAM_TIPS[id]}>
      <div className="knob" data-kind="fader" data-inactive={inactive || undefined} {...c.attributes}>
        <div
          ref={wheel}
          className="fader"
          style={{ '--position': c.position } as React.CSSProperties}
          onPointerDown={(e) => {
            if (!pressed(e)) return;
            const onCap = e.target === cap.current;
            if (onCap) c.grab(e, cap.current!);
            press.current = { y: e.clientY, position: c.position, onCap, moved: false };
          }}
          onPointerMove={(e) => {
            const p = press.current;
            if (!p) return;
            if (!held(e)) {
              // The button was let go where the page never heard it: the press is over.
              press.current = null;
              c.release();
              return;
            }
            if (Math.abs(e.clientY - p.y) > TAP_SLOP) p.moved = true;
            if (p.onCap) {
              const track = e.currentTarget;
              const travel = track.getBoundingClientRect().height - cap.current!.offsetHeight;
              c.setPosition(p.position + ((p.y - e.clientY) / travel) * (e.shiftKey ? 0.1 : 1));
            }
          }}
          onPointerUp={(e) => {
            const p = press.current;
            press.current = null;
            c.release();
            // A click on the track: the single-pointer way to set a value (WCAG 2.5.7).
            if (p && !p.onCap && !p.moved) {
              c.setPosition(positionAt(e.currentTarget, e.clientY));
              c.focusByPointer(cap.current!);
            }
          }}
          onPointerCancel={() => {
            press.current = null;
            c.release();
          }}
          onLostPointerCapture={() => {
            press.current = null;
            c.release();
          }}
        >
          <div className="fader-fill" />
          {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: the slider role comes from c.slider */}
          <div ref={cap} className="fader-cap" aria-orientation="vertical" {...c.slider} />
        </div>
        {c.text}
      </div>
    </Tooltip>
  );
}
