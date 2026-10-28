import { type ReactNode, useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { DESTINATIONS } from '../modulation/destinations';
import type { Patch } from '../patch/patch';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createTimeline, type LinePattern, linePattern, timelineShows } from '../viewers/timeline';
import type { ViewSettings } from '../viewers/viewSettings';
import { type TipContent, Tooltip } from './Tooltip';
import { lfoLineTip, TIPS } from './tips';

/** A key entry: what it names, its tip, and for a moved Parameter its line's stage colour and pattern. */
interface Entry {
  mark: string;
  name: string;
  tip: TipContent;
  stage?: string;
  pattern?: LinePattern;
}

/**
 * The key: what the Timeline draws with this Patch (`timelineShows`), in the owner's order (2026-10-28): what LFO 1
 * moves, then what LFO 2 moves, then the Cutoff and the Filter Envelope, last the Amp Envelope. An LFO on the Cutoff
 * shows as the Cutoff. With no Filter Envelope and no LFO, the Amp Envelope alone.
 */
function key(patch: Patch): Entry[] {
  const shows = timelineShows(patch);
  return [
    ...shows.destinations.map((d) => ({ mark: `lfo-${d}`, name: DESTINATIONS[d].label, tip: lfoLineTip(d), stage: DESTINATIONS[d].stage, pattern: linePattern(patch, d) })),
    ...(shows.cutoff ? [{ mark: 'cutoff', name: 'Cutoff', tip: TIPS.timelineCutoff, stage: 'filter', pattern: 'dots' as const }] : []),
    ...(shows.filterEnvelope ? [{ mark: 'filterEnvelope', name: 'Filter Envelope', tip: TIPS.timelineFilterEnvelope }] : []),
    { mark: 'amp', name: 'Amp Envelope', tip: TIPS.timelineAmp },
  ];
}

/** The LFO & Envelopes section, under the signal chain: the LFO beside the Envelope Timeline, in the modulation colour. */
export function EnvelopeTimeline({ engine, view, patch, controls }: { engine: SynthEngine; view(): ViewSettings; patch: Patch; controls?: ReactNode }) {
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
        {key(patch).map(({ mark, name, tip, stage, pattern }) => (
          <Tooltip key={mark} content={tip}>
            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusable so a keyboard reaches its explanation */}
            <span data-mark={mark} data-stage={stage} data-pattern={pattern} role="img" aria-label={name} tabIndex={0}>
              {/* Short on screen (the owner, 2026-10-28), whole for a screen reader, which reads the name. */}
              {name.replace(/ Envelope$/, ' Env')}
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
