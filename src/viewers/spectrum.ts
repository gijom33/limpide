import { OSCILLATOR_LEVEL } from '../engine/synthEngine';
import { frequencyAxis, levelAxis } from './axes';
import { cssVar, prepareCanvas } from './canvas';
import { createFreezeLatch } from './freezeLatch';
import { harmonicMarkers } from './harmonicMarkers';
import { spectrumOutline } from './outline';
import { hoverReadout, interpolatedPeak, snapToPeak } from './readout';
import { amplitudeToSpectrumDb } from './spectrumScale';
import type { ViewSettings } from './viewSettings';

const MIN_LABEL_GAP = 22;
const RING_GAP = 6;
// Where the Response Curve's 0 dB gain sits. On the dB axis the curve shares the Spectrum's dB-per-pixel
// scale, so its slopes (12 dB/octave…) read true against the Harmonics.
const GAIN_ZERO_DB = -20;
const GAIN_TICKS = [0, -24, -48];
// The marker labels' baseline, and the height of a 10 px label above its baseline.
const MARKER_LABEL_ROW = 15;
const DB_LABEL_HEIGHT = 10;
// The hover readout snaps to the strongest peak this many pixels either side of the cursor.
const HOVER_SNAP = 12;
// On the linear level axis a sine at the Oscillator's level fills the height.
const LINEAR_TOP_DB = amplitudeToSpectrumDb(OSCILLATOR_LEVEL);

