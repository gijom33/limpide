export type FrequencyScale = 'log' | 'linear';
export type LevelScale = 'db' | 'linear';

const LOG_MIN = 20;
const LOG_MAX = 20000;
// Linear spacing only helps where Harmonics are spread out enough to see as a ladder.
const LINEAR_MAX = 5000;
const DB_FLOOR = -100;

/** Frequency ↔ x for a Spectrum. */
export function frequencyAxis(scale: FrequencyScale, width: number) {
  if (scale === 'log') {
    const span = Math.log(LOG_MAX / LOG_MIN);
    return {
      xOf: (f: number) => (Math.log(f / LOG_MIN) / span) * width,
      frequencyAt: (x: number) => LOG_MIN * Math.exp((x / width) * span),
      contains: (f: number) => f >= LOG_MIN && f <= LOG_MAX,
      gridlines: [100, 1000, 10000],
    };
  }
  return {
    xOf: (f: number) => (f / LINEAR_MAX) * width,
    frequencyAt: (x: number) => (x / width) * LINEAR_MAX,
    contains: (f: number) => f > 0 && f <= LINEAR_MAX,
    gridlines: [1000, 2000, 3000, 4000],
  };
}

/**
 * Level (dB, as the analyser reports it) ↔ y for a Spectrum. The linear scale shows amplitude, with
 * `topDb` at the top: put the Oscillator's level there, or every Harmonic would be a sliver at the bottom.
 */
export function levelAxis(scale: LevelScale, height: number, { topDb }: { topDb: number }) {
  if (scale === 'db') {
    const top = Math.max(topDb, DB_FLOOR + 1);
    return {
      yOf: (db: number) => ((top - Math.max(DB_FLOOR, Math.min(top, db))) / (top - DB_FLOOR)) * height,
      levelAt: (y: number) => top - (y / height) * (top - DB_FLOOR),
    };
  }
  return {
    yOf: (db: number) => (1 - Math.min(1, 10 ** ((db - topDb) / 20))) * height,
    levelAt: (y: number) => topDb + 20 * Math.log10(Math.max(1e-9, 1 - y / height)),
  };
}
