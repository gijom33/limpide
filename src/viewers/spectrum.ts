import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { harmonicNumber } from '../music/geek';
import type { IdealPartial, IdealSource } from '../music/idealReference';
import { frequencyAxis, levelAxis } from './axes';
import { canvasInputs, cssVar, curveWidth, haloText, prepareCanvas } from './canvas';
import { createFreezeLatch } from './freezeLatch';
import { createGlow, glows } from './glow';
import { harmonicMarkers } from './harmonicMarkers';
import { aboveFloor, marksToDraw, spectrumOutline } from './outline';
import { hoverReadout, hoverReadoutLines, interpolatedPeak, SILENT_DB, snapToPeak } from './readout';
import { type ReadoutColumns, readoutBox, readoutColumns } from './readoutBox';
import { createRest } from './rest';
import { amplitudeToSpectrumDb } from './spectrumScale';
import type { ViewSettings } from './viewSettings';

const MIN_LABEL_GAP = 22;
/** The least gap between two of one source's Ideal Reference marks, in pixels. */
const MARK_GAP = 6;
// Where the Response Curve's 0 dB gain sits. On the dB axis the curve shares the Spectrum's dB-per-pixel
// scale, so its slopes (12 dB/octave…) read true against the Harmonics.
const GAIN_ZERO_DB = -20;
const GAIN_TICKS = [0, -24, -48];
// The marker labels' baseline, and the height of a 10 px label above its baseline.
const MARKER_LABEL_ROW = 15;
const DB_LABEL_HEIGHT = 10;
/** Harmonic labels stop at the 7th (the owner, 2026-10-26): enough to read a Waveform's pattern, few enough to label every one. */
const LABELLED_HARMONICS = 7;
// The hover readout snaps to the strongest peak this many pixels either side of the cursor.
const HOVER_SNAP = 12;
// On the linear level axis a sine at the Oscillator's level fills the height.
const LINEAR_TOP_DB = amplitudeToSpectrumDb(OSCILLATOR_LEVEL);
// The colours a Spectrum draws in, compared at rest.
const COLOURS = ['--muted', '--text', '--bg', '--grid', '--trace', '--cutoff-line', '--panel', '--curve-w'];

interface Options {
  fundamental(): number;
  view(): ViewSettings;
  /** Draw the Ideal Reference (from the view settings) as hollow marks. */
  showIdeal?: boolean;
  /** Whether the newest Note's Gate is on: the Ideal then follows where its Envelope keeps Osc 2 (issue 98). */
  gateOn?(): boolean;
  /** The Filter's gain per frequency: drawn as the Response Curve, and applied to the Ideal marks. */
  response?(frequencies: Float32Array<ArrayBuffer>): Float32Array;
  /** Cursor position over the canvas (CSS pixels), for the hover readout. */
  hover?(): { x: number; y: number } | null;
  /** The Synth Geek Layer's Noise slope, while the Noise is up (issue 170): given for the Oscillator Spectrum. */
  noiseSlope?(): string | undefined;
}

/** Per-pixel-column peak (dB), so dense Harmonics stay distinct where many bins share a column. */
function columnPeaks(bins: Float32Array, binHz: number, columns: number, axis: ReturnType<typeof frequencyAxis>) {
  const peak = new Float32Array(columns).fill(-Infinity);
  for (let i = 1; i < bins.length; i++) {
    const f = i * binHz;
    if (!axis.contains(f)) continue;
    const col = Math.min(columns - 1, Math.floor(axis.xOf(f)));
    peak[col] = Math.max(peak[col], bins[i]);
  }
  return peak;
}

/** Strokes one value per column; `perPixel` columns share each CSS pixel (2 for a device-pixel trace on Retina). */
function strokeColumns(g: CanvasRenderingContext2D, values: Float32Array, yOf: (db: number) => number, perPixel = 1) {
  g.beginPath();
  for (let col = 0; col < values.length; col++) {
    const y = yOf(values[col]);
    if (col === 0) g.moveTo(col / perPixel, y);
    else g.lineTo(col / perPixel, y);
  }
  g.stroke();
}

