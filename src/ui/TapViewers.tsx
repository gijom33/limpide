import { useEffect, useRef } from 'react';
import { createLevelMeter } from '../viewers/level';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createScope } from '../viewers/scope';
import { createSpectrum } from '../viewers/spectrum';
import type { ViewSettings } from '../viewers/viewSettings';
import { Tooltip, type TipContent } from './Tooltip';

const SILENT_DB = -90;

interface Props {
  name: string;
  analyser: AnalyserNode;
  sampleRate: number;
  fundamental(): number;
  view(): ViewSettings;
  /** Draw the Ideal Reference rings on this Tap's Spectrum. */
  showIdeal?: boolean;
  /** The Filter's gain: drawn as the Response Curve and applied to the Ideal rings. */
  response?(frequencies: Float32Array<ArrayBuffer>): Float32Array;
  /** What this Tap is, shown as the caption's tooltip rather than as text on screen. */
  tip?: TipContent;
}

/** Scope + Spectrum + level readout for one Tap. Canvases are mounted once and drawn by the render loop. */
export function TapViewers({ name, analyser, sampleRate, fundamental, view, showIdeal, response, tip }: Props) {
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef<HTMLSpanElement>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const drawScope = createScope(scopeRef.current!, analyser, fundamental, view);
    const drawSpectrum = createSpectrum(spectrumRef.current!, analyser, sampleRate, {
      fundamental,
      view,
      showIdeal,
      response,
      hover: () => hoverRef.current,
    });
    const level = createLevelMeter(analyser, () => view().viewer.frozen);
    return addToRenderLoop(() => {
      drawScope();
      drawSpectrum();
      const db = level();
      levelRef.current!.textContent = db > SILENT_DB ? `${db.toFixed(1)} dB` : 'silent';
      levelRef.current!.dataset.db = String(db);
    });
  }, [analyser, sampleRate, fundamental, view, showIdeal, response]);

  return (
    <figure className="tap" data-tap={name}>
      <figcaption>
        {tip ? (
          <Tooltip content={tip}>
            <span className="has-tip">{name} Tap</span>
          </Tooltip>
        ) : (
          `${name} Tap`
        )}{' '}
        <span className="level" data-testid={`${name.toLowerCase()}-level`} ref={levelRef} />
      </figcaption>
      <div className="tap-canvases">
        <canvas className="scope" ref={scopeRef} aria-label={`${name} Scope`} />
        <canvas
          className="spectrum"
          ref={spectrumRef}
          aria-label={`${name} Spectrum`}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            hoverRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
          }}
          onPointerLeave={() => (hoverRef.current = null)}
        />
      </div>
    </figure>
  );
}
