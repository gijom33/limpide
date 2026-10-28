import type { Modulation } from '../engine/synthEngine';
import { formatParam } from '../patch/patch';
import { cssVar, curveWidth, haloText, prepareCanvas } from './canvas';
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
  /** The Filter Envelope's Amount at a moment: at zero it moves nothing, and is left out. */
  filterEnvAmountAt(time: number): number;
}

/**
 * The Envelope Timeline: the last few seconds of the Amp and Filter Envelopes (areas, 0–1 on a shared scale; the
 * Filter's only while its Amount moves the Cutoff) and the Effective Cutoff (a line, log Hz on the right), computed from the Modulation model for past moments. "Now" is
 * the right edge.
 */
export function createTimeline(canvas: HTMLCanvasElement, source: Source, view: () => ViewSettings) {
  const frozenNow = createFreezeLatch<number>();

  const DOT_RADIUS = 3.5;
  return function draw() {
    const now = frozenNow(view().viewer.frozen, source.now);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);
    const pad = 4;
    const plot = height - 2 * pad; // a grid line every second, unlabelled: "now" is the right edge
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
    }

    const columns = Math.ceil(width);
    const samples = Array.from({ length: columns }, (_, x) => source.modulationAt(timeAt(x + 0.5)));

    // An Envelope as a filled area with its outline, on the 0–1 level scale.
    const area = (colourVar: string, alpha: number, level: (m: Modulation) => number) => {
      const colour = cssVar(canvas, colourVar);
      g.fillStyle = colour;
      g.globalAlpha = alpha;
      g.beginPath();
      g.moveTo(0, yLevel(0));
      samples.forEach((m, x) => g.lineTo(x, yLevel(level(m))));
      g.lineTo(columns, yLevel(0));
      g.closePath();
      g.fill();
      g.globalAlpha = 1;
      g.strokeStyle = colour;
      g.lineWidth = curveWidth(canvas);
      g.beginPath();
      samples.forEach((m, x) => (x ? g.lineTo(x, yLevel(level(m))) : g.moveTo(x, yLevel(level(m)))));
      g.stroke();
    };

    // Filter Envelope: an area on the 0–1 level scale, the shape that (times Amount) pushes the Effective Cutoff.
    // Light fills, so where the two overlap they read no heavier than one Viewer's shading (16 %). Only while its
    // Amount moves the Cutoff (the owner, 2026-10-28): at zero the Envelope runs but changes nothing. Its key entry
    // shows and hides with it.
    const filterShown = source.filterEnvAmountAt(now) !== 0;
    if (filterShown) area('--stage-filter', 0.1, (m) => m.filter);
    canvas.dataset.filterEnvelope = (samples.at(-1)?.filter ?? 0).toFixed(3);
    const filterKey = canvas.closest('.timeline')?.querySelector<HTMLElement>('[data-mark="filterEnvelope"]');
    if (filterKey && filterKey.hidden === filterShown) filterKey.hidden = !filterShown;
    const latest = samples.at(-1);
    canvas.dataset.ampLevel = (latest?.amp ?? 0).toFixed(3);

    // Amp Envelope, drawn over it: the one the ear follows first. The Envelope alone: an LFO on Volume (tremolo)
    // leaves it still (the owner, 2026-10-28), its dip shown by the Volume knob's ring.
    area('--stage-amp', 0.1, (m) => m.amp);

    // The Cutoff knob's setting (dashed), then the Effective Cutoff the modulation makes of it.
    const line = (colourVar: string, y: (m: Modulation) => number, base: (time: number) => number) => {
      g.strokeStyle = cssVar(canvas, colourVar);
      g.globalAlpha = 0.5;
      g.lineWidth = 1;
      g.setLineDash([4, 4]);
      g.beginPath();
      for (let x = 0; x < columns; x++) {
        const yBase = base(timeAt(x + 0.5));
        if (x) g.lineTo(x, yBase);
        else g.moveTo(x, yBase);
      }
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 1;
      g.lineWidth = curveWidth(canvas);
      g.beginPath();
      samples.forEach((m, x) => (x ? g.lineTo(x, y(m)) : g.moveTo(x, y(m))));
      g.stroke();
    };
    line('--cutoff-line', (m) => yHz(m.cutoff), (time) => yHz(source.baseCutoffAt(time)));

    // "Now" on each line, as on the LFO's plot: a dot in its colour, ringed in the background so lines crossing
    // there stay apart.
    const last = samples.at(-1);
    if (!last) return;
    const background = cssVar(canvas, '--bg');
    const dot = (colourVar: string, y: number) => {
      g.beginPath();
      g.arc(columns - DOT_RADIUS - 1, y, DOT_RADIUS, 0, 2 * Math.PI);
      g.fillStyle = cssVar(canvas, colourVar);
      g.fill();
      g.lineWidth = 1.5;
      g.strokeStyle = background;
      g.stroke();
    };
    if (filterShown) dot('--stage-filter', yLevel(last.filter));
    dot('--stage-amp', yLevel(last.amp));
    dot('--cutoff-line', yHz(last.cutoff));

    // The Cutoff scale's labels over the traces, each on a halo of the background, so the Cutoff line never strikes
    // through them (issue 47).
    g.font = '10px system-ui, sans-serif';
    g.fillStyle = cssVar(canvas, '--muted');
    g.textAlign = 'right';
    for (const hz of [100, 1000, 10000]) haloText(g, hz >= 1000 ? `${hz / 1000}k` : `${hz}`, width - 3, yHz(hz) - 2, background);
    g.textAlign = 'left';

    // The Maths Layer: the Effective Cutoff's value now, beside its dot, on a chip of the background.
    const maths = view().overlays.maths;
    canvas.dataset.cutoffReadout = maths ? formatParam('cutoff', last.cutoff) : '';
    if (maths) {
      const text = formatParam('cutoff', last.cutoff);
      g.font = '11px system-ui, sans-serif';
      const w = g.measureText(text).width + 8;
      const y = Math.min(Math.max(yHz(last.cutoff), pad + 9), pad + plot - 9);
      const x = columns - 2 * DOT_RADIUS - 6 - w;
      g.fillStyle = background;
      g.globalAlpha = 0.85;
      g.fillRect(x, y - 8, w, 16);
      g.globalAlpha = 1;
      g.fillStyle = cssVar(canvas, '--cutoff-line');
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(text, x + 4, y);
      g.textBaseline = 'alphabetic';
    }
  };
}
