import { type ReactNode, useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createTimeline } from '../viewers/timeline';
import type { ViewSettings } from '../viewers/viewSettings';
import { Tooltip } from './Tooltip';
import { TIPS } from './tips';

/** The LFO & Envelopes section, under the signal chain: the LFO beside the Envelope Timeline, in the modulation colour. */
export function EnvelopeTimeline({ engine, view, controls }: { engine: SynthEngine; view(): ViewSettings; controls?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => addToRenderLoop(createTimeline(canvasRef.current!, engine, view)), [engine, view]);

  return (
    <section className="timeline" aria-label="LFO & Envelopes">
      <h2>
        <Tooltip content={TIPS.timeline}>
          <span className="has-tip">LFO &amp; Envelopes</span>
        </Tooltip>
      </h2>
      {/* The key sits on the title line, over the plot it explains. */}
      <span className="timeline-key">
        <Tooltip content={TIPS.timelineAmp}>
          <span data-mark="amp">Amp Envelope</span>
        </Tooltip>
        <Tooltip content={TIPS.timelineFilterEnvelope}>
          <span data-mark="filterEnvelope">Filter Envelope</span>
        </Tooltip>
        <Tooltip content={TIPS.timelineCutoff}>
          <span data-mark="cutoff">Effective Cutoff</span>
        </Tooltip>
      </span>
      {controls}
      {/* The plot fills a box that takes its height from the controls beside it: the canvas itself never
          sets the row's height (its pixel size would otherwise feed back into it as the window resizes). */}
      <div className="timeline-plot">
        <Tooltip content={TIPS.envelopeTimeline}>
          <canvas ref={canvasRef} role="img" aria-label="Envelope Timeline" />
        </Tooltip>
      </div>
    </section>
  );
}
