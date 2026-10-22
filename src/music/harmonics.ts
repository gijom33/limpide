export type Waveform = 'sine' | 'triangle' | 'saw' | 'square' | 'pulse';

export interface HarmonicSeries {
  /** cos coefficients, index = Harmonic number (0 is DC, always 0). */
  real: Float32Array;
  /** sin coefficients. */
  imag: Float32Array;
  /** Amplitude of each Harmonic: the Ideal Reference. */
  magnitudes: Float32Array;
}

/**
 * The Fourier series of a Waveform, scaled so one cycle peaks at ±1. The engine plays exactly these
 * coefficients (as a PeriodicWave), so the Ideal Reference drawn from them is what was synthesised.
 */
export function harmonicSeries(waveform: Waveform, pulseWidth: number, count: number): HarmonicSeries {
  const real = new Float32Array(count);
  const imag = new Float32Array(count);
  for (let n = 1; n < count; n++) {
    switch (waveform) {
      case 'sine':
        imag[n] = n === 1 ? 1 : 0;
        break;
      case 'saw':
        imag[n] = ((n % 2 ? 1 : -1) * 2) / (Math.PI * n);
        break;
      case 'square':
        imag[n] = n % 2 ? 4 / (Math.PI * n) : 0;
        break;
      case 'triangle':
        imag[n] = n % 2 ? ((((n - 1) / 2) % 2 ? -1 : 1) * 8) / (Math.PI * Math.PI * n * n) : 0;
        break;
      case 'pulse':
        // A pulse high for `pulseWidth` of the cycle, centred on t = 0, without its DC offset.
        real[n] = (4 / (Math.PI * n)) * Math.sin(Math.PI * n * pulseWidth);
        break;
    }
  }

  const scale = 1 / peakOf(real, imag);
  const magnitudes = new Float32Array(count);
  for (let n = 0; n < count; n++) {
    real[n] *= scale;
    imag[n] *= scale;
    magnitudes[n] = Math.hypot(real[n], imag[n]);
  }
  return { real, imag, magnitudes };
}

// The Gibbs overshoot that sets the peak is fully formed by this many Harmonics; using more only costs time
// (1024 Harmonics took ~22 ms, too slow to rebuild on every Pulse Width change while dragging).
const PEAK_HARMONICS = 256;

/** Peak of Σ real·cos(nt) + imag·sin(nt) over one cycle, sampled densely enough to catch the Gibbs overshoot. */
function peakOf(real: Float32Array, imag: Float32Array): number {
  const count = Math.min(real.length, PEAK_HARMONICS);
  const samples = 8 * count;
  let peak = 0;
  for (let i = 0; i < samples; i++) {
    const t = (2 * Math.PI * i) / samples;
    // Rotate a phasor instead of calling cos/sin per term.
    const stepC = Math.cos(t);
    const stepS = Math.sin(t);
    let c = 1;
    let s = 0;
    let x = 0;
    for (let n = 1; n < count; n++) {
      const c2 = c * stepC - s * stepS;
      s = s * stepC + c * stepS;
      c = c2;
      x += real[n] * c + imag[n] * s;
    }
    peak = Math.max(peak, Math.abs(x));
  }
  return peak || 1;
}
