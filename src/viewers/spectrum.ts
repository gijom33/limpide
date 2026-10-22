import { cssVar, prepareCanvas } from './canvas';

const F_MIN = 20;
const F_MAX = 20000;
const DB_MIN = -100;
const DB_MAX = 0;

/** A Spectrum of one Tap on a log frequency axis and a dB level axis. */
export function createSpectrum(canvas: HTMLCanvasElement, analyser: AnalyserNode, sampleRate: number) {
  const bins = new Float32Array(analyser.frequencyBinCount);
  const binHz = sampleRate / analyser.fftSize;
  const xOf = (f: number, width: number) => (Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN)) * width;
  const yOf = (db: number, height: number) => ((DB_MAX - db) / (DB_MAX - DB_MIN)) * height;

  return function draw() {
    analyser.getFloatFrequencyData(bins);
    const { g, width, height } = prepareCanvas(canvas);
    g.clearRect(0, 0, width, height);

    g.strokeStyle = cssVar(canvas, '--grid');
    g.fillStyle = cssVar(canvas, '--muted');
    g.font = '10px system-ui, sans-serif';
    g.lineWidth = 1;
    for (const f of [100, 1000, 10000]) {
      const x = xOf(f, width);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, height);
      g.stroke();
      g.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x + 3, height - 4);
    }

    g.strokeStyle = cssVar(canvas, '--trace');
    g.lineWidth = 1.5;
    // At the top of a log axis many bins share one pixel; keep each column's peak so dense Harmonics stay distinct.
    const columns = Math.ceil(width);
    const peak = new Float32Array(columns).fill(DB_MIN);
    for (let i = 1; i < bins.length; i++) {
      const f = i * binHz;
      if (f < F_MIN || f > F_MAX) continue;
      const col = Math.min(columns - 1, Math.floor(xOf(f, width)));
      peak[col] = Math.max(peak[col], bins[i]);
    }
    g.beginPath();
    for (let col = 0; col < columns; col++) {
      const y = yOf(peak[col], height);
      if (col === 0) g.moveTo(col, y);
      else g.lineTo(col, y);
    }
    g.stroke();
  };
}
