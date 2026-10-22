import { describe, expect, it } from 'vitest';
import { cycleLockOffset } from './cycleLock';

const SR = 48000;

/** A periodic signal whose fundamental is sin(ωn + phase), plus Harmonics that ring through zero several times per cycle. */
function ringingWave(freq: number, phase: number, length: number, start = 0) {
  const w = (2 * Math.PI * freq) / SR;
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const n = i + start;
    out[i] = Math.sin(w * n + phase) + 0.6 * Math.sin(5 * (w * n + phase) + 2.1) + 0.45 * Math.sin(9 * (w * n + phase) + 0.7);
  }
  return out;
}

const countRisingZeroCrossings = (s: Float32Array, from: number, to: number) => {
  let count = 0;
  for (let i = from + 1; i < to; i++) if (s[i - 1] <= 0 && s[i] > 0) count++;
  return count;
};

describe('Cycle Lock', () => {
  it('starts the trace where the fundamental rises through zero', () => {
    const freq = 440;
    const phase = 1.0;
    const offset = cycleLockOffset(ringingWave(freq, phase, 4096), SR, freq);
    const angle = (2 * Math.PI * freq * offset) / SR + phase;
    const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
    expect(Math.abs(wrapped)).toBeLessThan(0.02);
  });

  it('holds the same point of the cycle wherever the buffer happens to start', () => {
    const freq = 261.63;
    const period = SR / freq;
    // The test signal really does defeat a zero-crossing trigger: several rising crossings per cycle.
    const probe = ringingWave(freq, 0, 4096);
    expect(countRisingZeroCrossings(probe, 0, Math.round(period))).toBeGreaterThan(1);

    const reference = cycleLockOffset(ringingWave(freq, 0.3, 4096, 0), SR, freq);
    for (const shift of [1, 37, 123, 500, 1001]) {
      const offset = cycleLockOffset(ringingWave(freq, 0.3, 4096, shift), SR, freq);
      // Same absolute position in the signal, modulo one period.
      const drift = (((offset + shift - reference) % period) + period) % period;
      expect(Math.min(drift, period - drift)).toBeLessThan(0.5);
    }
  });

  it('returns a fractional offset within one period', () => {
    const freq = 110;
    const offset = cycleLockOffset(ringingWave(freq, 2.5, 8192), SR, freq);
    expect(offset).toBeGreaterThanOrEqual(0);
    expect(offset).toBeLessThan(SR / freq);
  });

  it('falls back to the start of the buffer when there is no fundamental', () => {
    expect(cycleLockOffset(new Float32Array(4096), SR, 440)).toBe(0);
    expect(cycleLockOffset(ringingWave(440, 0, 4096), SR, 0)).toBe(0);
  });
});
