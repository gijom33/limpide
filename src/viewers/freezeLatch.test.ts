import { describe, expect, it, vi } from 'vitest';
import { createFreezeLatch } from './freezeLatch';

describe('freeze latch', () => {
  it('follows the live value while not frozen', () => {
    const latch = createFreezeLatch<number>();
    expect(latch(false, () => 1)).toBe(1);
    expect(latch(false, () => 2)).toBe(2);
  });

  it('holds the last live value while frozen, so derived marks match the frozen frame', () => {
    const latch = createFreezeLatch<number>();
    latch(false, () => 440);
    const live = vi.fn(() => 392); // a new Note played while frozen
    expect(latch(true, live)).toBe(440);
    expect(live).not.toHaveBeenCalled();
  });

  it('follows live again after unfreezing', () => {
    const latch = createFreezeLatch<number>();
    latch(false, () => 440);
    latch(true, () => 392);
    expect(latch(false, () => 392)).toBe(392);
  });

  it('takes one reading if frozen before it ever saw a live value', () => {
    const latch = createFreezeLatch<number>();
    expect(latch(true, () => 440)).toBe(440);
    expect(latch(true, () => 392)).toBe(440);
  });
});