interface Options {
  fundamental(): number;
  view(): ViewSettings;
  /** Draw the Ideal Reference (from the view settings) as hollow rings. */
  showIdeal?: boolean;
  /** The Filter's gain per frequency: drawn as the Response Curve, and applied to the Ideal rings. */
  response?(frequencies: Float32Array<ArrayBuffer>): Float32Array;
  /** Cursor position over the canvas (CSS pixels), for the hover readout. */
  hover?(): { x: number; y: number } | null;
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

/** A Spectrum of one Tap, with Harmonic Markers and the overlays the learner has switched on. */
export function createSpectrum(canvas: HTMLCanvasElement, analyser: AnalyserNode, sampleRate: number, options: Options) {
  const { fundamental, view, showIdeal, response, hover } = options;
  const bins = new Float32Array(analyser.frequencyBinCount).fill(-Infinity);
  const binHz = sampleRate / analyser.fftSize;
  const nyquist = sampleRate / 2;
  // While frozen, everything drawn over the frame (Markers, rings, Curve) stays with that frame's Note and
  // Patch, even if a new Note is played or a knob is turned.
  const frozenFundamental = createFreezeLatch<number>();
  const frozenIdeal = createFreezeLatch<Float32Array | undefined>();
  const frozenCurve = createFreezeLatch<{ key: string; gains: Float32Array }>();
  const frozenRings = createFreezeLatch<{ key: string; gains: Float32Array }>();
  let snapshotToken: number | null = null;
  let snapshotBins: Float32Array | null = null;

  return function draw() {
    const { overlays, viewer } = view();
    const ideal = frozenIdeal(viewer.frozen, () => view().ideal);
    if (!viewer.frozen) {
      analyser.getFloatFrequencyData(bins);
    }
    // Snapshot: keep a copy of this Spectrum's frame (live or frozen) whenever a new one is taken.
    if (viewer.snapshot !== snapshotToken) {
      snapshotToken = viewer.snapshot;
      snapshotBins = snapshotToken === null ? null : bins.slice();
    }

    const { g, width, height } = prepareCanvas(canvas);
    const columns = Math.ceil(width);
    // The trace is drawn per device pixel (up to 3×), so Harmonics stay distinct as long as the screen can show it.
    const ratio = Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1)));
    const fAxis = frequencyAxis(viewer.frequencyScale, width);
    const lAxis = levelAxis(viewer.levelScale, height, { topDb: viewer.levelScale === 'db' ? 0 : LINEAR_TOP_DB });
    const { xOf } = fAxis;
    const { yOf } = lAxis;
    g.clearRect(0, 0, width, height);

    const muted = cssVar(canvas, '--muted');
    const text = cssVar(canvas, '--text');
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
      g.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x + 3, height - 4);
    }

    const peak = columnPeaks(bins, binHz, columns, fAxis);
    const maxFrequency = Math.min(nyquist, fAxis.frequencyAt(width));
    // The Response Curve's dB scale sits at the right edge; where its top label reaches the marker labels' row
    // (short Viewers), the marker labels stop short of it.
    const zero = viewer.levelScale === 'db' ? GAIN_ZERO_DB : LINEAR_TOP_DB - 12;
    const scaleOverlapsLabels = overlays.curve && response && yOf(zero) - 2 - DB_LABEL_HEIGHT < MARKER_LABEL_ROW;
    const labelsEndAt = scaleOverlapsLabels ? width - g.measureText('−48 dB').width - 3 - MIN_LABEL_GAP / 2 : Infinity;
    const markers = harmonicMarkers(frozenFundamental(viewer.frozen, fundamental), { maxFrequency, xOf, minLabelGap: MIN_LABEL_GAP, labelsEndAt });

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
    // 1.5 device pixels: thin enough that spikes three device pixels apart keep a dark gap between them.
    g.lineWidth = 1.5 / ratio;
    strokeColumns(g, outline, yOf, ratio);

    if (overlays.curve && response) {
      // Recomputed if the axis or size changes while frozen; otherwise the Curve from the moment of freezing.
      const key = `${viewer.frequencyScale}:${columns}`;
      const live = () => ({
        key,
        gains: response(Float32Array.from({ length: columns }, (_, c) => Math.max(1, fAxis.frequencyAt(c + 0.5)))),
      });
      const held = frozenCurve(viewer.frozen, live);
      const { gains } = held.key === key ? held : frozenCurve(false, live);
      // Faded text colour (white on dark, ink on light), so it reads as the Filter's shape, not a measurement.
      g.strokeStyle = text;
      g.globalAlpha = 0.6;
      g.lineWidth = 1.25;
      g.setLineDash([6, 3]);
      strokeColumns(g, gains.map((v) => zero + 20 * Math.log10(Math.max(1e-6, v))), yOf);
      g.setLineDash([]);
      g.globalAlpha = 1;
      g.fillStyle = muted;
      g.textAlign = 'right';
      for (const t of viewer.levelScale === 'db' ? GAIN_TICKS : [0]) {
        g.fillText(`${t === 0 ? '0' : '−' + -t} dB`, width - 3, yOf(zero + t) - 2);
      }
      g.textAlign = 'left';
    }

    // Harmonic Markers: a tick on every Harmonic, labels where there is room (fundamental by note name).
    if (overlays.harmonics) {
      g.textAlign = 'center';
      g.fillStyle = muted;
      g.strokeStyle = muted;
      g.lineWidth = 1;
      for (const m of markers) {
        const x = xOf(m.frequency);
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, m.labelled ? 5 : 3);
        g.stroke();
        if (m.labelled) g.fillText(m.n === 1 ? m.note.split(' ')[0] : String(m.n), Math.max(10, x), MARKER_LABEL_ROW);
      }
      g.textAlign = 'left';
    }

    // Ideal Reference rings: theory's level for each Harmonic (after the Filter, when there is one).
    const amplitudes = showIdeal && overlays.ideal ? ideal : undefined;
    if (amplitudes && markers.length) {
      const shown = markers.filter((m) => amplitudes[m.n] > 1e-5);
      const key = shown.map((m) => m.n).join(',');
      const live = () => ({ key, gains: response ? response(Float32Array.from(shown, (m) => m.frequency)) : new Float32Array(shown.length).fill(1) });
      const held = frozenRings(viewer.frozen, live);
      const { gains } = held.key === key ? held : frozenRings(false, live);
      g.strokeStyle = text;
      g.lineWidth = 1;
      let lastX = -Infinity;
      shown.forEach((m, i) => {
        const x = xOf(m.frequency);
        // Skip rings where Harmonics crowd closer than a ring's width: they would merge into a band.
        if (x - lastX < RING_GAP) return;
        lastX = x;
        g.beginPath();
        g.arc(x, yOf(amplitudeToSpectrumDb(amplitudes[m.n] * gains[i])), 2.5, 0, 2 * Math.PI);
        g.stroke();
      });
    }

    // Hover readout: frequency, nearest note and the level of the trace under the cursor.
    const cursor = hover?.();
    if (!cursor) delete canvas.dataset.readout;
    if (cursor) {
      const col = snapToPeak(peak, Math.max(0, Math.min(columns - 1, Math.floor(cursor.x))), HOVER_SNAP);
      g.strokeStyle = muted;
      g.beginPath();
      g.moveTo(col + 0.5, 0);
      g.lineTo(col + 0.5, height);
      g.stroke();
      const { frequency, levelDb } = interpolatedPeak(bins, binHz, fAxis.frequencyAt(col), fAxis.frequencyAt(col + 1));
      const label = hoverReadout(frequency, Number.isFinite(levelDb) ? levelDb : peak[col]);
      canvas.dataset.readout = label;
      const w = g.measureText(label).width + 8;
      const x = Math.min(width - w - 2, Math.max(2, col + 6));
      g.fillStyle = cssVar(canvas, '--panel');
      g.fillRect(x, 20, w, 15);
      g.fillStyle = text;
      g.fillText(label, x + 4, 31);
    }
  };
}
