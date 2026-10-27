import { describe, expect, it } from 'vitest';
import { harmonicSeries } from './harmonics';

const relative = (m: Float32Array, n: number) => m[n] / m[1];

describe('harmonicSeries (Fourier series of each Waveform)', () => {
  it('gives a saw every Harmonic at 1/n', () => {
    const { magnitudes } = harmonicSeries('saw', 0.5, 64);
    for (const n of [2, 3, 7, 20]) expect(relative(magnitudes, n)).toBeCloseTo(1 / n, 6);
  });

  it('gives a square only odd Harmonics, at 1/n', () => {
    const { magnitudes } = harmonicSeries('square', 0.5, 64);
    expect(relative(magnitudes, 3)).toBeCloseTo(1 / 3, 6);
    expect(relative(magnitudes, 9)).toBeCloseTo(1 / 9, 6);
    for (const n of [2, 4, 10]) expect(magnitudes[n]).toBeCloseTo(0, 6);
  });

  it('gives a triangle only odd Harmonics, falling much faster, at 1/n²', () => {
    const { magnitudes } = harmonicSeries('triangle', 0.5, 64);
    expect(relative(magnitudes, 3)).toBeCloseTo(1 / 9, 6);
    expect(relative(magnitudes, 5)).toBeCloseTo(1 / 25, 6);
    expect(magnitudes[2]).toBeCloseTo(0, 6);
  });

  it('gives a sine nothing but its fundamental', () => {
    const { magnitudes } = harmonicSeries('sine', 0.5, 64);
    expect(magnitudes[1]).toBeGreaterThan(0);
    for (const n of [2, 3, 10]) expect(magnitudes[n]).toBe(0);
  });

  it('makes a 25% pulse lose every 4th Harmonic', () => {
    const { magnitudes } = harmonicSeries('pulse', 0.25, 64);
    for (const n of [4, 8, 12]) expect(magnitudes[n]).toBeCloseTo(0, 6);
    // |sin(nπd)|/n: n=2 → 0.5 vs n=1 → 0.707
    expect(relative(magnitudes, 2)).toBeCloseTo(0.5 / Math.SQRT1_2, 6);
  });

  it('makes a 50% pulse sound exactly like a square', () => {
    const pulse = harmonicSeries('pulse', 0.5, 64).magnitudes;
    const square = harmonicSeries('square', 0.5, 64).magnitudes;
    for (let n = 1; n < 64; n++) expect(pulse[n]).toBeCloseTo(square[n], 6);
  });

  it('scales every Waveform so its cycle peaks at full scale', () => {
    for (const w of ['sine', 'triangle', 'saw', 'square', 'pulse'] as const) {
      const { real, imag } = harmonicSeries(w, 0.3, 256);
      let peak = 0;
      for (let i = 0; i < 4096; i++) {
        const t = (2 * Math.PI * i) / 4096;
        let x = 0;
        for (let n = 1; n < 256; n++) x += real[n] * Math.cos(n * t) + imag[n] * Math.sin(n * t);
        peak = Math.max(peak, Math.abs(x));
      }
      expect(peak, w).toBeCloseTo(1, 2);
    }
  }, 30_000); // five Waveforms × 4096 points × 256 Harmonics: past the default limit when the whole suite runs at once

  it('keeps magnitudes consistent with the real/imag coefficients the engine plays', () => {
    const { real, imag, magnitudes } = harmonicSeries('pulse', 0.3, 32);
    for (let n = 0; n < 32; n++) expect(magnitudes[n]).toBeCloseTo(Math.hypot(real[n], imag[n]), 9);
    expect(real[0]).toBe(0); // no DC
  });
});
