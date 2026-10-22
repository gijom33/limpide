import { describe, expect, it } from 'vitest';
import { detectEncoderMode, relativeDelta } from './encoderMode';

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

  it('turns a Relative value into a signed step', () => {
    expect(relativeDelta('relative-twos', 1)).toBe(1);
    expect(relativeDelta('relative-twos', 3)).toBe(3);
    expect(relativeDelta('relative-twos', 127)).toBe(-1);
    expect(relativeDelta('relative-twos', 125)).toBe(-3);
    expect(relativeDelta('relative-centred', 65)).toBe(1);
    expect(relativeDelta('relative-centred', 61)).toBe(-3);
  });
});
