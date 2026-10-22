import { nearestNote } from '../music/pitch';

const SILENT_DB = -100;

/** What the cursor is over on a Spectrum, e.g. "3.00 kHz · F#7 +23¢ · −42 dB". */
export function hoverReadout(frequency: number, levelDb: number): string {
  const hz = frequency >= 1000 ? `${(frequency / 1000).toFixed(2)} kHz` : `${Math.round(frequency)} Hz`;
  const { name, cents } = nearestNote(frequency);
  const note = cents ? `${name} ${cents > 0 ? '+' : '−'}${Math.abs(cents)}¢` : name;
  const level = levelDb > SILENT_DB ? `${levelDb < 0 ? '−' : ''}${Math.abs(Math.round(levelDb))} dB` : 'silent';
  return `${hz} · ${note} · ${level}`;
}

/** The column of the strongest peak within `radius` columns of `column` (or `column` if all are at the floor). */
export function snapToPeak(columns: Float32Array, column: number, radius: number): number {
  let best = column;
  let bestDb = SILENT_DB;
  for (let c = Math.max(0, column - radius); c <= Math.min(columns.length - 1, column + radius); c++) {
    if (columns[c] > bestDb) {
      bestDb = columns[c];
      best = c;
    }
  }
  return best;
}

/**
 * The strongest peak between fLow and fHigh, interpolated between FFT bins with a parabola through the top
 * three: a pixel column or a single bin is tens of cents wide at low frequencies, and the level of whichever
 * bin the cursor lands on understates the peak.
 */
export function interpolatedPeak(bins: Float32Array, binHz: number, fLow: number, fHigh: number) {
  const from = Math.max(1, Math.floor(fLow / binHz));
  const to = Math.min(bins.length - 2, Math.ceil(fHigh / binHz));
  let k = from;
  for (let i = from; i <= to; i++) if (bins[i] > bins[k]) k = i;
  const [a, b, c] = [bins[k - 1], bins[k], bins[k + 1]];
  const denominator = a - 2 * b + c;
  const offset = Number.isFinite(denominator) && denominator !== 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / denominator)) : 0;
  return { frequency: (k + offset) * binHz, levelDb: b - 0.25 * (a - c) * offset };
}