/**
 * Each Ideal source's mark, about 5 px across, in the order they are drawn: a circle for Osc 1, a square for Osc 2, a
 * triangle for the Sub (the owner, 2026-10-27), a diamond for Ring (issue 88).
 */
const IDEAL_MARKS: Record<IdealSource, (g: CanvasRenderingContext2D, x: number, y: number) => void> = {
  osc1: (g, x, y) => g.arc(x, y, 2.5, 0, 2 * Math.PI),
  osc2: (g, x, y) => g.rect(x - 2.5, y - 2.5, 5, 5),
  sub: (g, x, y) => {
    g.moveTo(x, y - 3);
    g.lineTo(x + 3, y + 2.2);
    g.lineTo(x - 3, y + 2.2);
    g.closePath();
  },
  ring: (g, x, y) => {
    g.moveTo(x, y - 3);
    g.lineTo(x + 3, y);
    g.lineTo(x, y + 3);
    g.lineTo(x - 3, y);
    g.closePath();
  },
};

/** One Ideal mark, outlined, in its source's shape. */
function idealMark(g: CanvasRenderingContext2D, x: number, y: number, source: IdealSource) {
  g.beginPath();
  IDEAL_MARKS[source](g, x, y);
  g.stroke();
}

/** A Spectrum of one Tap, with Harmonic Markers and the overlays the learner has switched on. */
export function createSpectrum(canvas: HTMLCanvasElement, analyser: AnalyserNode, sampleRate: number, options: Options) {
  const { fundamental, view, showIdeal, gateOn, response, hover, noiseSlope } = options;
  const bins = new Float32Array(analyser.frequencyBinCount).fill(-Infinity);
  const binHz = sampleRate / analyser.fftSize;
  const nyquist = sampleRate / 2;
  // While frozen, everything drawn over the frame (Markers, Ideal marks, Curve) stays with that frame's Note and
  // Patch, even if a new Note is played or a knob is turned.
  const frozenFundamental = createFreezeLatch<number>();
  const frozenIdeal = createFreezeLatch<readonly IdealPartial[] | undefined>();
  const frozenCurve = createFreezeLatch<{ key: string; gains: Float32Array }>();
  const frozenIdealGains = createFreezeLatch<{ key: string; gains: Float32Array }>();
  const frozenNoiseSlope = createFreezeLatch<string | undefined>();
  // The outlines drawn last, for the Glow (issue 199), each with the axis and width it was drawn for.
  const glow = createGlow<Float32Array>();
  let snapshotToken: number | null = null;
  let snapshotBins: Float32Array | null = null;
  // The hover readout's columns, measured once per font so its box keeps one size (issue 155), and again with room for
  // the Harmonic's number while the Synth Geek Layer is on (issue 170).
  let measuredColumns: { font: string; geek: boolean; columns: ReadoutColumns } | null = null;

  const rest = createRest();

  /** `silent`: the Tap has been silent long enough for the Glow's traces of sound to fade (issue 214). */
  return function draw(silent: boolean) {
    const { overlays, viewer, glow: chosen } = view();
    const glowing = glows(chosen, 'spectrum');
    const width = canvas.clientWidth;
    const columns = Math.ceil(width);
    const fAxis = frequencyAxis(viewer.frequencyScale, width);
    // The Response Curve's gains: recomputed if the axis or size changes while frozen; otherwise the Curve from the
    // moment of freezing.
    let curveGains: Float32Array | undefined;
    if (overlays.curve && response) {
      const key = `${viewer.frequencyScale}:${columns}`;
      const live = () => ({
        key,
        gains: response(Float32Array.from({ length: columns }, (_, c) => Math.max(1, fAxis.frequencyAt(c + 0.5)))),
      });
      const held = frozenCurve(viewer.frozen, live);
      curveGains = (held.key === key ? held : frozenCurve(false, live)).gains;
    }
    const slope = overlays.geek ? frozenNoiseSlope(viewer.frozen, () => noiseSlope?.()) : undefined;
    const cursor = hover?.();
    // A silent Spectrum rests once drawn, until something it draws changes (issue 214): the Curve is compared by its
    // gains, which an LFO on the Cutoff moves. A paused one rests on a picture of sound (issue 216), its Markers and
    // Ideal marks drawn: turning either, or the Geek Layer's numbers, draws it again (issue 238).
    const inputs = [
      ...canvasInputs(canvas, COLOURS),
      viewer.frequencyScale, viewer.levelScale, viewer.snapshot, viewer.frozen, glowing, curveGains, slope,
      overlays.harmonics, overlays.ideal, overlays.geek, showIdeal,
    ];
    if (rest(silent && !cursor, inputs)) return;

    if (!viewer.frozen) {
      analyser.getFloatFrequencyData(bins);
    }
    // Snapshot: keep a copy of this Spectrum's frame (live or frozen) whenever a new one is taken.
    if (viewer.snapshot !== snapshotToken) {
      snapshotToken = viewer.snapshot;
      snapshotBins = snapshotToken === null ? null : bins.slice();
    }

    const { g, height } = prepareCanvas(canvas);
    // The trace is drawn per device pixel (up to 3×), so Harmonics stay distinct as long as the screen can show it.
    const ratio = Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1)));
    const lAxis = levelAxis(viewer.levelScale, height, { topDb: viewer.levelScale === 'db' ? 0 : LINEAR_TOP_DB });
    const { xOf } = fAxis;
    const { yOf } = lAxis;
    g.clearRect(0, 0, width, height);

    const muted = cssVar(canvas, '--muted');
    const text = cssVar(canvas, '--text');
    const background = cssVar(canvas, '--bg');
    g.font = '10px system-ui, sans-serif';
    g.strokeStyle = cssVar(canvas, '--grid');
    g.fillStyle = muted;
    g.lineWidth = 1;
    for (const f of fAxis.gridlines) {
      const x = xOf(f);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, height);
      g.stroke();
    }

    const peak = columnPeaks(bins, binHz, columns, fAxis);
    const maxFrequency = Math.min(nyquist, fAxis.frequencyAt(width));
    // The Response Curve's dB scale sits at the right edge; where its top label reaches the marker labels' row
    // (short Viewers), the marker labels stop short of it.
    const zero = viewer.levelScale === 'db' ? GAIN_ZERO_DB : LINEAR_TOP_DB - 12;
    const scaleOverlapsLabels = overlays.curve && response && yOf(zero) - 2 - DB_LABEL_HEIGHT < MARKER_LABEL_ROW;
    const labelsEndAt = scaleOverlapsLabels ? width - g.measureText('−48 dB').width - 3 - MIN_LABEL_GAP / 2 : Infinity;
    const f0 = frozenFundamental(viewer.frozen, fundamental);
    const ideal = frozenIdeal(viewer.frozen, () => view().ideal?.(f0, sampleRate, gateOn?.() ?? false));
    const markers = harmonicMarkers(f0, {
      // A tick on every Harmonic; a label on each of the first seven, and no further (the owner, 2026-10-26).
      maxFrequency, xOf, minLabelGap: g.measureText('8').width + 1, labelsEndAt,
      labelUpTo: LABELLED_HARMONICS, labelAll: true,
    });

    // Snapshot (A/B): the frame captured earlier, faint behind the live trace.
    if (snapshotBins) {
      g.globalAlpha = 0.4;
      g.strokeStyle = text;
      g.lineWidth = 1;
      strokeColumns(g, spectrumOutline(snapshotBins, binHz, fAxis, width, ratio), yOf, ratio);
      g.globalAlpha = 1;
    }

    // The live trace: an outline of the Harmonics, lightly filled underneath.
    const outline = spectrumOutline(bins, binHz, fAxis, width, ratio);
    const trace = cssVar(canvas, '--trace');
    // 1.5 device pixels, not the curve width the other Viewers share: thin enough that spikes three device pixels
    // apart keep a dark gap between them.
    const outlineWidth = 1.5 / ratio;

    // Glow (issue 199), under All (issue 229): the outlines of the last quarter of a second, fading under the newest; only the outline, so
    // the fill, the Curve and the marks read as now. One drawn on another axis or width is passed over.
    const key = `${viewer.frequencyScale}:${outline.length}`;
    const past = glow({ on: glowing, frozen: viewer.frozen, now: () => performance.now(), newest: outline, key });
    g.strokeStyle = trace;
    g.lineWidth = outlineWidth;
    for (const { value, alpha } of past) {
      g.globalAlpha = alpha;
      strokeColumns(g, value, yOf, ratio);
    }
    g.globalAlpha = 1;
    canvas.dataset.glow = String(past.length);

    g.fillStyle = trace;
    g.globalAlpha = 0.16;
    g.beginPath();
    g.moveTo(0, height);
    outline.forEach((v, col) => g.lineTo(col / ratio, yOf(v)));
    g.lineTo(width, height);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = trace;
    g.lineWidth = outlineWidth;
    strokeColumns(g, outline, yOf, ratio);

    if (curveGains) {
      // The Filter's colour, lightened: this is the Filter's shape at that Cutoff.
      g.strokeStyle = cssVar(canvas, '--cutoff-line');
      g.globalAlpha = 0.85;
      g.lineWidth = curveWidth(canvas);
      g.setLineDash([6, 3]);
      // Where the gain is below the Spectrum's floor the curve stops at the bottom edge rather than lying along it.
      const ys = Array.from(curveGains, (v) => yOf(zero + 20 * Math.log10(Math.max(1e-6, v))));
      g.beginPath();
      for (const [first, last] of aboveFloor(ys, height - 0.5)) {
        g.moveTo(first, ys[first]);
        for (let col = first + 1; col <= last; col++) g.lineTo(col, ys[col]);
      }
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 1;
      g.fillStyle = muted;
      g.textAlign = 'right';
      for (const t of viewer.levelScale === 'db' ? GAIN_TICKS : [0]) {
        haloText(g, `${t === 0 ? '0' : `−${-t}`} dB`, width - 3, yOf(zero + t) - 2, background);
      }
      g.textAlign = 'left';
    }

    // Harmonic Markers: a tick on every Harmonic, labels where there is room (fundamental by note name), while the
    // trace shows a sound, as the Ideal marks (the owner, 2026-10-27): none while silent, as after a reload.
    const sounding = outline.some((v) => yOf(v) < height - 0.5);
    const ticks = overlays.harmonics && sounding ? markers : [];
    canvas.dataset.markers = String(ticks.length);
    if (ticks.length) {
      g.textAlign = 'center';
      g.fillStyle = muted;
      g.strokeStyle = muted;
      g.lineWidth = 1;
      for (const m of ticks) {
        const x = xOf(m.frequency);
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, m.labelled ? 5 : 3);
        g.stroke();
        if (m.labelled) g.fillText(m.n === 1 ? m.note.split(' ')[0] : String(m.n), Math.max(10, m.labelX), MARKER_LABEL_ROW);
      }
      g.textAlign = 'left';
    }

    // The Ideal Reference: theory's level for each Harmonic of each Oscillator (after the Filter, when there is one), a
    // shape for each source (IDEAL_MARKS), while the trace shows a sound to compare them with: none while silent, as
    // after a reload before a Note.
    const partials = showIdeal && overlays.ideal && sounding && ideal ? ideal : undefined;
    let markCount = 0;
    if (partials && f0 > 0) {
      const shown = partials.filter((p) => f0 * p.ratio <= maxFrequency);
      const key = shown.map((p) => `${p.source}${p.ratio.toFixed(4)}`).join(',');
      const live = () => ({ key, gains: response ? response(Float32Array.from(shown, (p) => f0 * p.ratio)) : new Float32Array(shown.length).fill(1) });
      const held = frozenIdealGains(viewer.frozen, live);
      const { gains } = held.key === key ? held : frozenIdealGains(false, live);
      g.strokeStyle = text;
      g.lineWidth = 1;
      const marks = shown.map((p, i) => ({ x: xOf(f0 * p.ratio), y: yOf(amplitudeToSpectrumDb(p.level * gains[i])), source: p.source }));
      // None below the floor (as the Curve), none where one source's Harmonics crowd closer than a mark's width: each
      // source is thinned on its own, so two on one Harmonic both show.
      for (const source of Object.keys(IDEAL_MARKS) as IdealSource[]) {
        const own = marks.filter((m) => m.source === source);
        for (const i of marksToDraw(own, height - 0.5, MARK_GAP)) {
          markCount++;
          idealMark(g, own[i].x, own[i].y, source);
        }
      }
    }

    canvas.dataset.idealMarks = String(markCount);

    // The frequency axis's labels last, over the Harmonic bars, each on a halo of the background (issue 47).
    g.font = '10px system-ui, sans-serif';
    g.fillStyle = muted;
    g.textAlign = 'left';
    for (const f of fAxis.gridlines) haloText(g, f >= 1000 ? `${f / 1000}k` : `${f}`, xOf(f) + 3, height - 4, background);

    // The Synth Geek Layer (issue 170): the Noise's slope while it is up, top right under the Harmonic Markers' labels.
    canvas.dataset.noiseSlope = slope ?? '';
    if (slope) {
      g.textAlign = 'right';
      haloText(g, slope, width - 6, MARKER_LABEL_ROW + 13, background);
      g.textAlign = 'left';
    }

    // Hover readout: frequency, nearest Note and the level of the trace under the cursor, stacked in a box of one size.
    if (!cursor) delete canvas.dataset.readout;
    if (cursor) {
      const col = snapToPeak(peak, Math.max(0, Math.min(columns - 1, Math.floor(cursor.x))), HOVER_SNAP);
      g.strokeStyle = muted;
      g.beginPath();
      g.moveTo(col + 0.5, 0);
      g.lineTo(col + 0.5, height);
      g.stroke();
      const { frequency, levelDb } = interpolatedPeak(bins, binHz, fAxis.frequencyAt(col), fAxis.frequencyAt(col + 1));
      const level = Number.isFinite(levelDb) ? levelDb : peak[col];
      // With the Synth Geek Layer on, the Harmonic's number when the peak is on one, and none on silence (issue 170).
      const harmonicLine = { geek: overlays.geek, harmonic: overlays.geek && level > SILENT_DB ? harmonicNumber(frequency, f0, binHz) : undefined };
      canvas.dataset.readout = hoverReadout(frequency, level, harmonicLine);
      if (measuredColumns?.font !== g.font || measuredColumns.geek !== overlays.geek) {
        measuredColumns = { font: g.font, geek: overlays.geek, columns: readoutColumns((t) => g.measureText(t).width, { harmonic: overlays.geek }) };
      }
      const box = readoutBox(hoverReadoutLines(frequency, level, harmonicLine), measuredColumns.columns, { cursor: col, width });
      g.fillStyle = cssVar(canvas, '--panel');
      g.fillRect(box.x, box.y, box.width, box.height);
      g.fillStyle = text;
      for (const t of box.texts) {
        g.textAlign = t.align;
        g.fillText(t.text, t.x, t.y);
      }
      g.textAlign = 'left';
    }
  };
}
