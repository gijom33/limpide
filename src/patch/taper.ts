export type Taper = 'linear' | 'log';

export interface Range {
  min: number;
  max: number;
  taper: Taper;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Control position (0–1) → Parameter value. Log tapers give equal travel per ratio (e.g. per octave). */
export function positionToValue({ min, max, taper }: Range, position: number): number {
  const p = clamp01(position);
  return taper === 'log' ? min * (max / min) ** p : min + (max - min) * p;
}

/** Parameter value → control position (0–1). */
export function valueToPosition({ min, max, taper }: Range, value: number): number {
  const p = taper === 'log' ? Math.log(value / min) / Math.log(max / min) : (value - min) / (max - min);
  return clamp01(Number.isNaN(p) ? 0 : p);
}
