import { useEffect, useRef } from 'react';
import { createLevelMeter } from '../viewers/level';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createScope } from '../viewers/scope';
import { createSpectrum } from '../viewers/spectrum';
import type { ViewSettings } from '../viewers/viewSettings';

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
  /** Whether the safety limiter is bending the sound: given for the Amp Tap, shown as LIMITING. */
  limiting?(): boolean;
}

/**
 * Scope + Spectrum for one Tap, with no caption: the stage's panel says which it is. Canvases are mounted once and
 * drawn by the render loop. The level is measured but not shown; the Scope carries it as `data-db` (for tests).
 */
export function TapViewers({ name, analyser, sampleRate, fundamental, view, showIdeal, response, limiting }: Props) {
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const drawScope = createScope(scopeRef.current!, analyser, fundamental, view, { limiting });
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
      scopeRef.current!.dataset.db = String(level());
    });
  }, [analyser, sampleRate, fundamental, view, showIdeal, response, limiting]);

  return (
    <figure className="tap" data-tap={name} aria-label={`${name} Tap`}>
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
