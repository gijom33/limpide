import { DESTINATIONS, destinationLevel, lfoDestinations } from '../modulation/destinations';
import type { BeatGrid } from '../modulation/lfo';
import type { Modulation } from '../modulation/modulationModel';
import { formatParam, type LfoDestination, markedBeats, type Patch, type StageId } from '../patch/patch';
import { canvasInputs, cssVar, curveWidth, haloText, prepareCanvas } from './canvas';
import { createDashState } from './dashState';
import { createFreezeLatch } from './freezeLatch';
import { createRest, createSilence } from './rest';
import type { ViewSettings } from './viewSettings';

const F_MIN = 20;
const F_MAX = 20000;

interface Source {
  modulationAt(time: number): Modulation;
  now(): number;
  /** The Patch in force at a moment: whether the Filter Envelope and the LFOs move anything, and what. */
  patchAt(time: number): Patch | undefined;
  /** The tempo, whose beats are marked while an LFO's cycle follows them (issues 112, 193). */
  tempo(): BeatGrid;
  /** From when the model's past stays as it is (issue 215): the Timeline works out the moments before it every frame. */
  settledFrom(): number;
}

/**
 * What the Timeline draws with the Patch as it is (the owner, 2026-10-28, issue 63): the Amp Envelope always; the
 * Filter Envelope only while its Amount moves the Cutoff; the Cutoff only while the Filter Envelope or an LFO moves
 * it; and every other Destination an active LFO moves, once however many LFOs aim at it. `aftertouch`, the Destination
 * aftertouch moves once a keyboard has sent it (issue 132), is drawn too, after the LFOs'. The key shows the same.
 */
export function timelineShows(patch: Patch | undefined, aftertouch: LfoDestination | null) {
  const moved = patch ? [...new Set([...lfoDestinations(patch), ...(aftertouch ? [aftertouch] : [])])] : [];
  const filterEnvelope = !!patch && patch.filterEnvAmount !== 0;
  return { filterEnvelope, cutoff: filterEnvelope || moved.includes('cutoff'), destinations: moved.filter((d): d is LfoDestination => d !== 'cutoff') };
}

/**
 * Each moved Parameter's line, told apart by its pattern as well as its colour (the owner, 2026-10-28): the Cutoff
 * dots, what LFO 2 alone moves dash-dots, anything else short dashes (what LFO 1 moves, what aftertouch alone moves).
 * The key draws the same. The dots are drawn with a thicker pen (`DOT_WIDTH`), so each reads as a round dot rather
 * than a speck (the owner, 2026-10-28).
 */
export type LinePattern = 'dots' | 'dashes' | 'dashDot';
export const linePattern = (patch: Patch, moved: LfoDestination | 'cutoff'): LinePattern => {
  if (moved === 'cutoff') return 'dots';
  const aims = (amount: number, destination: LfoDestination) => amount > 0 && destination === moved;
  return aims(patch.lfo2Amount, patch.lfo2Destination) && !aims(patch.lfoAmount, patch.lfoDestination) ? 'dashDot' : 'dashes';
};

/** A key entry: what it marks and names, and for a moved Parameter its line's stage colour and pattern. */
export interface KeyEntry {
  mark: string;
  name: string;
  destination?: LfoDestination;
  stage?: StageId;
  pattern?: LinePattern;
  /** Aftertouch moves it (issue 132). */
  aftertouch?: true;
}

/**
 * The key: what the Timeline draws with this Patch (`timelineShows`), in the owner's order (2026-10-28): what LFO 1
 * moves, then what LFO 2 moves, then what aftertouch moves (issue 132), then the Cutoff and the Filter Envelope, last
 * the Amp Envelope. An LFO on the Cutoff shows as the Cutoff. With no Filter Envelope, no LFO and no aftertouch, the
 * Amp Envelope alone.
 */
export function timelineKey(patch: Patch | undefined, aftertouch: LfoDestination | null): KeyEntry[] {
  const shows = timelineShows(patch, aftertouch);
  return [
    ...(patch
      ? shows.destinations.map((d) => ({
          mark: `lfo-${d}`, name: DESTINATIONS[d].label, destination: d, stage: DESTINATIONS[d].stage, pattern: linePattern(patch, d),
          ...(d === aftertouch ? { aftertouch: true as const } : {}),
        }))
      : []),
    ...(shows.cutoff ? [{ mark: 'cutoff', name: 'Cutoff', stage: 'filter' as const, pattern: 'dots' as const }] : []),
    ...(shows.filterEnvelope ? [{ mark: 'filterEnvelope', name: 'Filter Envelope' }] : []),
    { mark: 'amp', name: 'Amp Envelope' },
  ];
}
/**
 * The moments the Timeline samples, one pixel apart on a grid fixed to time rather than to the left edge, and where
 * each falls across the plot (`xs`, the first within a pixel of the left edge). Every frame samples the same moments
 * as it scrolls, so a curve keeps its exact shape and its length: sampled afresh from the edge each frame, a fast LFO's
 * steep curve measured a pixel or more longer or shorter from frame to frame, and its marks jumped (the owner,
 * 2026-10-29).
 */
