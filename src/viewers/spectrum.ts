import { cssVar, prepareCanvas } from './canvas';
import { ghostRegions } from './ghost';
import { harmonicMarkers } from './harmonicMarkers';
import { amplitudeToSpectrumDb } from './spectrumScale';
import type { ViewSettings } from './viewSettings';

const F_MIN = 20;
const F_MAX = 20000;
const DB_MIN = -100;
const DB_MAX = 0;
const MIN_LABEL_GAP = 22;
const RING_GAP = 6;
// Where the Response Curve's 0 dB gain sits on the Spectrum. The curve shares the Spectrum's dB-per-pixel
// scale, so its slopes (12 dB/octave…) read true against the Harmonics.
const GAIN_ZERO_DB = -20;
const GAIN_TICKS = [0, -24, -48];
const GHOST_OPTIONS = { floorDb: -90, thresholdDb: 1 };

interface Options {
  fundamental(): number;
  view(): ViewSettings;
  /** Draw the Ideal Reference (from the view settings) as hollow rings. */
  showIdeal?: boolean;
  /** The Filter's gain per frequency: drawn as the Response Curve, and applied to the Ideal rings. */
  response?(frequencies: Float32Array<ArrayBuffer>): Float32Array;
  /** The Tap before the Filter: what it had and this Tap lacks is shaded as the Ghost. */
  ghostOf?: AnalyserNode;
}

/** Per-pixel-column peak (dB), so dense Harmonics stay distinct at the top of the log axis. */
function columnPeaks(bins: Float32Array, binHz: number, columns: number, xOf: (f: number) => number) {
  const peak = new Float32Array(columns).fill(-Infinity);
  for (let i = 1; i < bins.length; i++) {
    const f = i * binHz;
    if (f < F_MIN || f > F_MAX) continue;
    const col = Math.min(columns - 1, Math.floor(xOf(f)));
    peak[col] = Math.max(peak[col], bins[i]);
  }
  return peak;
}

