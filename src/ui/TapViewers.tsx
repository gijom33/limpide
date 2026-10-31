import { Fragment, useEffect, useRef } from 'react';
import type { Formula } from '../music/maths';
import { createLevelMeter } from '../viewers/level';
import { addToRenderLoop } from '../viewers/renderLoop';
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
  view(): ViewSettings;
  /** Draw the Ideal Reference rings on this Tap's Spectrum. */
  showIdeal?: boolean;
  /** The Filter's gain: drawn as the Response Curve and applied to the Ideal marks. */
  response?(frequencies: Float32Array<ArrayBuffer>): Float32Array;
  /** Whether the safety limiter is bending the sound: given for the Amp Tap, shown as LIMITING. */
  limiting?(): boolean;
  /** The Maths Layer's formulas for this Tap's Spectrum, when the layer is on: each with what its letters mean. */
  formulas?: Formula[];
}

/**
 * Scope + Spectrum for one Tap, with no caption: the stage's panel says which it is. Canvases are mounted once and
 * drawn by the render loop. The level is measured but not shown; the Scope carries it as `data-db` (for tests).
 */
export function TapViewers({ name, analyser, sampleRate, fundamental, view, showIdeal, response, limiting, formulas }: Props) {
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
        {formulas && (
          <p className="maths-formula" role="note" aria-label={`${name} formula`}>
            {formulas.map((f) => (
              <Fragment key={f.formula}>
                <span>{f.formula}</span>
                <span className="maths-where">{f.where}</span>
              </Fragment>
            ))}
          </p>
        )}
      </div>
    </figure>
  );
}
