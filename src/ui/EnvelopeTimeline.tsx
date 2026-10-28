import { type ReactNode, useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createTimeline } from '../viewers/timeline';
import type { ViewSettings } from '../viewers/viewSettings';
import { Tooltip } from './Tooltip';
import { TIPS } from './tips';

// In the signal chain's order, each Envelope beside what it moves: the Filter's, then the Amp's.
const KEY = [
  ['filterEnvelope', 'Filter Envelope', TIPS.timelineFilterEnvelope],
  ['cutoff', 'Cutoff', TIPS.timelineCutoff],
  ['amp', 'Amp Envelope', TIPS.timelineAmp],
  ['volume', 'Volume', TIPS.timelineVolume],
] as const;

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
      {/* The key sits on the title line, over the plot it explains. Each entry is a named image in the Tab order, so its
          tooltip comes on focus and is its description for screen readers (issue 67). */}
      <span className="timeline-key">
        {KEY.map(([mark, name, tip]) => (
          <Tooltip key={mark} content={tip}>
            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusable so a keyboard reaches its explanation */}
            <span data-mark={mark} role="img" aria-label={name} tabIndex={0}>
              {name}
            </span>
          </Tooltip>
        ))}
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
