// The AnalyserNode applies a Blackman window (coherent gain 0.42) and scales by 1/N, so a sine of
// amplitude A reads at 20·log10(0.42·A/2) dB. The Ideal Reference uses this to sit where peaks appear.
const BLACKMAN_COHERENT_GAIN = 0.42;

export const amplitudeToSpectrumDb = (amplitude: number) => 20 * Math.log10((BLACKMAN_COHERENT_GAIN * amplitude) / 2);
