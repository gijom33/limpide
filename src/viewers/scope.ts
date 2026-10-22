import { cssVar, prepareCanvas } from './canvas';
import { cycleLockOffset } from './cycleLock';

/** A Scope of one Tap, Cycle Locked to the Note's fundamental so a steady Note stands still. */
export function createScope(canvas: HTMLCanvasElement, analyser: AnalyserNode, fundamental: () => number) {
  const samples = new Float32Array(analyser.fftSize);
  const shown = Math.floor(samples.length / 4);
  const sampleRate = analyser.context.sampleRate;

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

    // Lock within the part of the buffer that leaves room for the whole trace after it.
    const start = cycleLockOffset(samples.subarray(0, samples.length - shown), sampleRate, fundamental());
    const at = (t: number) => {
      const i = Math.floor(t);
      return samples[i] + (samples[i + 1] - samples[i]) * (t - i);
    };

    g.strokeStyle = cssVar(canvas, '--trace');
    g.lineWidth = 1.5;
    g.beginPath();
    for (let i = 0; i < shown; i++) {
      const x = (i / (shown - 1)) * width;
      const y = height / 2 - at(start + i) * (height / 2) * 0.9;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  };
}
