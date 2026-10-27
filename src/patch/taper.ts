/** How a control's travel maps to its value: evenly, by equal ratios, or slowly at first then faster (`square`). */
export type Taper = 'linear' | 'log' | 'square';

export interface Range {
  min: number;
  max: number;
  taper: Taper;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Control position (0–1) → Parameter value. Log tapers give equal travel per ratio (e.g. per octave). */
export function positionToValue({ min, max, taper }: Range, position: number): number {
  const p = clamp01(position);
  if (taper === 'log') return min * (max / min) ** p;
  return min + (max - min) * (taper === 'square' ? p * p : p);
}

/** Parameter value → control position (0–1). */
export function valueToPosition({ min, max, taper }: Range, value: number): number {
  const linear = (value - min) / (max - min);
  const p = taper === 'log' ? Math.log(value / min) / Math.log(max / min) : taper === 'square' ? Math.sqrt(Math.max(0, linear)) : linear;
  return clamp01(Number.isNaN(p) ? 0 : p);
}
