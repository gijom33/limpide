// Independent measurements of rendered audio, used as the source of truth in engine tests.

/** Amplitude of the component at `freq` in `samples[from..to)` (Goertzel algorithm). */
export function toneAmplitude(samples: Float32Array, sampleRate: number, freq: number, from = 0, to = samples.length): number {
  const n = to - from;
  const w = (2 * Math.PI * freq) / sampleRate;
  const coeff = 2 * Math.cos(w);
  let s1 = 0;
  let s2 = 0;
  for (let i = from; i < to; i++) {
    const s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  return (2 * Math.sqrt(Math.max(0, power))) / n;
}

export function rms(samples: Float32Array, from = 0, to = samples.length): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (to - from));
}

export const dB = (ratio: number) => 20 * Math.log10(ratio);
