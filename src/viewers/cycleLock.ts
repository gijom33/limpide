/**
 * Cycle Lock: the (fractional) sample index where the Note's fundamental next rises through zero.
 *
 * A zero-crossing trigger fails once filtering or Resonance makes the waveform ring through zero
 * several times per cycle. The fundamental's phase is unique per cycle whatever the Harmonics do,
 * so we measure it (windowed correlation at the known frequency) and start the trace there.
 */
export function cycleLockOffset(samples: Float32Array, sampleRate: number, frequency: number): number {
  if (!(frequency > 0)) return 0;
  const w = (2 * Math.PI * frequency) / sampleRate;
  const n = samples.length;
  let s = 0; // ∝ A·cos θ for x = A·sin(ωi + θ)
  let c = 0; // ∝ A·sin θ
  for (let i = 0; i < n; i++) {
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    s += samples[i] * hann * Math.sin(w * i);
    c += samples[i] * hann * Math.cos(w * i);
  }
  if (Math.hypot(s, c) < 1e-6 * n) return 0;
  const theta = Math.atan2(c, s);
  const twoPi = 2 * Math.PI;
  return ((((-theta) % twoPi) + twoPi) % twoPi) / w;
}