export function timelineGrid(now: number, seconds: number, pixelsPerSecond: number) {
  const left = (now - seconds) * pixelsPerSecond;
  const first = Math.ceil(left);
  const count = Math.floor(now * pixelsPerSecond) - first + 1;
  const ks = Array.from({ length: Math.max(count, 0) }, (_, i) => first + i);
  return { first, times: ks.map((k) => k / pixelsPerSecond), xs: ks.map((k) => k - left) };
}

/**
 * The Timeline's samples, one per moment of its grid (`timelineGrid`), kept from frame to frame (issue 215): the model's
 * history is kept by age and only ever added to at or after now, so a past moment's Modulation stays as it was and each frame
 * works out only the columns new since the last. Worked out again every frame: the last frame's newest, since a Note or
 * a knob can come at the very moment it was drawn at (the clock stands still until the sound starts); and the moments
 * before `settled`, the model's `settledFrom`, where the first Patch or Note stands in for what came before and can
 * still change. A new scale (a resize, another time span) starts afresh.
 */
export function createColumnSamples<T>(sample: (time: number) => T) {
  let kept: T[] = [];
  let keptFirst = 0;
  let scale = Number.NaN;
  return ({ first, times }: { first: number; times: readonly number[] }, pixelsPerSecond: number, settled: number): T[] => {
    // The kept columns from this frame's first on, short of the last frame's newest.
    const reuse = scale === pixelsPerSecond && first >= keptFirst ? kept.slice(first - keptFirst, -1) : [];
    kept = times.map((time, i) => (i < reuse.length && time >= settled ? reuse[i] : sample(time)));
    keptFirst = first;
    scale = pixelsPerSecond;
    return kept;
  };
}

const DASHES: Record<LinePattern, number[]> = { dots: [0.5, 5.5], dashes: [5, 3], dashDot: [7, 3, 0.5, 3] };
const DOT_WIDTH = 1.75; // times the curve's width
// The colours the Timeline draws in, compared at rest.
const COLOURS = ['--grid', '--muted', '--bg', '--stage-amp', '--stage-filter', '--curve-w'];
// Under this an Envelope's level is a hundredth of a pixel or less on the plot: drawn as silence (issue 214).
const AT_REST = 1e-4;
// The Timeline rests once its last sound has scrolled this far past its left edge, in seconds: a Note too short to be
// seen between two frames is still inside the frame after it.
const REST_MARGIN = 0.1;

/**
 * The Envelope Timeline: the last few seconds of the Amp and Filter Envelopes (areas, 0–1 on a shared scale), the
 * Effective Cutoff (a line, log Hz on the right) and what the LFOs move (lines in their stage's colour, each on its
 * knob's own scale), computed from the Modulation model for past moments, each only while something moves it
 * (`timelineShows`). "Now" is the right edge.
 */
