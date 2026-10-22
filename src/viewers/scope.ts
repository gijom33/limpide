import { createAutoRange } from './autoRange';
import { cssVar, prepareCanvas } from './canvas';
import { cycleLockOffset } from './cycleLock';

/** A Scope of one Tap, Cycle Locked to the Note's fundamental so a steady Note stands still. */
export function createScope(canvas: HTMLCanvasElement, analyser: AnalyserNode, fundamental: () => number) {
  const samples = new Float32Array(analyser.fftSize);
  const shown = Math.floor(samples.length / 4);
  const sampleRate = analyser.context.sampleRate;
  const range = createAutoRange({ ranges: [1, 2, 4, 8], holdMs: 1000 });

  return function draw() {
    analyser.getFloatTimeDomainData(samples);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);

    // Lock within the part of the buffer that leaves room for the whole trace after it.
    const start = cycleLockOffset(samples.subarray(0, samples.length - shown), sampleRate, fundamental());
    const at = (t: number) => {
      const i = Math.floor(t);
      return samples[i] + (samples[i + 1] - samples[i]) * (t - i);
    };

    let peak = 0;
    for (let i = 0; i < shown; i++) peak = Math.max(peak, Math.abs(at(start + i)));
    const fullScale = range.update(peak, performance.now());
    const yOf = (v: number) => height / 2 - (Math.max(-fullScale, Math.min(fullScale, v)) / fullScale) * (height / 2) * 0.92;

    g.strokeStyle = cssVar(canvas, '--grid');
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, height / 2);
    g.lineTo(width, height / 2);
    g.stroke();

    // ±1 is the Oscillator's full level: when the range is wider, show where that sits.
    if (fullScale > 1) {
      g.setLineDash([4, 4]);
      g.strokeStyle = cssVar(canvas, '--muted');
      g.beginPath();
      for (const v of [1, -1]) {
        g.moveTo(0, yOf(v));
        g.lineTo(width, yOf(v));
      }
      g.stroke();
      g.setLineDash([]);
    }
    g.fillStyle = cssVar(canvas, '--muted');
    g.font = '10px system-ui, sans-serif';
    g.fillText(`±${fullScale}`, 4, 12);
    canvas.dataset.range = String(fullScale);

    g.strokeStyle = cssVar(canvas, '--trace');
    g.lineWidth = 1.5;
    g.beginPath();
    for (let i = 0; i < shown; i++) {
      const x = (i / (shown - 1)) * width;
      const y = yOf(at(start + i));
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  };
}
