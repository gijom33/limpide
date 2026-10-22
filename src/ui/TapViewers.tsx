import { useEffect, useRef } from 'react';
import { createLevelMeter } from '../viewers/level';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createScope } from '../viewers/scope';
import { createSpectrum } from '../viewers/spectrum';
import type { ViewSettings } from '../viewers/viewSettings';

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
  /** The Tap before the Filter, for the Ghost. */
  ghostOf?: AnalyserNode;
  /** Shown over the Viewers while this Tap is silent. */
  idleHint?: string;
  /** An explanation, shown as the caption's tooltip rather than as text on screen. */
  note?: string;
}

/** Scope + Spectrum + level readout for one Tap. Canvases are mounted once and drawn by the render loop. */
export function TapViewers({ name, analyser, sampleRate, fundamental, view, showIdeal, response, ghostOf, idleHint, note }: Props) {
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const drawScope = createScope(scopeRef.current!, analyser, fundamental, view);
    const drawSpectrum = createSpectrum(spectrumRef.current!, analyser, sampleRate, {
      fundamental,
      view,
      showIdeal,
      response,
      ghostOf,
    });
    const level = createLevelMeter(analyser);
    return addToRenderLoop(() => {
      drawScope();
      drawSpectrum();
      const db = level();
      levelRef.current!.textContent = db > SILENT_DB ? `${db.toFixed(1)} dB` : 'silent';
      levelRef.current!.dataset.db = String(db);
      if (hintRef.current) hintRef.current.hidden = db > SILENT_DB;
    });
  }, [analyser, sampleRate, fundamental, view, showIdeal, response, ghostOf]);

  return (
    <figure className="tap" data-tap={name}>
      <figcaption title={note}>
        {name} Tap <span className="level" data-testid={`${name.toLowerCase()}-level`} ref={levelRef} />
      </figcaption>
      <div className="tap-canvases">
        <canvas className="scope" ref={scopeRef} aria-label={`${name} Scope`} />
        <canvas className="spectrum" ref={spectrumRef} aria-label={`${name} Spectrum`} />
        {idleHint && (
          <div className="idle-hint" ref={hintRef}>
            {idleHint}
          </div>
        )}
      </div>
    </figure>
  );
}
