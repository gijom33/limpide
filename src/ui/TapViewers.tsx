import { useEffect, useRef } from 'react';
import { createLevelMeter } from '../viewers/level';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createScope } from '../viewers/scope';
import { createSpectrum } from '../viewers/spectrum';

interface Props {
  name: string;
  analyser: AnalyserNode;
  sampleRate: number;
}

/** Scope + Spectrum + level readout for one Tap. Canvases are mounted once and drawn by the render loop. */
export function TapViewers({ name, analyser, sampleRate }: Props) {
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const drawScope = createScope(scopeRef.current!, analyser);
    const drawSpectrum = createSpectrum(spectrumRef.current!, analyser, sampleRate);
    const level = createLevelMeter(analyser);
    return addToRenderLoop(() => {
      drawScope();
      drawSpectrum();
      const db = level();
      levelRef.current!.textContent = Number.isFinite(db) ? `${db.toFixed(1)} dB` : '−∞ dB';
      levelRef.current!.dataset.db = String(db);
    });
  }, [analyser, sampleRate]);

  return (
    <figure className="tap" data-tap={name}>
      <figcaption>
        {name} Tap <span className="level" data-testid={`${name.toLowerCase()}-level`} ref={levelRef} />
      </figcaption>
      <canvas className="scope" ref={scopeRef} aria-label={`${name} Scope`} />
      <canvas className="spectrum" ref={spectrumRef} aria-label={`${name} Spectrum`} />
    </figure>
  );
}