export function createTimeline(canvas: HTMLCanvasElement, source: Source, view: () => ViewSettings, aftertouch: () => LfoDestination | null) {
  const frozenNow = createFreezeLatch<number>();
  const dashState = createDashState();

  const rest = createRest();
  const silence = createSilence();
  // Each column's Modulation and the Patch then, worked out once (issue 215).
  const columnSamples = createColumnSamples((time) => ({ modulation: source.modulationAt(time), patch: source.patchAt(time) }));
  let struck: number | null = null;

  const DOT_RADIUS = 3.5;
  return function draw() {
    const { frozen } = view().viewer;
    const now = frozenNow(frozen, source.now);
    // The Timeline rests (issue 214) while nothing on it moves: both Envelopes at rest and no Note struck since its
    // left edge, no broken line (their marks scroll) and no beats. What it then draws is the same whatever the Patch.
    const seconds = view().timelineSeconds;
    const patchNow = source.patchAt(now);
    const atNow = source.modulationAt(now);
    const quiet = atNow.amp < AT_REST && atNow.filter < AT_REST && atNow.struck === struck;
    struck = atNow.struck;
    // The tempo's beats, broken lines between the seconds' (issue 112), while either LFO's cycle follows them (synced,
    // Retrigger off: issue 193).
    const beats = markedBeats(patchNow, [1, 2], source.tempo(), now - seconds, now);
    const shows = timelineShows(patchNow, aftertouch());
    const still =
      !frozen &&
      // On the page's clock, which runs before the audio's has started.
      silence(quiet, performance.now() / 1000) > seconds + REST_MARGIN &&
      !shows.cutoff &&
      !shows.destinations.length &&
      !beats.length;
    const inputs = [...canvasInputs(canvas, COLOURS), seconds];
    if (rest(still, inputs)) return;

    dashState.nextFrame();
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);
    const pad = 4;
    const plot = height - 2 * pad; // a grid line every second, unlabelled: "now" is the right edge
    canvas.dataset.seconds = String(seconds);
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
    const pixelsPerSecond = width / seconds;

    canvas.dataset.beats = String(beats.length);
    g.setLineDash([2, 3]);
    for (const t of beats) {
      const x = width - (now - t) * pixelsPerSecond;
      g.beginPath();
      g.moveTo(x, pad);
      g.lineTo(x, pad + plot);
      g.stroke();
    }
    g.setLineDash([]);
    const grid = timelineGrid(now, seconds, pixelsPerSecond);
    const { times, xs } = grid;
    const sampled = columnSamples(grid, pixelsPerSecond, source.settledFrom());
    const samples = sampled.map((c) => c.modulation);

    // An Envelope as a filled area with its outline, on the 0–1 level scale.
    const area = (colourVar: string, alpha: number, level: (m: Modulation) => number) => {
      const colour = cssVar(canvas, colourVar);
      g.fillStyle = colour;
      g.globalAlpha = alpha;
      g.beginPath();
      g.moveTo(xs[0], yLevel(0));
      samples.forEach((m, i) => g.lineTo(xs[i], yLevel(level(m))));
      g.lineTo(xs.at(-1) ?? 0, yLevel(0));
      g.closePath();
      g.fill();
      g.globalAlpha = 1;
      g.strokeStyle = colour;
      g.lineWidth = curveWidth(canvas);
      g.beginPath();
      samples.forEach((m, i) => (i ? g.lineTo(xs[i], yLevel(level(m))) : g.moveTo(xs[i], yLevel(level(m)))));
      g.stroke();
    };

    // Filter Envelope: an area on the 0–1 level scale, the shape that (times Amount) pushes the Effective Cutoff.
    // Light fills, so where the two overlap they read no heavier than one Viewer's shading (16 %). Only while its
    // Amount moves the Cutoff: at zero the Envelope runs but changes nothing.
    canvas.dataset.shows = timelineKey(patchNow, aftertouch()).map((e) => e.mark).join(' ');
    if (shows.filterEnvelope) area('--stage-filter', 0.1, (m) => m.filter);
    canvas.dataset.filterEnvelope = (samples.at(-1)?.filter ?? 0).toFixed(3);
    const latest = samples.at(-1);
    canvas.dataset.ampLevel = (latest?.amp ?? 0).toFixed(3);

    // Amp Envelope, drawn over it: the one the ear follows first. The Envelope alone: an LFO on Volume (tremolo)
    // leaves it still (the owner, 2026-10-28): its dip is the Volume's own line, below.
    area('--stage-amp', 0.1, (m) => m.amp);

    // A broken line whose marks hold still against the curve as it scrolls (`createDashState`).
    const dashed = (key: string, ys: number[], dashes: number[]) => {
      const period = dashes.reduce((sum, d) => sum + d, 0);
      g.setLineDash(dashes);
      g.lineDashOffset = dashState.start(key, times[0], ys, pixelsPerSecond) % period;
      g.beginPath();
      ys.forEach((y, i) => (i ? g.lineTo(xs[i], y) : g.moveTo(xs[i], y)));
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
    };

    // A Parameter the Filter Envelope or an LFO moves (the owner, 2026-10-28): where it is now in its own pattern
    // (`linePattern`), in its stage's colour. The knob's own setting is not drawn (the owner, 2026-10-29).
    const line = ({ name, colourVar, pattern, y }: { name: string; colourVar: string; pattern: LinePattern; y: (m: Modulation, i: number) => number }) => {
      if (times.length < 2) return;
      g.strokeStyle = cssVar(canvas, colourVar);
      g.lineWidth = curveWidth(canvas) * (pattern === 'dots' ? DOT_WIDTH : 1);
      g.lineCap = 'round';
      dashed(name, samples.map((m, i) => y(m, i)), DASHES[pattern]);
      g.lineCap = 'butt';
    };
    if (shows.cutoff) line({ name: 'cutoff', colourVar: '--stage-filter', pattern: 'dots', y: (m) => yHz(m.cutoff) });

    // What else the LFOs move, each the same way on its knob's own scale (bottom to top) in its stage's colour: where
    // it is now, in its pattern; the key names them.
    const levels = shows.destinations.map((d) => sampled.map(({ modulation, patch }) => (patch ? destinationLevel(d, patch, modulation) : 0)));
    shows.destinations.forEach((d, i) => {
      line({
        name: d,
        colourVar: `--stage-${DESTINATIONS[d].stage}`,
        pattern: patchNow ? linePattern(patchNow, d) : 'dashes',
        y: (_, x) => yLevel(levels[i][x]),
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

    // The Synth Geek Layer: the Effective Cutoff's value now, beside its dot, on a chip of the background.
    const geek = view().overlays.geek;
    canvas.dataset.cutoffReadout = geek ? formatParam('cutoff', last.cutoff) : '';
    if (geek) {
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
