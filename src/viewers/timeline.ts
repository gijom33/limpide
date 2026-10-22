import type { Modulation } from '../engine/synthEngine';
import { cssVar, prepareCanvas } from './canvas';
import { passBand } from '../modulation/passBand';
import { createFreezeLatch } from './freezeLatch';
import type { ViewSettings } from './viewSettings';

const WINDOW_SECONDS = 4;
const F_MIN = 20;
const F_MAX = 20000;

interface Source {
  modulationAt(time: number): Modulation;
  now(): number;
  /** The Cutoff knob's own setting at a moment, drawn faintly so the Envelope's push away from it shows. */
  baseCutoffAt(time: number): number;
}

/**
 * The Envelope Timeline: the last few seconds of the Amp Envelope and the Effective Cutoff (log Hz on the
 * right; its area is the pass band), computed from the Modulation model for past moments. "Now" is the right edge.
 */
export function createTimeline(canvas: HTMLCanvasElement, source: Source, view: () => ViewSettings) {
  const frozenNow = createFreezeLatch<number>();

  return function draw() {
    const now = frozenNow(view().viewer.frozen, source.now);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);
    const pad = 4;
    const plot = height - 2 * pad - 12; // room for the time labels underneath
    const timeAt = (x: number) => now - WINDOW_SECONDS + (x / width) * WINDOW_SECONDS;
    const yLevel = (level: number) => pad + (1 - level) * plot;
    const yHz = (hz: number) => pad + (1 - Math.log(hz / F_MIN) / Math.log(F_MAX / F_MIN)) * plot;

    const muted = cssVar(canvas, '--muted');
    g.font = '10px system-ui, sans-serif';
    g.strokeStyle = cssVar(canvas, '--grid');
    g.fillStyle = muted;
    g.lineWidth = 1;
    for (let s = 0; s <= WINDOW_SECONDS; s++) {
      const x = (s / WINDOW_SECONDS) * width;
      g.beginPath();
      g.moveTo(x, pad);
      g.lineTo(x, pad + plot);
      g.stroke();
      const label = s === WINDOW_SECONDS ? 'now' : `−${WINDOW_SECONDS - s} s`;
      g.textAlign = s === 0 ? 'left' : s === WINDOW_SECONDS ? 'right' : 'center';
      g.fillText(label, x, height - 3);
    }
    g.textAlign = 'right';
    for (const hz of [100, 1000, 10000]) g.fillText(hz >= 1000 ? `${hz / 1000}k` : `${hz}`, width - 3, yHz(hz) - 2);
    g.textAlign = 'left';

    const columns = Math.ceil(width);
    const samples = Array.from({ length: columns }, (_, x) => source.modulationAt(timeAt(x + 0.5)));

    // The pass band as an area: the frequencies the Filter lets through at each moment (below the Cutoff for
    // low-pass, above for high-pass, a band for band-pass, all but a band for notch). Fainter than the Amp area.
    g.fillStyle = cssVar(canvas, '--stage-filter');
    g.globalAlpha = 0.14;
    samples.forEach((m, x) => {
      for (const [lo, hi] of passBand(m.mode, m.cutoff, m.bandwidth, { min: F_MIN, max: F_MAX })) {
        g.fillRect(x, yHz(hi), 1, yHz(lo) - yHz(hi));
      }
    });
    g.globalAlpha = 1;

    // The Cutoff knob's setting (dashed), then the Effective Cutoff the Filter Envelope makes of it.
    g.strokeStyle = cssVar(canvas, '--stage-filter');
    g.globalAlpha = 0.5;
    g.lineWidth = 1;
    g.setLineDash([4, 4]);
    g.beginPath();
    for (let x = 0; x < columns; x++) {
      const y = yHz(source.baseCutoffAt(timeAt(x + 0.5)));
      if (x) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
    g.lineWidth = 1.75;
    g.beginPath();
    samples.forEach((m, x) => (x ? g.lineTo(x, yHz(m.cutoff)) : g.moveTo(x, yHz(m.cutoff))));
    g.stroke();

    // Amp Envelope: a filled area, read as "how loud".
    g.fillStyle = cssVar(canvas, '--stage-amp');
    g.globalAlpha = 0.25;
    g.beginPath();
    g.moveTo(0, yLevel(0));
    samples.forEach((m, x) => g.lineTo(x, yLevel(m.amp)));
    g.lineTo(columns, yLevel(0));
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = cssVar(canvas, '--stage-amp');
    g.lineWidth = 1.5;
    g.beginPath();
    samples.forEach((m, x) => (x ? g.lineTo(x, yLevel(m.amp)) : g.moveTo(x, yLevel(m.amp))));
    g.stroke();
  };
}
