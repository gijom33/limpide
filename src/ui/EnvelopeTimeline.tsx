import { type ReactNode, useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { TARGETS } from '../modulation/lfoTargets';
import type { LfoDestination, Patch } from '../patch/patch';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createTimeline, type LinePattern, linePattern, timelineShows } from '../viewers/timeline';
import type { ViewSettings } from '../viewers/viewSettings';
import { Tooltip } from './Tooltip';
import { TIPS } from './tips';

type Entry = readonly [mark: string, name: string, tip: { title: string; body: string }, stage?: string, pattern?: LinePattern];
const COLOUR = { osc: 'Green', filter: 'Orange', amp: 'Violet' } as const;

/** An LFO line's key entry: what it moves, in its stage's colour. */
const lfoEntry = (patch: Patch, d: LfoDestination): Entry => {
  const { name, stage } = TARGETS[d];
  const tip =
    d === 'pitch'
      ? { title: name, body: `${COLOUR[stage]} broken line: the pitch as the LFO moves it (vibrato), a semitone up at the top and down at the bottom. The faint dashed middle line is the Note’s own pitch.` }
      : {
          title: name,
          body: `${COLOUR[stage]} broken line: the ${name} as the LFO moves it (both LFOs added together when both aim at it), on its knob’s scale, bottom to top. The faint dashed line is the knob’s own setting.`,
        };
  return [`lfo-${d}`, name, tip, stage, linePattern(patch, d)];
};

/**
 * The key: what the Timeline draws with this Patch (`timelineShows`), in the owner's order (2026-10-28): what LFO 1
 * moves, then what LFO 2 moves, then the Cutoff and the Filter Envelope, last the Amp Envelope. An LFO on the Cutoff
 * shows as the Cutoff. With no Filter Envelope and no LFO, the Amp Envelope alone.
 */
function key(patch: Patch): Entry[] {
  const shows = timelineShows(patch);
  return [
    ...shows.targets.map((d) => lfoEntry(patch, d)),
    ...(shows.cutoff ? [['cutoff', 'Cutoff', TIPS.timelineCutoff, 'filter', 'dots'] as const] : []),
    ...(shows.filterEnvelope ? [['filterEnvelope', 'Filter Envelope', TIPS.timelineFilterEnvelope] as const] : []),
    ['amp', 'Amp Envelope', TIPS.timelineAmp],
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
        {key(patch).map(([mark, name, tip, stage, pattern]) => (
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
