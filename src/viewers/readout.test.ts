import { describe, expect, it } from 'vitest';
import { hoverReadout, interpolatedPeak, snapToPeak } from './readout';

describe('hover readout', () => {
  it('reads frequency, nearest note and level', () => {
    expect(hoverReadout(440, -23.4)).toBe('440 Hz · A4 · −23 dB');
  });

  it('switches to kHz and shows how far off the note the frequency is', () => {
    expect(hoverReadout(3000, -41.6)).toBe('3.00 kHz · F#7 +23¢ · −42 dB');
  });

  it('says silent below the floor instead of quoting a meaningless level', () => {
    expect(hoverReadout(440, -Infinity)).toBe('440 Hz · A4 · silent');
    expect(hoverReadout(440, -120)).toBe('440 Hz · A4 · silent');
  });
});

describe('snapToPeak', () => {
  const columns = Float32Array.from([-100, -100, -30, -100, -100, -100, -100, -45, -100, -100]);

  it('moves the cursor onto the strongest peak within reach, so you need not hit a 1-pixel Harmonic', () => {
    expect(snapToPeak(columns, 4, 3)).toBe(2);
    expect(snapToPeak(columns, 6, 3)).toBe(7);
  });

  it('stays put when nothing within reach stands above the floor', () => {
    expect(snapToPeak(Float32Array.from([-100, -100, -100]), 1, 3)).toBe(1);
  });

  it('never looks outside the spectrum', () => {
    expect(snapToPeak(columns, 0, 5)).toBe(2);
    expect(snapToPeak(columns, 9, 5)).toBe(7);
  });
});

describe('interpolatedPeak', () => {
  const BIN_HZ = 48000 / 8192;
  /** dB bins of a peak shaped like a parabola, centred between bins at `centre`. */
  const parabola = (centre: number, length = 64) => Float32Array.from({ length }, (_, k) => -20 - 3 * (k - centre) ** 2);

  it('finds a peak between FFT bins, far finer than the bin spacing', () => {
    expect(interpolatedPeak(parabola(44.37), BIN_HZ, 200, 300).frequency).toBeCloseTo(44.37 * BIN_HZ, 3);
  });

  it('reads the true level of the peak, wherever on the peak the cursor landed', () => {
    expect(interpolatedPeak(parabola(44.37), BIN_HZ, 200, 300).levelDb).toBeCloseTo(-20, 6);
  });

  it('only searches the frequency range asked for', () => {
    const bins = parabola(20.6);
    bins[50] = 0; // a louder peak outside the range
    expect(interpolatedPeak(bins, BIN_HZ, 100, 150).frequency).toBeCloseTo(20.6 * BIN_HZ, 3);
  });
});
