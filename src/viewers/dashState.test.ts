import { describe, expect, it } from 'vitest';
import { createDashState } from './dashState';

// A flat line ten columns long: each column one pixel of path. The plot scrolls 100 pixels a second.
const FLAT = Array.from({ length: 10 }, () => 5);
const PPS = 100;

describe('a broken line’s pattern on the Timeline (issue 70)', () => {
  it('starts where the previous frame’s had got to at the new left edge, so the marks hold still against the curve', () => {
    const dashes = createDashState();
    dashes.nextFrame();
    expect(dashes.start('cutoff', 0, FLAT, PPS)).toBe(0);
    dashes.nextFrame();
    expect(dashes.start('cutoff', 0.03, FLAT, PPS)).toBeCloseTo(3); // three pixels scrolled off
    dashes.nextFrame();
    expect(dashes.start('cutoff', 0.055, FLAT, PPS)).toBeCloseTo(5.5);
  });

  it('measures what scrolled off along the curve, not across', () => {
    const dashes = createDashState();
    dashes.nextFrame();
    dashes.start('volume', 0, [0, 1, 2, 3], PPS);
    dashes.nextFrame();
    expect(dashes.start('volume', 0.02, [0, 1, 2, 3], PPS)).toBeCloseTo(2 * Math.SQRT2);
  });

  it('forgets a line that is no longer drawn: back again, it starts afresh', () => {
    const dashes = createDashState();
    dashes.nextFrame();
    dashes.start('cutoff', 0, FLAT, PPS);
    dashes.start('volume', 0, FLAT, PPS);
    dashes.nextFrame();
    dashes.start('cutoff', 0.01, FLAT, PPS); // the Volume's line is gone this frame
    dashes.nextFrame();
    expect(dashes.start('cutoff', 0.02, FLAT, PPS)).toBeCloseTo(2);
    expect(dashes.start('volume', 0.02, FLAT, PPS)).toBe(0);
  });

  it('starts afresh after a jump further than the line is long, or back in time', () => {
    const dashes = createDashState();
    dashes.nextFrame();
    dashes.start('cutoff', 0, FLAT, PPS);
    dashes.nextFrame();
    expect(dashes.start('cutoff', 1, FLAT, PPS)).toBe(0);
    dashes.nextFrame();
    expect(dashes.start('cutoff', 0.5, FLAT, PPS)).toBe(0);
  });
});
