import type { Modulation } from '../engine/synthEngine';
import { DESTINATIONS, destinationLevel, knobLevel, lfoDestinations } from '../modulation/destinations';
import { formatParam, type LfoDestination, type Patch } from '../patch/patch';
import { cssVar, curveWidth, haloText, prepareCanvas } from './canvas';
import { createFreezeLatch } from './freezeLatch';
import type { ViewSettings } from './viewSettings';

const F_MIN = 20;
const F_MAX = 20000;

interface Source {
  modulationAt(time: number): Modulation;
  now(): number;
  /** The Cutoff knob's own setting at a moment, drawn faintly so the Envelope's push away from it shows. */
  baseCutoffAt(time: number): number;
  /** The Patch in force at a moment: whether the Filter Envelope and the LFOs move anything, and what. */
  patchAt(time: number): Patch | undefined;
}

/**
 * What the Timeline draws with the Patch as it is (the owner, 2026-10-28, issue 63): the Amp Envelope always; the
 * Filter Envelope only while its Amount moves the Cutoff; the Cutoff only while the Filter Envelope or an LFO moves
 * it; and every other Destination an active LFO moves, once however many LFOs aim at it. The key shows the same.
 */
export function timelineShows(patch: Patch | undefined) {
  const moved = patch ? lfoDestinations(patch) : [];
  const filterEnvelope = !!patch && patch.filterEnvAmount !== 0;
  return { filterEnvelope, cutoff: filterEnvelope || moved.includes('cutoff'), destinations: moved.filter((d): d is LfoDestination => d !== 'cutoff') };
}

/**
 * Each moved Parameter's line, told apart by its pattern as well as its colour (the owner, 2026-10-28): the Cutoff
 * dots, what LFO 1 moves short dashes, what LFO 2 alone moves dash-dots. The key draws the same. The dots are drawn
 * with a thicker pen (`DOT_WIDTH`), so each reads as a round dot rather than a speck (the owner, 2026-10-28).
 */
export type LinePattern = 'dots' | 'dashes' | 'dashDot';
export const linePattern = (patch: Patch, moved: LfoDestination | 'cutoff'): LinePattern =>
  moved === 'cutoff' ? 'dots' : patch.lfoAmount > 0 && patch.lfoDestination === moved ? 'dashes' : 'dashDot';
const DASHES: Record<LinePattern, number[]> = { dots: [0.5, 5.5], dashes: [5, 3], dashDot: [7, 3, 0.5, 3] };
const DOT_WIDTH = 1.75; // times the curve's width

/**
 * The Envelope Timeline: the last few seconds of the Amp and Filter Envelopes (areas, 0–1 on a shared scale), the
 * Effective Cutoff (a line, log Hz on the right) and what the LFOs move (lines in their stage's colour, each on its
 * knob's own scale), computed from the Modulation model for past moments, each only while something moves it
 * (`timelineShows`). "Now" is the right edge.
 */
