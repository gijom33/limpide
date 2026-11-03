/**
 * How a Controller knob reports movement: Absolute positions (0–127), or Relative steps, either two's-complement
 * (1 up, 127 down) or 64-centred (65 up, 63 down).
 */
export type EncoderMode = 'absolute' | 'relative-twos' | 'relative-centred';

/** How far a value is from a centre (0 or 64), round the 128 values: 127 is 1 from 0. */
const distance = (centre: number, v: number) => Math.abs(((v - centre + 192) % 128) - 64);

/**
 * Guesses the Encoder Mode from the values one control sent while being learned (issue 186). A Relative encoder
 * sends steps, a few either side of 0 (two's-complement: 1 up, 127 down) or of 64 (65 up, 63 down), however briskly it
 * turns: an accelerated one's 66, 69, 71, 67 stays near 64. A fader or a knob sending positions moves one value at a
 * time, never repeating: a steady run of single steps is one, wherever it is, and so is a lone value just off an end
 * (1, or 126), a fader nudged from the bottom or the top. Anything far from 0 and 64 is Absolute. What it still gets
 * wrong, the MIDI panel changes by hand.
 */
export function detectEncoderMode(values: number[]): EncoderMode {
  const steps = values.slice(1).map((v, i) => v - values[i]);
  const run = steps.length > 0 && (steps.every((d) => d === 1) || steps.every((d) => d === -1));
  const offAnEnd = values.length === 1 && (values[0] === 1 || values[0] === 126);
  if (values.length === 0 || run || offAnEnd) return 'absolute';
  const near = (centre: number) => values.every((v) => v !== centre && distance(centre, v) <= 15);
  return near(0) ? 'relative-twos' : near(64) ? 'relative-centred' : 'absolute';
}

/**
 * The Encoder Mode of a knob known to be an endless encoder unless it shows otherwise (the first C16 layout's, issue 34): values all
 * near 0 or all near 64 are Relative, even without a repeat or a ±1 step, as a quick turn sends 3, 2, 4; but values
 * that step one way with no repeat are positions, wherever they are (a knob near the middle sends 50, 49, 48, issue
 * 144); anything else is Absolute (the device set to send positions). It serves only a stored first layout not yet
 * brought to today's, and may go with it (Mapping's 'detect').
 */
export function detectKnobMode(values: number[]): EncoderMode {
  const steps = values.slice(1).map((v, i) => v - values[i]);
  const steady = steps.length > 0 && (steps.every((d) => d > 0) || steps.every((d) => d < 0));
  if (steady) return 'absolute';
  const near = (centre: number) => values.every((v) => v !== centre && distance(centre, v) <= 15);
  return near(0) ? 'relative-twos' : near(64) ? 'relative-centred' : 'absolute';
}

/**
 * Which Relative a knob is, from the last value it sent (a Mapping switched to Relative by hand, issue 186): a step
 * near 0 (1 up, 127 down) is two's-complement; anything else, or nothing heard yet, 64-centred.
 */
export function relativeModeOf(value: number | undefined): Exclude<EncoderMode, 'absolute'> {
  return value !== undefined && value !== 0 && distance(0, value) <= 15 ? 'relative-twos' : 'relative-centred';
}

/** A Relative value as a signed number of steps. */
export function relativeDelta(mode: Exclude<EncoderMode, 'absolute'>, value: number): number {
  return mode === 'relative-twos' ? (value < 64 ? value : value - 128) : value - 64;
}
