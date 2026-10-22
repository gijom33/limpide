import { cssVar, prepareCanvas } from './canvas';

/** A Scope of one Tap. Starts the trace at a rising zero crossing so a steady Note mostly holds still. */
export function createScope(canvas: HTMLCanvasElement, analyser: AnalyserNode) {
  const samples = new Float32Array(analyser.fftSize);
  const shown = Math.floor(samples.length / 4);

  return function draw() {
    analyser.getFloatTimeDomainData(samples);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);

    g.strokeStyle = cssVar(canvas, '--grid');
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, height / 2);
    g.lineTo(width, height / 2);
    g.stroke();

    let start = 0;
    for (let i = 1; i < samples.length - shown; i++) {
      if (samples[i - 1] <= 0 && samples[i] > 0) {
        start = i;
        break;
      }
    }

    g.strokeStyle = cssVar(canvas, '--trace');
    g.lineWidth = 1.5;
    g.beginPath();
    for (let i = 0; i < shown; i++) {
      const x = (i / (shown - 1)) * width;
      const y = height / 2 - samples[start + i] * (height / 2) * 0.9;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  };
}
