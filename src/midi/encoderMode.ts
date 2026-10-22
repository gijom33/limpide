/**
 * How a Controller knob reports movement: Absolute positions (0–127), or Relative steps, either two's-complement
 * (1 up, 127 down) or 64-centred (65 up, 63 down).
 */
export type EncoderMode = 'absolute' | 'relative-twos' | 'relative-centred';

const hasRepeat = (values: number[]) => values.some((v, i) => i > 0 && v === values[i - 1]);

/**
 * Guesses the Encoder Mode from the values one control sent while being learned. A knob reporting positions
 * only sends when its position changes, so it never repeats a value; a Relative encoder repeats its step.
 * Values near 0 (or 64), repeated or alternating exactly ±1, are Relative; anything else is Absolute.
 */
export function detectEncoderMode(values: number[]): EncoderMode {
  const near = (centre: number, v: number) => v !== centre && Math.abs(((v - centre + 192) % 128) - 64) <= 15;
  const relative = (centre: number) =>
    values.length > 0 &&
    values.every((v) => near(centre, v)) &&
    (hasRepeat(values) || values.every((v) => Math.abs(((v - centre + 192) % 128) - 64) === 1));
  if (relative(0)) return 'relative-twos';
  if (relative(64)) return 'relative-centred';
  return 'absolute';
}

/** A Relative value as a signed number of steps. */
export function relativeDelta(mode: Exclude<EncoderMode, 'absolute'>, value: number): number {
  return mode === 'relative-twos' ? (value < 64 ? value : value - 128) : value - 64;
}
