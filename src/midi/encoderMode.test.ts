import { describe, expect, it } from 'vitest';
import { detectEncoderMode, detectKnobMode, relativeDelta } from './encoderMode';

describe('Encoder Mode detection', () => {
  it('reads a knob sweeping through positions as Absolute', () => {
    expect(detectEncoderMode([40, 41, 42, 43])).toBe('absolute');
    expect(detectEncoderMode([0, 1, 2, 3])).toBe('absolute'); // slowly up from the bottom
    expect(detectEncoderMode([127, 126, 125, 124])).toBe('absolute'); // slowly down from the top
    expect(detectEncoderMode([62, 63, 64, 65])).toBe('absolute'); // across the middle
  });

  it('reads repeated small steps around 0 (1 up, 127 down) as two’s-complement Relative', () => {
    expect(detectEncoderMode([1, 1, 1, 1])).toBe('relative-twos');
    expect(detectEncoderMode([127, 127, 126, 127])).toBe('relative-twos'); // turning down, a little faster
    expect(detectEncoderMode([1, 127])).toBe('relative-twos'); // a nudge each way
  });

  it('reads repeated steps around 64 (65 up, 63 down) as 64-centred Relative', () => {
    expect(detectEncoderMode([65, 65, 65, 65])).toBe('relative-centred');
    expect(detectEncoderMode([63, 63, 62, 63])).toBe('relative-centred');
    expect(detectEncoderMode([65, 63])).toBe('relative-centred');
  });

  it('reads a brisk turn of an accelerated encoder as Relative, its values all a few steps from 64 or from 0 (issue 186)', () => {
    expect(detectEncoderMode([66, 69, 71, 67])).toBe('relative-centred');
    expect(detectEncoderMode([62, 59, 57, 61])).toBe('relative-centred');
    expect(detectEncoderMode([2, 5, 7, 3])).toBe('relative-twos');
    expect(detectEncoderMode([126, 123, 121, 125])).toBe('relative-twos');
    expect(detectEncoderMode([65])).toBe('relative-centred'); // a slow turn's one click
    expect(detectEncoderMode([127])).toBe('relative-twos');
  });

  it('reads a fader nudged off either end as Absolute, and a value far from 0 and 64 too (issue 186)', () => {
    expect(detectEncoderMode([1])).toBe('absolute'); // nudged once from the bottom
    expect(detectEncoderMode([1, 2])).toBe('absolute');
    expect(detectEncoderMode([126])).toBe('absolute'); // nudged once from the top
    expect(detectEncoderMode([126, 125, 124])).toBe('absolute');
    expect(detectEncoderMode([66, 90])).toBe('absolute');
    expect(detectEncoderMode([0])).toBe('absolute');
  });

  it('reads a fader nudged off an end by any small rise as Absolute, not only by single steps (issue 227)', () => {
    expect(detectEncoderMode([2])).toBe('absolute'); // a lone 2, nudged from the bottom
    expect(detectEncoderMode([1, 3, 6, 10])).toBe('absolute'); // pushed up faster and faster
    expect(detectEncoderMode([125])).toBe('absolute'); // nudged from the top
    expect(detectEncoderMode([125, 122, 118])).toBe('absolute');
    // An encoder's turn still reads as Relative: it goes back on itself, repeats, or starts at 127.
    expect(detectEncoderMode([2, 5, 7, 3])).toBe('relative-twos');
    expect(detectEncoderMode([1, 1, 2])).toBe('relative-twos');
    expect(detectEncoderMode([127, 125, 122])).toBe('relative-twos');
  });

  it("reads a first-layout C16 knob's first turn: Relative when it repeats or varies its step, Absolute when it steps through positions (issue 144)", () => {
    // A quick turn of an endless encoder: its steps vary, all near 0 or near 64.
    expect(detectKnobMode([3, 2, 4])).toBe('relative-twos');
    expect(detectKnobMode([1, 1, 1])).toBe('relative-twos');
    expect(detectKnobMode([125, 126, 125])).toBe('relative-twos');
    expect(detectKnobMode([66, 68, 67])).toBe('relative-centred');
    expect(detectKnobMode([65, 65, 65])).toBe('relative-centred');
    expect(detectKnobMode([62, 63, 62])).toBe('relative-centred');
    // A knob sending positions, turned near the middle or the bottom: steady steps one way, never a repeat.
    expect(detectKnobMode([50, 49, 48])).toBe('absolute');
    expect(detectKnobMode([60, 61, 62])).toBe('absolute');
    expect(detectKnobMode([2, 3, 4])).toBe('absolute');
    expect(detectKnobMode([126, 124, 122])).toBe('absolute');
    expect(detectKnobMode([20, 40, 60])).toBe('absolute');
  });

  it('turns a Relative value into a signed step', () => {
    expect(relativeDelta('relative-twos', 1)).toBe(1);
    expect(relativeDelta('relative-twos', 3)).toBe(3);
    expect(relativeDelta('relative-twos', 127)).toBe(-1);
    expect(relativeDelta('relative-twos', 125)).toBe(-3);
    expect(relativeDelta('relative-centred', 65)).toBe(1);
    expect(relativeDelta('relative-centred', 61)).toBe(-3);
  });
});
