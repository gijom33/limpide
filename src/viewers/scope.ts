import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { cssVar, prepareCanvas } from './canvas';
import { cycleLockOffset } from './cycleLock';
import { createFreezeLatch } from './freezeLatch';
import { scopeTrace } from './scopeTrace';
import { scopeWindow } from './scopeWindow';
import type { ViewSettings } from './viewSettings';

const FULL_SCALE = 1;
const OVER_HOLD_MS = 1000;
// Two drawn points per pixel keeps sharp corners (a saw's drop, a pulse's edges) crisp.
const POINTS_PER_PIXEL = 2;

/**
 * A Scope of one Tap, Cycle Locked to the Note's fundamental so a steady Note stands still.
 * Every Scope shares the same fixed ±1 scale, so heights compare directly from stage to stage.
 */
export function createScope(canvas: HTMLCanvasElement, analyser: AnalyserNode, fundamental: () => number, view: () => ViewSettings) {
  const samples = new Float32Array(analyser.fftSize);
  const sampleRate = analyser.context.sampleRate;
  // While frozen, lock to the Note the frozen samples belong to, not to a Note played since.
  const frozenFundamental = createFreezeLatch<number>();
  let overAt = -Infinity;
  let snapshotToken: number | null = null;
  let snapshotTrace: Float32Array | null = null;

  return function draw() {
    if (!view().viewer.frozen) analyser.getFloatTimeDomainData(samples);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);

    const f = frozenFundamental(view().viewer.frozen, fundamental);
    const { length: windowLength } = scopeWindow(samples.length, sampleRate, f, view().cycles);
    const shown = Math.max(2, Math.floor(windowLength));
    // Lock within the part of the buffer that leaves room for the whole trace after it.
    const start = cycleLockOffset(samples.subarray(0, samples.length - shown - 1), sampleRate, f);
    const trace = scopeTrace(samples, start, shown, Math.max(2, Math.min(shown, Math.ceil(width * POINTS_PER_PIXEL))));

    // Snapshot: keep the Cycle Locked trace from the moment it was taken. Drawn across the same width, it
    // compares the shape per cycle even if a different Note is playing now.
    const { snapshot } = view().viewer;
    if (snapshot !== snapshotToken) {
      snapshotToken = snapshot;
      snapshotTrace = snapshot === null ? null : trace;
    }
    canvas.dataset.snapshot = String(snapshotTrace !== null);

    let peak = 0;
    for (const v of trace) peak = Math.max(peak, Math.abs(v));
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

    const stroke = (values: Float32Array) => {
      g.beginPath();
      values.forEach((v, i) => {
        const x = (i / (values.length - 1)) * width;
        if (i === 0) g.moveTo(x, yOf(v));
        else g.lineTo(x, yOf(v));
      });
      g.stroke();
    };

    if (snapshotTrace) {
      g.globalAlpha = 0.4;
      g.strokeStyle = cssVar(canvas, '--text');
      g.lineWidth = 1;
      stroke(snapshotTrace);
      g.globalAlpha = 1;
    }

    // Shade between the trace and zero, like the Spectrums' fill: the waveform's positive and negative halves.
    const colour = cssVar(canvas, '--trace');
    g.fillStyle = colour;
    g.globalAlpha = 0.16;
    g.beginPath();
    g.moveTo(0, yOf(0));
    trace.forEach((v, i) => g.lineTo((i / (trace.length - 1)) * width, yOf(v)));
    g.lineTo(width, yOf(0));
    g.closePath();
    g.fill();
    g.globalAlpha = 1;

    g.strokeStyle = colour;
    g.lineWidth = 1.5;
    stroke(trace);
  };
}
