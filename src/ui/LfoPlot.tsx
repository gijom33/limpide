import { useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { addToRenderLoop } from '../viewers/renderLoop';

// The plot's drawing box, in its own units (CSS sizes it); the line keeps clear of the edges.
const W = 132;
const H = 48;
const PAD = 5;
/** Two points per unit of width, so even a dozen cycles keep their shape (a square's edges, a saw's drop). */
const SAMPLES = 2 * W;
/**
 * How much time the plot shows: one second, always, so the plot is a time axis like the Timeline's: 1 Hz is exactly
 * one period, 20 Hz twenty. A fixed second also keeps a fast LFO readable: two cycles of 20 Hz would scroll a third
 * of a cycle per frame and read as noise (the wagon-wheel effect); over a second, a frame moves the trace a few
 * units at most.
 */
const SPAN = 1;

const y = (value: number) => (H / 2 - value * (H / 2 - PAD)).toFixed(1);


/**
 * The LFO as it moves: its recent history from the Modulation model, scrolling, the newest at the right with a dot
 * (ADR-0003: the same LFO the sound has). Drawn by the render loop, outside React (ADR-0002).
 */
export function LfoPlot({ engine }: { engine: SynthEngine }) {
  const line = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);

  useEffect(
    () =>
      addToRenderLoop(() => {
        const now = engine.now();
        const points: string[] = [];
        for (let i = 0; i <= SAMPLES; i++) {
          const t = now - SPAN + (i / SAMPLES) * SPAN;
          points.push(`${(PAD + (i / SAMPLES) * (W - 2 * PAD)).toFixed(1)} ${y(engine.lfoAt(t))}`);
        }
        line.current?.setAttribute('d', `M${points.join(' L')}`);
        dot.current?.setAttribute('cy', y(engine.lfoAt(now)));
      }),
    [engine],
  );

  return (
    <div className="lfo-plot" role="img" aria-label="LFO">
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <line className="lfo-plot-axis" x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} />
        <path ref={line} className="lfo-plot-line" d="" />
        <circle ref={dot} className="lfo-plot-dot" cx={W - PAD} cy={H / 2} r="3.5" />
      </svg>
    </div>
  );
}
