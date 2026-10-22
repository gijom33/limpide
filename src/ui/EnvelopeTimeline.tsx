import { useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createTimeline } from '../viewers/timeline';
import type { ViewSettings } from '../viewers/viewSettings';
import { TIPS } from './tips';
import { Tooltip } from './Tooltip';

/** The Envelope Timeline panel, under the signal chain. */
export function EnvelopeTimeline({ engine, view }: { engine: SynthEngine; view(): ViewSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => addToRenderLoop(createTimeline(canvasRef.current!, engine, view)), [engine, view]);

  return (
    <section className="timeline" aria-label="Envelope Timeline">
      <h2>
        <Tooltip content={TIPS.timeline}>
          <span className="has-tip">Envelope Timeline</span>
        </Tooltip>
        <span className="timeline-key">
          <span data-mark="amp">Amp Envelope</span>
          <span data-mark="cutoff">Effective Cutoff</span>
        </span>
      </h2>
      <canvas ref={canvasRef} aria-label="Envelope Timeline" />
    </section>
  );
}
