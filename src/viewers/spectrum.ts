import { cssVar, prepareCanvas } from './canvas';
import { harmonicMarkers } from './harmonicMarkers';
import { amplitudeToSpectrumDb } from './spectrumScale';

const F_MIN = 20;
const F_MAX = 20000;
const DB_MIN = -100;
const DB_MAX = 0;
const MIN_LABEL_GAP = 22;
const RING_GAP = 6;

interface Options {
  fundamental(): number;
  /** Ideal Reference amplitudes per Harmonic, drawn as hollow rings over the measured peaks. */
  ideal?(): Float32Array | undefined;
}

/** A Spectrum of one Tap on a log frequency axis and a dB level axis, with Harmonic Markers. */
export function createSpectrum(canvas: HTMLCanvasElement, analyser: AnalyserNode, sampleRate: number, { fundamental, ideal }: Options) {
  const bins = new Float32Array(analyser.frequencyBinCount);
  const binHz = sampleRate / analyser.fftSize;
  const nyquist = sampleRate / 2;

  return function draw() {
    analyser.getFloatFrequencyData(bins);
    const { g, width, height } = prepareCanvas(canvas);
    const xOf = (f: number) => (Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN)) * width;
    const yOf = (db: number) => ((DB_MAX - Math.max(DB_MIN, Math.min(DB_MAX, db))) / (DB_MAX - DB_MIN)) * height;
    g.clearRect(0, 0, width, height);

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

    // Harmonic Markers: a tick on every Harmonic, labels where there is room (fundamental by note name).
    const markers = harmonicMarkers(fundamental(), { maxFrequency: Math.min(F_MAX, nyquist), xOf, minLabelGap: MIN_LABEL_GAP });
    g.textAlign = 'center';
    for (const m of markers) {
      const x = xOf(m.frequency);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, m.labelled ? 5 : 3);
      g.strokeStyle = muted;
      g.stroke();
      if (m.labelled) g.fillText(m.n === 1 ? m.note.split(' ')[0] : String(m.n), Math.max(10, x), 15);
    }
    g.textAlign = 'left';

    // Keep each pixel column's peak so dense Harmonics stay distinct at the top of the log axis.
    const columns = Math.ceil(width);
    const peak = new Float32Array(columns).fill(DB_MIN);
    for (let i = 1; i < bins.length; i++) {
      const f = i * binHz;
      if (f < F_MIN || f > F_MAX) continue;
      const col = Math.min(columns - 1, Math.floor(xOf(f)));
      peak[col] = Math.max(peak[col], bins[i]);
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

    // Ideal Reference: where theory puts each Harmonic. Hollow, so it never reads as a measurement.
    const amplitudes = ideal?.();
    if (amplitudes && markers.length) {
      g.strokeStyle = cssVar(canvas, '--text');
      g.lineWidth = 1;
      let lastX = -Infinity;
      for (const m of markers) {
        const a = amplitudes[m.n];
        const x = xOf(m.frequency);
        // Stop where Harmonics crowd closer than a ring's width: rings there would merge into a band.
        if (x - lastX < RING_GAP) break;
        if (!a || a < 1e-5) continue;
        lastX = x;
        g.beginPath();
        g.arc(x, yOf(amplitudeToSpectrumDb(a)), 2.5, 0, 2 * Math.PI);
        g.stroke();
      }
      g.textAlign = 'right';
      g.fillStyle = muted;
      g.fillText('○ Ideal (Fourier series)', width - 4, 28);
      g.textAlign = 'left';
    }
  };
}
