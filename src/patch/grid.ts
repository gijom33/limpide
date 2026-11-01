import type { Range } from './taper';

/**
 * How far a press goes (issue 160): an arrow key, a wheel's notch or an encoder's tick a unit step, Shift a fine one,
 * Page Up and Down a coarse one.
 */
export type StepSize = 'unit' | 'fine' | 'coarse';

/**
 * A Parameter's Grid (issue 160): the round values a press lands on, in the control's own unit (a semitone, a time
 * step, 1 %, 0.5 dB), each size its own. A press goes to the next value of its size beyond the one it starts from, so
 * a value left off the grid by a drag lands on the grid at the first press, and stays on it.
 */
export interface Grid {
  /** The next value beyond `value` in `direction`, on the grid of `size`; the Parameter's range is not its concern. */
  next(value: number, direction: 1 | -1, size: StepSize): number;
  /** The steps in words, for the tip: a size left out moves as the unit step does. */
  words: { unit: string; fine?: string; coarse?: string };
}

/** How close to a grid value counts as on it, as a share of a step: what a float's rounding leaves. */
const ON_GRID = 1e-6;

/** Rounds away what a float's arithmetic leaves (0.7100000000000001 is 0.71). */
const clean = (x: number) => Number(x.toPrecision(12));

/** The next multiple of `step` beyond `x` in `direction`. */
function nextMultiple(x: number, direction: 1 | -1, step: number): number {
  const k = x / step;
  const n = direction > 0 ? Math.floor(k + ON_GRID) + 1 : Math.ceil(k - ON_GRID) - 1;
  return clean(n * step);
}

/** Even steps in the value's own unit: 1 % a press, Shift 0.1 %, Page 10 %; a cent; a tenth of an octave. */
export function linearGrid(unit: number, fine: number, coarse: number, words: Grid['words']): Grid {
  const steps = { unit, fine, coarse };
  return { next: (value, direction, size) => nextMultiple(value, direction, steps[size]), words };
}

/**
 * A stepped Parameter's (an Octave, a Semitone, a note value): a whole step a press, Shift too, and Page `page` steps,
 * as before issue 160.
 */
export function steppedGrid(step: number, page: number, words: Grid['words']): Grid {
  return {
    next: (value, direction, size) =>
      size === 'coarse' ? clean(Math.round(value / step) * step + direction * page * step) : nextMultiple(value, direction, step),
    words,
  };
}

/**
 * Where a press moves a Parameter (issue 160): to the next value of its Grid in `direction`, kept within its range,
 * whose ends are always reached.
 */
export function stepParam(def: Range & { grid: Grid }, value: number, direction: 1 | -1, size: StepSize): number {
  return Math.min(def.max, Math.max(def.min, def.grid.next(value, direction, size)));
}

/** A control's steps in words, for its tip (issue 160): "↑↓ a semitone · Shift 10 cents · Page an octave". */
export function stepWords({ words }: Grid): string {
  return [`↑↓ ${words.unit}`, words.fine && `Shift ${words.fine}`, words.coarse && `Page ${words.coarse}`].filter(Boolean).join(' · ');
}

/** A run of unit (or fine) steps, `steps` of them, signed: a wheel's notches, an encoder's ticks. */
export function stepParamBy(def: Range & { grid: Grid }, value: number, steps: number, size: StepSize = 'unit'): number {
  let v = value;
  for (let i = 0; i < Math.abs(steps); i++) v = stepParam(def, v, steps > 0 ? 1 : -1, size);
  return v;
}

/** The semitones of a frequency from 1 kHz, the pitch Grid's anchor: 2 kHz is 12, 4 kHz 24. */
const PITCH_ANCHOR = 1000;

/**
 * A frequency by pitch: a semitone a press, Shift 10 cents, Page an octave, counted from 1 kHz, so 2 kHz, 4 kHz and
 * 500 Hz are on every size (the Cutoff, issue 160).
 */
export function pitchGrid(words: Grid['words']): Grid {
  const steps = { unit: 1, fine: 0.1, coarse: 12 };
  return {
    next: (value, direction, size) => {
      const semitones = 12 * Math.log2(value / PITCH_ANCHOR);
      return PITCH_ANCHOR * 2 ** (nextMultiple(semitones, direction, steps[size]) / 12);
    },
    words,
  };
}

/**
 * The round series a time or a rate steps through, about 20 a decade (the Renard series R20 to two figures), each
 * about 12 % past the last: 10, 11, 12, 14, 16, 18, 20, 22, 25, 28, 32 … ms. Six of them make about an octave.
 */
const SERIES = [10, 11, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 71, 80, 90];
/** The series' value `index` steps from 1 (a second, a hertz). */
const seriesValue = (index: number) => clean(SERIES[((index % 20) + 20) % 20] * 10 ** (Math.floor(index / 20) - 1));
/** The index of the series' highest value at or below `value`, a value within ON_GRID of one counted as on it. */
function seriesIndex(value: number): number {
  let index = 20 * Math.floor(Math.log10(value));
  while (seriesValue(index) > value * (1 + ON_GRID)) index--;
  while (seriesValue(index + 1) <= value * (1 + ON_GRID)) index++;
  return index;
}
/** Rounds to the three figures a time's readout shows (10.1 ms, 1.01 s). */
const threeFigures = (x: number) => Number(x.toPrecision(3));

/** The series' value nearest `value`, by ratio. */
function nearestInSeries(value: number): number {
  const below = seriesIndex(value);
  const [low, high] = [seriesValue(below), seriesValue(below + 1)];
  return value / low <= high / value ? low : high;
}

/**
 * A time or a rate (issue 160): the round series a press (10, 11, 12, 14 ms…); Page doubles or halves, to the nearest
 * of the series (six of its steps from one of them); Shift 1 %, rounded to the three figures shown.
 */
export function seriesGrid(words: Grid['words']): Grid {
  return {
    next: (value, direction, size) => {
      if (size === 'coarse') return nearestInSeries(value * 2 ** direction);
      if (size === 'fine') {
        const near = threeFigures(value * 1.01 ** direction);
        if ((near - value) * direction > value * ON_GRID) return near;
        return nextMultiple(value, direction, 10 ** (Math.floor(Math.log10(value)) - 2)); // a last figure at least
      }
      const below = seriesIndex(value);
      const onGrid = Math.abs(seriesValue(below) - value) <= value * ON_GRID;
      return seriesValue(direction > 0 ? below + 1 : onGrid ? below - 1 : below);
    },
    words,
  };
}

/** A level in dB, and back: 0 is −∞. */
const toDb = (level: number) => 20 * Math.log10(level);
const fromDb = (db: number) => clean(10 ** (db / 20));

/**
 * A level by its dB (the Mixer's faders, issue 160): 0.5 dB a press, Shift 0.1 dB, Page 6 dB, down to `floor` dB, the
 * lowest step; one below it is silence (−∞), and one up from silence the lowest step again.
 */
export function decibelGrid(floor: number, words: Grid['words']): Grid {
  const steps = { unit: 0.5, fine: 0.1, coarse: 6 };
  return {
    next: (value, direction, size) => {
      const db = value > 0 ? toDb(value) : -Infinity;
      if (direction > 0) return fromDb(db < floor - ON_GRID ? floor : nextMultiple(db, 1, steps[size]));
      if (db <= floor + ON_GRID) return 0;
      return fromDb(Math.max(floor, nextMultiple(db, -1, steps[size])));
    },
    words,
  };
}
