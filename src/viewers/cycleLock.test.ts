import { describe, expect, it } from 'vitest';
import { createCycleLock, risingZeros } from './cycleLock';

const SR = 48000;
const BUFFER = 8192;
/** A frame at 60 Hz, in samples. */
const FRAME = 800;

/** A wave whose fundamental is sin φ, with Harmonics that ring through zero several times per cycle. */
const ringing = (phi: number) => Math.sin(phi) + 0.6 * Math.sin(5 * phi + 2.1) + 0.45 * Math.sin(9 * phi + 0.7);

/** `length` samples of `wave` along the phase that `frequency` (Hz at a sample) advances, from `phase` at sample 0. */
function render(length: number, frequency: (i: number) => number, wave = ringing, phase = 0) {
  const phases = new Float64Array(length);
  let phi = phase;
  for (let i = 0; i < length; i++) {
    phases[i] = phi;
    phi += (2 * Math.PI * frequency(i)) / SR;
  }
  return { samples: Float32Array.from(phases, wave), phases };
}

/** How far a phase is from a rising zero of sin, in radians. */
const offZero = (phi: number) => Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi)));
/** The phase at a fractional sample. */
const phaseAt = (phases: Float64Array, x: number) => phases[Math.floor(x)] + (phases[Math.floor(x) + 1] - phases[Math.floor(x)]) * (x % 1);

const countRisingZeroCrossings = (s: Float32Array, from: number, to: number) => {
  let count = 0;
  for (let i = from + 1; i < to; i++) if (s[i - 1] <= 0 && s[i] > 0) count++;
  return count;
};

describe('Cycle Lock’s rising zeros', () => {
  it('finds where the fundamental rises through zero, though the wave crosses zero several times a cycle', () => {
    const { samples, phases } = render(BUFFER, () => 261.63, ringing, 1.0);
    expect(countRisingZeroCrossings(samples, 0, Math.round(SR / 261.63))).toBeGreaterThan(1);
    const zeros = risingZeros(samples, SR, () => 261.63, BUFFER - 500, 9);
    expect(zeros).toHaveLength(9);
    for (const z of zeros) expect(offZero(phaseAt(phases, z))).toBeLessThan(0.02);
  });

  it('gives them newest first, one cycle apart, none after the last allowed', () => {
    const period = SR / 440;
    const zeros = risingZeros(render(BUFFER, () => 440).samples, SR, () => 440, 5000.5, 5);
    expect(zeros[0]).toBeLessThanOrEqual(5000.5);
    expect(zeros[0]).toBeGreaterThan(5000.5 - period);
    for (let k = 1; k < zeros.length; k++) expect(zeros[k - 1] - zeros[k]).toBeCloseTo(period, 1);
  });

  it('follows a vibrato the engine reports, where one pitch for the whole buffer misses (issue 180)', () => {
    // A 2 Hz vibrato of a third of a semitone each way, as the Slow Vibrato Preset plays it.
    const vibrato = (i: number) => 130.81 * 2 ** ((0.3 * Math.sin((2 * Math.PI * 2 * i) / SR + 0.5)) / 12);
    const { samples, phases } = render(BUFFER, vibrato);
    for (const z of risingZeros(samples, SR, vibrato, BUFFER - 800, 9)) expect(offZero(phaseAt(phases, z))).toBeLessThan(0.03);
    const steady = risingZeros(samples, SR, () => 130.81, BUFFER - 800, 9);
    expect(Math.max(...steady.map((z) => offZero(phaseAt(phases, z))))).toBeGreaterThan(0.2);
  });

  it('follows a Glide the engine reports (issue 180)', () => {
    const glide = (i: number) => 196 + (130.81 - 196) * Math.exp(-i / (0.08 * SR));
    const { samples, phases } = render(BUFFER, glide);
    for (const z of risingZeros(samples, SR, glide, BUFFER - 800, 9)) expect(offZero(phaseAt(phases, z))).toBeLessThan(0.03);
  });

  it('still finds the cycle with Noise mixed in at the same level', () => {
    let seed = 7;
    const noise = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed / 2 ** 32) * 2 - 1;
    };
    const { samples, phases } = render(BUFFER, () => 220, (phi) => Math.sin(phi) + noise(), 1.1);
    for (const z of risingZeros(samples, SR, () => 220, BUFFER - 500, 3)) expect(offZero(phaseAt(phases, z))).toBeLessThan(0.1);
  });

  it('finds none in silence or without a pitch', () => {
    expect(risingZeros(new Float32Array(BUFFER), SR, () => 440, BUFFER - 1, 9)).toEqual([]);
    expect(risingZeros(render(BUFFER, () => 440).samples, SR, () => 0, BUFFER - 1, 9)).toEqual([]);
  });
});

