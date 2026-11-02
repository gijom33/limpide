import { type ReactNode, useEffect, useRef } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import type { LfoDestination, Patch } from '../patch/patch';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createTimeline, type KeyEntry, timelineKey } from '../viewers/timeline';
import type { ViewSettings } from '../viewers/viewSettings';
import { Forms, useOneLine } from './oneLine';
import { type TipContent, Tooltip } from './Tooltip';
import { lfoLineTip, TIPS } from './tips';

/** A key entry's tooltip. */
const tipOf = ({ mark, destination, pressed }: KeyEntry): TipContent =>
  destination ? lfoLineTip(destination, pressed) : mark === 'cutoff' ? TIPS.timelineCutoff : mark === 'filterEnvelope' ? TIPS.timelineFilterEnvelope : TIPS.timelineAmp;

/** The LFO & Envelopes section, under the signal chain: the LFO beside the Envelope Timeline, in the modulation colour. */
export function EnvelopeTimeline({
  engine, view, patch, pressed, controls,
}: {
  engine: SynthEngine;
  view(): ViewSettings;
  patch: Patch;
  /** The Destination aftertouch moves, once a keyboard has sent it (issue 132): its line is drawn too. */
  pressed: LfoDestination | null;
  controls?: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pressedRef = useRef(pressed);
  pressedRef.current = pressed;
  useEffect(() => addToRenderLoop(createTimeline(canvasRef.current!, engine, view, () => pressedRef.current)), [engine, view]);
  const key = timelineKey(patch, pressed);
  // One line, its names shorter where the room runs short (issue 156).
  const keyRef = useOneLine<HTMLSpanElement>(key.map((e) => e.name).join(' · '));

  return (
    <section className="timeline" aria-label="LFO & Envelopes">
      <h2>
        <Tooltip content={TIPS.timeline}>
          <span className="has-tip">LFO &amp; Envelopes</span>
        </Tooltip>
      </h2>
      {/* The key sits on the title line, over the plot it explains. Each entry is a named image in the Tab order, so its
          tooltip comes on focus and is its description for screen readers (issue 67). */}
      <span className="timeline-key" ref={keyRef} data-one-line>
        {key.map((entry) => {
          const { mark, name, stage, pattern } = entry;
          return (
            <Tooltip key={mark} content={tipOf(entry)}>
              {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusable so a keyboard reaches its explanation */}
              <span data-mark={mark} data-stage={stage} data-pattern={pattern} role="img" aria-label={name} tabIndex={0}>
                {/* Short on screen (the owner, 2026-10-28), shorter still where the key's room runs out (issue 156); whole
                    for a screen reader, which reads the name, and in its tooltip. */}
                <Forms name={name} />
              </span>
            </Tooltip>
          );
        })}
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
