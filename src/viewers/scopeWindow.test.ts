import { describe, expect, it } from 'vitest';
import { scopeWindow } from './scopeWindow';

const SR = 48000;
const BUFFER = 8192;

describe('scopeWindow', () => {
  it('shows exactly the requested number of cycles of the Note', () => {
    expect(scopeWindow(BUFFER, SR, 440, 2)).toEqual({ length: (2 * SR) / 440, cycles: 2 });
    expect(scopeWindow(BUFFER, SR, 110, 4)).toEqual({ length: (4 * SR) / 110, cycles: 4 });
  });

  it('shows fewer cycles for very low Notes, so a whole cycle is left for Cycle Lock', () => {
    // 20 Hz: one period is 2400 samples; 4 cycles + 1 for locking would need 12000.
    expect(scopeWindow(BUFFER, SR, 20, 4)).toEqual({ length: 2 * 2400, cycles: 2 });
  });

  it('never runs past the end of the buffer', () => {
    for (const f of [10, 16, 27.5, 55, 440, 4000]) {
      for (const c of [1, 2, 4]) {
        const { length } = scopeWindow(BUFFER, SR, f, c);
        expect(length + SR / f, `${f} Hz × ${c}`).toBeLessThanOrEqual(BUFFER);
      }
    }
  });

  it('falls back to a quarter of the buffer when no Note has played', () => {
    expect(scopeWindow(BUFFER, SR, 0, 2)).toEqual({ length: BUFFER / 4, cycles: 0 });
  });
});
