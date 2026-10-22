import { describe, expect, it } from 'vitest';
import { createAutoRange } from './autoRange';

const HOLD_MS = 1000;
const setup = () => createAutoRange({ ranges: [1, 2, 4, 8], holdMs: HOLD_MS });

describe('Scope auto-range', () => {
  it('picks the smallest range that contains the peak', () => {
    expect(setup().update(0.9, 0)).toBe(1);
    expect(setup().update(1.3, 0)).toBe(2);
    expect(setup().update(2.3, 0)).toBe(4);
  });

  it('grows immediately when the signal gets louder', () => {
    const range = setup();
    range.update(0.5, 0);
    expect(range.update(2.3, 16)).toBe(4);
  });

  it('only shrinks after the signal has stayed smaller for the hold time, so the scale does not flicker', () => {
    const range = setup();
    range.update(2.3, 0);
    expect(range.update(0.5, 500)).toBe(4);
    expect(range.update(0.5, 900)).toBe(4);
    expect(range.update(0.5, 500 + HOLD_MS)).toBe(1);
  });

  it('restarts the hold whenever the signal comes back up', () => {
    const range = setup();
    range.update(2.3, 0);
    range.update(0.5, 100);
    range.update(2.3, 800); // loud again
    expect(range.update(0.5, 1200)).toBe(4);
  });

  it('caps at the largest range', () => {
    expect(setup().update(50, 0)).toBe(8);
  });
});
