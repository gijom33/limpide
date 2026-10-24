import { useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import type { LfoWaveform } from '../modulation/lfo';
import { addToRenderLoop } from '../viewers/renderLoop';
import { useLearnable } from './learn';

export const LFO_SHAPES: { waveform: LfoWaveform; label: string }[] = [
  { waveform: 'sine', label: 'Sine' },
  { waveform: 'triangle', label: 'Triangle' },
  { waveform: 'square', label: 'Square' },
  { waveform: 'saw', label: 'Saw' },
];

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

interface Props {
  engine: SynthEngine;
  waveform: LfoWaveform;
  onChange(waveform: LfoWaveform): void;
}

/**
 * The LFO as it moves: its recent history from the Modulation model, scrolling, the newest at the right with a dot
 * (ADR-0003: the same LFO the sound has). It is also the shape picker: a click or Enter steps to the next shape.
 * Drawn by the render loop, outside React (ADR-0002).
 */
export function LfoPlot({ engine, waveform, onChange }: Props) {
  const line = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const learnable = useLearnable({ kind: 'choice', id: 'lfoWaveform' });

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

  const index = LFO_SHAPES.findIndex((s) => s.waveform === waveform);
  return (
    <button
      type="button"
      className="lfo-plot"
      aria-label={`LFO Waveform: ${LFO_SHAPES[index].label}`}
      onClick={() => onChange(LFO_SHAPES[(index + 1) % LFO_SHAPES.length].waveform)}
      {...learnable}
    >
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <line className="lfo-plot-axis" x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} />
        <path ref={line} className="lfo-plot-line" d="" />
        <circle ref={dot} className="lfo-plot-dot" cx={W - PAD} cy={H / 2} r="3.5" />
      </svg>
    </button>
  );
}