/** A stream of frames 60 times a second, as the render loop reads a Tap, each drawn by `lock`. */
function frames(stream: Float32Array, frequency: (i: number) => number, count: number, cycles = 2, points = 600) {
  const lock = createCycleLock();
  return Array.from({ length: count }, (_, k) => {
    const last = BUFFER + k * FRAME; // one past the buffer's newest sample, in the stream
    const end = (last - 1) / SR;
    const drawn = lock({ samples: stream.subarray(last - BUFFER, last), sampleRate: SR, end, frequencyAt: (t) => frequency(t * SR), cycles, points });
    return { ...drawn, at: last - BUFFER + drawn.start };
  });
}
/** The research's jitter: the RMS change between two consecutive traces over their RMS. */
function jitter(a: Float32Array, b: Float32Array) {
  let change = 0;
  let level = 0;
  for (let i = 0; i < a.length; i++) {
    change += (a[i] - b[i]) ** 2;
    level += (a[i] ** 2 + b[i] ** 2) / 2;
  }
  return Math.sqrt(change / level);
}

describe('Cycle Lock on a Scope (issue 180)', () => {
  it('draws the newest sound: the trace ends at most a cycle and 20 ms before the buffer does', () => {
    const period = SR / 130.81;
    const stream = render(BUFFER + 40 * FRAME, () => 130.81).samples;
    for (const { start, length } of frames(stream, () => 130.81, 40)) {
      expect(BUFFER - 1 - (start + length)).toBeLessThanOrEqual(period + 0.02 * SR);
      expect(start + length).toBeLessThanOrEqual(BUFFER - 1);
    }
  });

  it('takes the newest of equally good starts, so a steady wave is drawn as it is now', () => {
    const period = SR / 440;
    const stream = render(BUFFER + 20 * FRAME, () => 440).samples;
    for (const { start, length } of frames(stream, () => 440, 20)) expect(BUFFER - 1 - (start + length)).toBeLessThan(period);
  });

  it('spans the cycles asked of the pitch played, from one rising zero of the fundamental to another', () => {
    const vibrato = (i: number) => 130.81 * 2 ** ((0.3 * Math.sin((2 * Math.PI * 2 * i) / SR)) / 12);
    const { samples, phases } = render(BUFFER + 30 * FRAME, vibrato);
    for (const [k, { start, length }] of frames(samples, vibrato, 30, 4).entries()) {
      const from = phaseAt(phases, k * FRAME + start);
      expect(offZero(from)).toBeLessThan(0.03);
      expect(phaseAt(phases, k * FRAME + start + length) - from).toBeCloseTo(4 * 2 * Math.PI, 1);
    }
  });

  it('never draws older sound than the frame before', () => {
    const vibrato = (i: number) => 130.81 * 2 ** ((0.3 * Math.sin((2 * Math.PI * 8 * i) / SR)) / 12);
    const stream = render(BUFFER + 60 * FRAME, vibrato).samples;
    const drawn = frames(stream, vibrato, 60);
    for (let k = 1; k < drawn.length; k++) expect(drawn[k].at).toBeGreaterThanOrEqual(drawn[k - 1].at + FRAME / 2);
  });

  it('holds a wave that repeats every two cycles on the same one, where the newest start alone flips', () => {
    // A Perfect Fifth: the Note and 3:2 above it, which repeat together every two cycles of the Note.
    const fifth = (phi: number) => Math.sin(phi) + 0.8 * Math.sin(1.5 * phi + 0.4);
    const period = SR / 130.81;
    const stream = render(BUFFER + 60 * FRAME, () => 130.81, fifth).samples;
    const drawn = frames(stream, () => 130.81, 60);
    for (let k = 1; k < drawn.length; k++) expect(jitter(drawn[k].trace, drawn[k - 1].trace), `frame ${k}`).toBeLessThan(0.05);
    // The control: drawing each frame from its newest rising zero alone flips between the two cycles.
    const newest = drawn.map((_, k) => {
      const last = BUFFER + k * FRAME;
      const samples = stream.subarray(last - BUFFER, last);
      return risingZeros(samples, SR, () => 130.81, BUFFER - 1 - 2 * period, 1)[0] + last;
    });
    const halves = newest.map((at) => Math.round(at / period) % 2);
    expect(new Set(halves).size).toBe(2);
  });

  it('stands still while frozen: the same buffer at the same time draws the same trace', () => {
    const lock = createCycleLock();
    const samples = render(BUFFER, () => 220, (phi) => Math.sin(phi) + 0.5 * Math.sin(1.5 * phi)).samples;
    const frame = { samples, sampleRate: SR, end: 1, frequencyAt: () => 220, cycles: 2, points: 300 };
    const first = lock(frame);
    for (let k = 0; k < 5; k++) expect(lock(frame).start).toBe(first.start);
  });

  it('draws the newest end of a silent buffer', () => {
    const { start, length, trace } = createCycleLock()({ samples: new Float32Array(BUFFER), sampleRate: SR, end: 1, frequencyAt: () => 440, cycles: 2, points: 300 });
    expect(length).toBeCloseTo((2 * SR) / 440);
    expect(start + length).toBeCloseTo(BUFFER - 1);
    expect(trace.every((v) => v === 0)).toBe(true);
  });
});