/** A Spectrum of one Tap on a log frequency axis and a dB level axis, with Harmonic Markers. */
export function createSpectrum(canvas: HTMLCanvasElement, analyser: AnalyserNode, sampleRate: number, options: Options) {
  const { fundamental, view, showIdeal, response, ghostOf } = options;
  const bins = new Float32Array(analyser.frequencyBinCount);
  const ghostBins = ghostOf && new Float32Array(ghostOf.frequencyBinCount);
  const binHz = sampleRate / analyser.fftSize;
  const nyquist = sampleRate / 2;
  let columnFrequencies = new Float32Array(0);

  return function draw() {
    analyser.getFloatFrequencyData(bins);
    const { g, width, height } = prepareCanvas(canvas);
    const columns = Math.ceil(width);
    const xOf = (f: number) => (Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN)) * width;
    const yOf = (db: number) => ((DB_MAX - Math.max(DB_MIN, Math.min(DB_MAX, db))) / (DB_MAX - DB_MIN)) * height;
    if (columnFrequencies.length !== columns) {
      columnFrequencies = Float32Array.from({ length: columns }, (_, c) => F_MIN * (F_MAX / F_MIN) ** ((c + 0.5) / width));
    }
    g.clearRect(0, 0, width, height);
    const { overlays, ideal } = view();

    const muted = cssVar(canvas, '--muted');
    g.font = '10px system-ui, sans-serif';
    g.strokeStyle = cssVar(canvas, '--grid');
    g.fillStyle = muted;
    g.lineWidth = 1;
    for (const f of [100, 1000, 10000]) {
      const x = xOf(f);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, height);
      g.stroke();
      g.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x + 3, height - 4);
    }

    const peak = columnPeaks(bins, binHz, columns, xOf);
    const markers = harmonicMarkers(fundamental(), { maxFrequency: Math.min(F_MAX, nyquist), xOf, minLabelGap: MIN_LABEL_GAP });

    // Ghost: the energy the Oscillator Tap had in each column that this Tap no longer has.
    if (overlays.ghost && ghostOf && ghostBins) {
      ghostOf.getFloatFrequencyData(ghostBins);
      const before = columnPeaks(ghostBins, binHz, columns, xOf);
      // Compare only where Harmonics are (±1 column, for a visible bar), never the valleys between them.
      const harmonicColumns = new Set<number>();
      for (const m of markers) {
        const c = Math.floor(xOf(m.frequency));
        for (const d of [-1, 0, 1]) if (c + d >= 0 && c + d < columns) harmonicColumns.add(c + d);
      }
      const { removed, boosted } = ghostRegions(before, peak, { ...GHOST_OPTIONS, columns: harmonicColumns });
      g.globalAlpha = 0.3;
      g.fillStyle = cssVar(canvas, '--stage-osc');
      for (const r of removed) g.fillRect(r.column, yOf(r.from), 1, yOf(r.to) - yOf(r.from));
      g.globalAlpha = 0.45;
      g.fillStyle = cssVar(canvas, '--trace');
      for (const b of boosted) g.fillRect(b.column, yOf(b.to), 1, yOf(b.from) - yOf(b.to));
      g.globalAlpha = 1;
    }

    g.strokeStyle = cssVar(canvas, '--trace');
    g.lineWidth = 1.5;
    g.beginPath();
    for (let col = 0; col < columns; col++) {
      const y = yOf(peak[col]);
      if (col === 0) g.moveTo(col, y);
      else g.lineTo(col, y);
    }
    g.stroke();

    const text = cssVar(canvas, '--text');
    if (overlays.curve && response) {
      const gains = response(columnFrequencies);
      g.strokeStyle = text;
      g.lineWidth = 1.25;
      g.setLineDash([6, 3]);
      g.beginPath();
      for (let col = 0; col < columns; col++) {
        const y = yOf(GAIN_ZERO_DB + 20 * Math.log10(Math.max(1e-6, gains[col])));
        if (col === 0) g.moveTo(col, y);
        else g.lineTo(col, y);
      }
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = muted;
      g.textAlign = 'right';
      for (const t of GAIN_TICKS) g.fillText(`${t === 0 ? '0' : '−' + -t} dB`, width - 3, yOf(GAIN_ZERO_DB + t) - 2);
      g.textAlign = 'left';
    }

    // Harmonic Markers: a tick on every Harmonic, labels where there is room (fundamental by note name).
    g.textAlign = 'center';
    g.fillStyle = muted;
    g.strokeStyle = muted;
    g.lineWidth = 1;
    for (const m of overlays.harmonics ? markers : []) {
      const x = xOf(m.frequency);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, m.labelled ? 5 : 3);
      g.stroke();
      if (m.labelled) g.fillText(m.n === 1 ? m.note.split(' ')[0] : String(m.n), Math.max(10, x), 15);
    }
    g.textAlign = 'left';

    // Ideal Reference rings: theory's level for each Harmonic (after the Filter, when there is one).
    const amplitudes = showIdeal && overlays.ideal ? ideal : undefined;
    if (amplitudes && markers.length) {
      const shown = markers.filter((m) => amplitudes[m.n] > 1e-5);
      // On the Filter Tap the rings are where theory puts each Harmonic after the Filter.
      const gains = response ? response(Float32Array.from(shown, (m) => m.frequency)) : undefined;
      g.strokeStyle = text;
      g.lineWidth = 1;
      let lastX = -Infinity;
      shown.forEach((m, i) => {
        const x = xOf(m.frequency);
        // Stop where Harmonics crowd closer than a ring's width: rings there would merge into a band.
        if (x - lastX < RING_GAP) return;
        lastX = x;
        g.beginPath();
        g.arc(x, yOf(amplitudeToSpectrumDb(amplitudes[m.n] * (gains ? gains[i] : 1))), 2.5, 0, 2 * Math.PI);
        g.stroke();
      });
    }
  };
}
