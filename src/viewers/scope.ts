import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { cssVar, prepareCanvas } from './canvas';
import { cycleLockOffset } from './cycleLock';
import { scopeWindow } from './scopeWindow';
import type { ViewSettings } from './viewSettings';

const FULL_SCALE = 1;
const OVER_HOLD_MS = 1000;

/**
 * A Scope of one Tap, Cycle Locked to the Note's fundamental so a steady Note stands still.
 * Every Scope shares the same fixed ±1 scale, so heights compare directly from stage to stage.
 */
export function createScope(canvas: HTMLCanvasElement, analyser: AnalyserNode, fundamental: () => number, view: () => ViewSettings) {
  const samples = new Float32Array(analyser.fftSize);
  const sampleRate = analyser.context.sampleRate;
  let overAt = -Infinity;

  return function draw() {
    analyser.getFloatTimeDomainData(samples);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);

    const f = fundamental();
    const { length: windowLength } = scopeWindow(samples.length, sampleRate, f, view().cycles);
    const shown = Math.max(2, Math.floor(windowLength));
    // Lock within the part of the buffer that leaves room for the whole trace after it.
    const start = cycleLockOffset(samples.subarray(0, samples.length - shown - 1), sampleRate, f);
    const at = (t: number) => {
      const i = Math.floor(t);
      return samples[i] + (samples[i + 1] - samples[i]) * (t - i);
    };

    let peak = 0;
    for (let i = 0; i < shown; i++) peak = Math.max(peak, Math.abs(at(start + i)));
    const now = performance.now();
    if (peak > FULL_SCALE) overAt = now;
    const over = now - overAt < OVER_HOLD_MS;
    const yOf = (v: number) => height / 2 - Math.max(-FULL_SCALE, Math.min(FULL_SCALE, v)) * (height / 2) * 0.92;

    g.strokeStyle = cssVar(canvas, '--grid');
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, height / 2);
    g.lineTo(width, height / 2);
    g.stroke();

    // Guides at the Oscillator's level, on every Scope: inside them the Filter only removed energy;
    // beyond them Resonance added a peak.
    if (view().overlays.guides) {
      g.setLineDash([4, 4]);
      g.strokeStyle = cssVar(canvas, '--muted');
      g.beginPath();
      for (const v of [OSCILLATOR_LEVEL, -OSCILLATOR_LEVEL]) {
        g.moveTo(0, yOf(v));
        g.lineTo(width, yOf(v));
      }
      g.stroke();
      g.setLineDash([]);
    }
    g.font = '10px system-ui, sans-serif';

    if (over) {
      g.fillStyle = cssVar(canvas, '--danger');
      g.textAlign = 'right';
      g.fillText('OVER ±1', width - 4, 12);
      g.textAlign = 'left';
    }
    canvas.dataset.over = String(over);

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
