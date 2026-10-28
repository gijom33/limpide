import { useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import type { LfoNumber } from '../patch/patch';
import { addToRenderLoop } from '../viewers/renderLoop';

// The plot draws in its own CSS pixels, whatever shape the layout gives it, so full Depth spans its whole height
// (a fixed box scaled to fit left bands above and below in squarer plots). The line keeps clear of the edges.
const PAD = 5;
/** Points along the line: two per pixel of a wide plot, so even a dozen cycles keep their shape. */
const SAMPLES = 400;
/**
 * How much time the plot shows: one second, always, so the plot is a time axis like the Timeline's: 1 Hz is exactly
 * one period, 20 Hz twenty. A fixed second also keeps a fast LFO readable: two cycles of 20 Hz would scroll a third
 * of a cycle per frame and read as noise (the wagon-wheel effect); over a second, a frame moves the trace a few
 * units at most.
 */
const SPAN = 1;


/**
 * The LFO as it moves: its recent history from the Modulation model, scrolling, the newest at the right with a dot
 * (ADR-0003: the same LFO the sound has). Its height is the Depth: flat at 0, the plot's full height at 100 %. Drawn by the render loop, outside React (ADR-0002).
 * Dimmed as an inactive knob is while its Depth is 0 (the owner, 2026-10-28).
 */
export function LfoPlot({ engine, lfo, label, inactive }: { engine: SynthEngine; lfo: LfoNumber; label: string; inactive?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const axis = useRef<SVGLineElement>(null);
  const line = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let w = 0;
    let h = 0;
    const observer = new ResizeObserver(([entry]) => {
      ({ width: w, height: h } = entry.contentRect);
      svg.current?.setAttribute('viewBox', `0 0 ${w} ${h}`);
      axis.current?.setAttribute('x2', String(w - PAD));
      axis.current?.setAttribute('y1', String(h / 2));
      axis.current?.setAttribute('y2', String(h / 2));
      dot.current?.setAttribute('cx', String(w - PAD));
    });
    observer.observe(box.current!);
    const y = (value: number) => (h / 2 - value * (h / 2 - PAD)).toFixed(1);
    const stop = addToRenderLoop(() => {
      if (!w || !h) return;
      const now = engine.now();
      const points: string[] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const t = now - SPAN + (i / SAMPLES) * SPAN;
        points.push(`${(PAD + (i / SAMPLES) * (w - 2 * PAD)).toFixed(1)} ${y(engine.lfoSwingAt(t, lfo))}`);
      }
      line.current?.setAttribute('d', `M${points.join(' L')}`);
      dot.current?.setAttribute('cy', y(engine.lfoSwingAt(now, lfo)));
    });
    return () => {
      observer.disconnect();
      stop();
    };
  }, [engine, lfo]);

  return (
    <div className="lfo-plot" ref={box} role="img" aria-label={label} data-lfo={lfo} data-inactive={inactive || undefined}>
      <svg ref={svg} aria-hidden="true">
        <line ref={axis} className="lfo-plot-axis" x1={PAD} />
        <path ref={line} className="lfo-plot-line" d="" />
        <circle ref={dot} className="lfo-plot-dot" r="3.5" />
      </svg>
    </div>
  );
}
