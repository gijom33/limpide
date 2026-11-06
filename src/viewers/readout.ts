import { nearestNote } from '../music/pitch';

/** Below this level the readout says silent. */
export const SILENT_DB = -100;

/** One line of the hover readout: a value, and the unit (or the cents, after a Note) that follows it. */
export interface ReadoutLine {
  value: string;
  unit: string;
}

/**
 * With the Synth Geek Layer on (`geek`), a fourth line: the number of the Harmonic the cursor is on, if any (issue 170),
 * kept blank between them so the box keeps its size.
 */
export interface HoverGeek {
  geek?: boolean;
  harmonic?: number;
}

/**
 * What the cursor is over on a Spectrum, one line each: the frequency, the nearest Note with its cents, the level; with
 * the Synth Geek Layer on, the Harmonic's number.
 */
export function hoverReadoutLines(frequency: number, levelDb: number, { geek = false, harmonic }: HoverGeek = {}): ReadoutLine[] {
  const hz = frequency >= 1000 ? { value: (frequency / 1000).toFixed(2), unit: 'kHz' } : { value: String(Math.round(frequency)), unit: 'Hz' };
  const { name, cents } = nearestNote(frequency);
  const note = { value: name, unit: cents ? `${cents > 0 ? '+' : '−'}${Math.abs(cents)}¢` : '' };
  const level = levelDb > SILENT_DB ? { value: `${levelDb < 0 ? '−' : ''}${Math.abs(Math.round(levelDb))}`, unit: 'dB' } : { value: 'silent', unit: '' };
  const lines = [hz, note, level];
  if (geek) lines.push({ value: harmonic === undefined ? '' : `n = ${harmonic}`, unit: '' });
  return lines;
}

/**
 * The hover readout as one line of text, for the canvas's readout data, e.g. "3.00 kHz · F#7 +23¢ · −42 dB", and
 * " · n = 3" on a Harmonic with the Synth Geek Layer on.
 */
export const hoverReadout = (frequency: number, levelDb: number, geek: HoverGeek = {}): string => readoutLinesText(hoverReadoutLines(frequency, levelDb, geek));

/** The readout's lines as one line of text, as `hoverReadout`: the box and the canvas's data from the same lines. */
export const readoutLinesText = (lines: readonly ReadoutLine[]): string =>
  lines
    .filter(({ value }) => value)
    .map(({ value, unit }) => (unit ? `${value} ${unit}` : value))
    .join(' · ');

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
