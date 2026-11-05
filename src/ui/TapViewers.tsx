import { useEffect, useRef } from 'react';
import type { GeekNote } from '../music/geek';
import { GLOW_MS } from '../viewers/glow';
import { createLevelMeter } from '../viewers/level';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createSilence } from '../viewers/rest';
import { createScope } from '../viewers/scope';
import { createSpectrum } from '../viewers/spectrum';
import type { ViewSettings } from '../viewers/viewSettings';
import { Tooltip } from './Tooltip';
import { VIEWER_TIPS } from './tips';

interface Props {
  name: keyof typeof VIEWER_TIPS;
  analyser: AnalyserNode;
  sampleRate: number;
  fundamental(): number;
  /** The pitch the engine plays at an audio clock time, which the Scope's Cycle Lock follows (issue 180). */
  fundamentalAt(time: number): number;
  /** The audio clock. */
  now(): number;
  /** Whether the page has paused the sound (issue 216): the Tap then holds its last picture, which may rest. */
  paused(): boolean;
  view(): ViewSettings;
  /** Draw the Ideal Reference rings on this Tap's Spectrum. */
  showIdeal?: boolean;
  /** Whether the newest Note's Gate is on, for the Ideal (issue 98). */
  gateOn?(): boolean;
  /** The Filter's gain: drawn as the Response Curve and applied to the Ideal marks. */
  response?(frequencies: Float32Array<ArrayBuffer>): Float32Array;
  /** Whether the safety limiter is bending the sound: given for the Amp Tap, shown as LIMITING. */
  limiting?(): boolean;
  /** The newest Note played (null before any): the Scope's period says A4 until one is (issue 170). */
  newestNote?(): GeekNote;
  /** The Noise's slope while it is up, for the Oscillator Spectrum's corner with the Synth Geek Layer on (issue 170). */
  noiseSlope?: string;
}

/**
 * Scope + Spectrum for one Tap, with no caption: the stage's panel says which it is. Canvases are mounted once and
 * drawn by the render loop. The level is measured but not shown; the Scope carries it as `data-db` (for tests).
 */
export function TapViewers({ name, analyser, sampleRate, fundamental, fundamentalAt, now, paused, view, showIdeal, gateOn, response, limiting, newestNote, noiseSlope }: Props) {
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  // Read by the render loop each frame, so a Patch change needs no new Viewers.
  const noiseSlopeRef = useRef(noiseSlope);
  useEffect(() => {
    noiseSlopeRef.current = noiseSlope;
  }, [noiseSlope]);

  useEffect(() => {
    const drawScope = createScope(scopeRef.current!, analyser, view, { fundamental, fundamentalAt, now, limiting, newestNote });
    const drawSpectrum = createSpectrum(spectrumRef.current!, analyser, sampleRate, {
      fundamental,
      view,
      showIdeal,
      gateOn,
      response,
      hover: () => hoverRef.current,
      noiseSlope: () => noiseSlopeRef.current,
    });
    const level = createLevelMeter(analyser, () => view().viewer.frozen);
    const silence = createSilence();
    let glow = view().glow;
    return addToRenderLoop(() => {
      const { db, silent } = level();
      // Silent for as long as the Glow keeps a trace: then the Scope and Spectrum may rest (issue 214). The Glow
      // switched on or off starts the wait again, as its traces of the silence fill or empty over that time. A Tap the
      // page's pause holds still (issue 216) rests the same way, on its last picture.
      const glowSame = view().glow === glow;
      glow = view().glow;
      const settled = silence((silent || paused()) && glowSame, performance.now()) > GLOW_MS;
      drawScope(settled);
      drawSpectrum(settled);
      // Written once every draw of the frame has read the page (issue 221).
      return () => {
        if (scopeRef.current!.dataset.db !== String(db)) scopeRef.current!.dataset.db = String(db);
      };
    });
  }, [analyser, sampleRate, fundamental, fundamentalAt, now, paused, view, showIdeal, gateOn, response, limiting, newestNote]);

  return (
    <figure className="tap" data-tap={name} aria-label={`${name} Tap`}>
      <div className="tap-canvases">
        <Tooltip content={VIEWER_TIPS[name].scope}>
          <canvas className="scope" ref={scopeRef} role="img" aria-label={`${name} Scope`} />
        </Tooltip>
        <Tooltip content={VIEWER_TIPS[name].spectrum}>
        <canvas
          className="spectrum"
          ref={spectrumRef}
          role="img"
          aria-label={`${name} Spectrum`}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            hoverRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
          }}
          onPointerLeave={() => (hoverRef.current = null)}
        />
        </Tooltip>
      </div>
    </figure>
  );
}
