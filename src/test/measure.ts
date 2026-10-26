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

/**
 * Like toneAmplitude, but Hann-windowed: use it on buffers that don't hold a whole number of periods
 * (e.g. an analyser's snapshot), where a rectangular window would smear neighbouring Harmonics in.
 */
export function toneAmplitudeHann(samples: Float32Array, sampleRate: number, freq: number): number {
  const n = samples.length;
  const w = (2 * Math.PI * freq) / sampleRate;
  let re = 0;
  let im = 0;
  let gain = 0;
  for (let i = 0; i < n; i++) {
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    re += samples[i] * hann * Math.cos(w * i);
    im -= samples[i] * hann * Math.sin(w * i);
    gain += hann;
  }
  return (2 * Math.hypot(re, im)) / gain;
}

/** Frequency from the rising zero crossings (interpolated) in a window centred on `time`; for clean tones. */
export function frequencyAround(samples: Float32Array, sampleRate: number, time: number, windowSeconds: number): number {
  const from = Math.round((time - windowSeconds / 2) * sampleRate);
  const to = Math.round((time + windowSeconds / 2) * sampleRate);
  const crossings: number[] = [];
  for (let i = from + 1; i < to; i++) {
    if (samples[i - 1] <= 0 && samples[i] > 0) crossings.push(i - 1 + samples[i - 1] / (samples[i - 1] - samples[i]));
  }
  return ((crossings.length - 1) * sampleRate) / (crossings[crossings.length - 1] - crossings[0]);
}

/** In-place radix-2 FFT; `re` and `im` are a power of two long. */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const [wr, wi] = [Math.cos(angle * k), Math.sin(angle * k)];
        const [a, b] = [i + k, i + k + len / 2];
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        [re[b], im[b]] = [re[a] - xr, im[a] - xi];
        re[a] += xr;
        im[a] += xi;
      }
  }
}

/**
 * How loud everything between the Harmonics of `fundamental` is (noise, aliasing, anything inharmonic), in dB
 * against the Harmonics themselves, over the last `size` samples. Blackman–Harris windowed (sidelobes about −92 dB),
 * each Harmonic taken as the 8 bins either side of it, so the Harmonics' own skirts do not count as noise.
 */
export function betweenHarmonicsDb(samples: Float32Array, sampleRate: number, fundamental: number, size = 16384): number {
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    const x = (2 * Math.PI * i) / (size - 1);
    re[i] = samples[samples.length - size + i] * (0.35875 - 0.48829 * Math.cos(x) + 0.14128 * Math.cos(2 * x) - 0.01168 * Math.cos(3 * x));
  }
  fft(re, im);
  const binHz = sampleRate / size;
  let harmonic = 0;
  let between = 0;
  for (let k = Math.ceil(20 / binHz); k < size / 2; k++) {
    const n = Math.round((k * binHz) / fundamental);
    const power = re[k] ** 2 + im[k] ** 2;
    if (n >= 1 && Math.abs(k * binHz - n * fundamental) <= 8 * binHz) harmonic += power;
    else between += power;
  }
  return 10 * Math.log10(between / harmonic);
}