export function createTimeline(canvas: HTMLCanvasElement, source: Source, view: () => ViewSettings) {
  const frozenNow = createFreezeLatch<number>();
  /** Each broken line's last frame: its left edge's time, the length along it at each column, and how far its pattern had got. */
  const dashState = new Map<string, { left: number; lengths: number[]; travelled: number }>();

  const DOT_RADIUS = 3.5;
  return function draw() {
    const now = frozenNow(view().viewer.frozen, source.now);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);
    const pad = 4;
    const plot = height - 2 * pad; // a grid line every second, unlabelled: "now" is the right edge
    const seconds = view().timelineSeconds;
    canvas.dataset.seconds = String(seconds);
    const timeAt = (x: number) => now - seconds + (x / width) * seconds;
    const yLevel = (level: number) => pad + (1 - level) * plot;
    const yHz = (hz: number) => pad + (1 - Math.log(hz / F_MIN) / Math.log(F_MAX / F_MIN)) * plot;

    const muted = cssVar(canvas, '--muted');
    g.font = '10px system-ui, sans-serif';
    g.strokeStyle = cssVar(canvas, '--grid');
    g.fillStyle = muted;
    g.lineWidth = 1;
    for (let s = 0; s <= seconds; s++) {
      const x = (s / seconds) * width;
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
    // Amount moves the Cutoff: at zero the Envelope runs but changes nothing.
    const patchNow = source.patchAt(now);
    const shows = timelineShows(patchNow);
    canvas.dataset.shows = ['amp', ...(shows.filterEnvelope ? ['filterEnvelope'] : []), ...(shows.cutoff ? ['cutoff'] : []), ...shows.destinations].join(' ');
    if (shows.filterEnvelope) area('--stage-filter', 0.1, (m) => m.filter);
    canvas.dataset.filterEnvelope = (samples.at(-1)?.filter ?? 0).toFixed(3);
    const latest = samples.at(-1);
    canvas.dataset.ampLevel = (latest?.amp ?? 0).toFixed(3);

    // Amp Envelope, drawn over it: the one the ear follows first. The Envelope alone: an LFO on Volume (tremolo)
    // leaves it still (the owner, 2026-10-28): its dip is the Volume's own line, below.
    area('--stage-amp', 0.1, (m) => m.amp);

    // A broken line whose marks travel left with the curve and so hold still against it. Dashed from the left edge
    // alone, the marks were measured along the path from wherever the edge happened to be, which changes every frame,
    // so they crawled and blurred (the owner, 2026-10-28). The browser still measures them along the path (a vertical
    // edge is dashed like the rest), but each line starts its pattern where the previous frame's had got to at the
    // new left edge: the length of curve that scrolled off.
    const pixelsPerSecond = width / seconds;
    const dashed = (key: string, ys: number[], dashes: number[]) => {
      const lengths = [0];
      for (let x = 1; x < ys.length; x++) lengths.push(lengths[x - 1] + Math.hypot(1, ys[x] - ys[x - 1]));
      const left = timeAt(0);
      const before = dashState.get(key);
      const gone = before ? (left - before.left) * pixelsPerSecond : -1;
      let travelled = 0;
      if (before && gone >= 0 && gone < before.lengths.length - 1) {
        const i = Math.floor(gone);
        travelled = before.travelled + before.lengths[i] + (before.lengths[i + 1] - before.lengths[i]) * (gone - i);
      }
      dashState.set(key, { left, lengths, travelled });
      const period = dashes.reduce((sum, d) => sum + d, 0);
      g.setLineDash(dashes);
      g.lineDashOffset = travelled % period;
      g.beginPath();
      ys.forEach((y, x) => (x ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
    };

    // A Parameter the Filter Envelope or an LFO moves (the owner, 2026-10-28): its knob's setting faint and dashed,
    // then where it is now in its own pattern (`linePattern`), both in its stage's colour.
    const line = (name: string, colourVar: string, pattern: LinePattern, y: (m: Modulation, x: number) => number, base: (time: number) => number) => {
      if (columns < 2) return;
      g.strokeStyle = cssVar(canvas, colourVar);
      g.globalAlpha = 0.5;
      g.lineWidth = 1;
      dashed(`${name} base`, samples.map((_, x) => base(timeAt(x + 0.5))), [4, 4]);
      g.globalAlpha = 1;
      g.lineWidth = curveWidth(canvas) * (pattern === 'dots' ? DOT_WIDTH : 1);
      g.lineCap = 'round';
      dashed(name, samples.map((m, x) => y(m, x)), DASHES[pattern]);
      g.lineCap = 'butt';
    };
    if (shows.cutoff) line('cutoff', '--stage-filter', 'dots', (m) => yHz(m.cutoff), (time) => yHz(source.baseCutoffAt(time)));

    // What else the LFOs move, each the same way on its knob's own scale (bottom to top) in its stage's colour: the
    // knob's setting dashed, where it is now solid; the key names them.
    const patches = shows.destinations.length ? samples.map((_, x) => source.patchAt(timeAt(x + 0.5))) : [];
    const levels = shows.destinations.map((d) => samples.map((m, x) => (patches[x] ? destinationLevel(d, patches[x], m) : 0)));
    shows.destinations.forEach((d, i) => {
      line(d, `--stage-${DESTINATIONS[d].stage}`, patchNow ? linePattern(patchNow, d) : 'dashes', (_, x) => yLevel(levels[i][x]), (time) => {
        const then = source.patchAt(time);
        return yLevel(then ? knobLevel(d, then) : 0);
      });
    });
    canvas.dataset.destinations = shows.destinations.map((d, i) => `${d}:${(levels[i].at(-1) ?? 0).toFixed(3)}`).join(' ');

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
    if (shows.filterEnvelope) dot('--stage-filter', yLevel(last.filter));
    dot('--stage-amp', yLevel(last.amp));
    shows.destinations.forEach((d, i) => dot(`--stage-${DESTINATIONS[d].stage}`, yLevel(levels[i].at(-1) ?? 0)));
    if (shows.cutoff) dot('--stage-filter', yHz(last.cutoff));

    // The Cutoff's scale and value only with its line.
    canvas.dataset.cutoffReadout = '';
    if (!shows.cutoff) return;

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
      g.fillStyle = cssVar(canvas, '--stage-filter');
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(text, x + 4, y);
      g.textBaseline = 'alphabetic';
    }
  };
}
