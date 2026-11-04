import { scopeTrace } from './scopeTrace';

/**
 * Cycle Lock: where a Scope's trace starts, on a rising zero of the Note's fundamental.
 *
 * A zero-crossing trigger fails once filtering or Resonance makes the waveform ring through zero several times per
 * cycle. The fundamental's phase is unique per cycle whatever the Harmonics do, so we measure it: a windowed
 * correlation over the whole buffer with the fundamental as the engine plays it, its pitch followed through vibrato,
 * Glide and the bend (issue 180), so that a moving pitch keeps the trace in place.
 */

/** Samples between two readings of the pitch: a 20 Hz LFO, the fastest, is read nine times a cycle at 48 kHz. */
const PITCH_EVERY = 256;
/**
 * Where the pitch halfway between two readings is off their straight line by more than this share, it jumped there (a
 * new Note without Glide): the readings are halved down to the sample it jumped at. A vibrato or a Glide's curve stays
 * within it, so it costs no more readings.
 */
const JUMPED = 0.005;
/** At most this many rising zeros, newest first, are weighed as the trace's start. */
const CANDIDATES = 9;
/** No candidate older than the newest by more than this, in seconds: the trace stays within a cycle and 20 ms of now. */
const OLDER_AT_MOST = 0.02;
/** A candidate matching the last trace within this share of its RMS of the best counts as good as the best. */
const AS_GOOD = 0.05;

// The pitch's readings (the sample, and the phase it advances a sample there, ω) and the phase at each, kept between
// frames: the lock runs on three Scopes 60 times a second.
const at: number[] = [];
const omega: number[] = [];
const phase: number[] = [];
const hanns = new Map<number, Float32Array>();
/** The Hann window over `n` samples, worked out once per length (review 18). */
function hann(n: number): Float32Array {
  let window = hanns.get(n);
  if (!window) {
    window = Float32Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
    hanns.set(n, window);
  }
  return window;
}

/** The correlation with the fundamental, per sample, under which a buffer has none to lock to. */
const NO_FUNDAMENTAL = 1e-6;
/** The correlation is at most √2·n times the loudest sample, so a buffer quieter than this has no fundamental. */
const QUIET = NO_FUNDAMENTAL / Math.SQRT2;
/**
 * Whether every sample is too quiet for a fundamental to be found: a silent Tap skips the search (review 18, issue
 * 213), and a buffer with sound in it is searched. Indexed, as `for…of` over the samples costs more than the search.
 */
function silent(samples: Float32Array): boolean {
  for (let i = 0; i < samples.length; i++) if (samples[i] >= QUIET || samples[i] <= -QUIET) return false;
  return true;
}

/** Reads the pitch along `n` samples into `at` and `omega`: false where there is none. */
function readPitch(n: number, sampleRate: number, frequencyAt: (i: number) => number): boolean {
  at.length = 0;
  omega.length = 0;
  const read = (i: number) => {
    const f = frequencyAt(i);
    at.push(i);
    omega.push((2 * Math.PI * f) / sampleRate);
    return f > 0;
  };
  // Between readings at `a` and `b` (frequencies fa, fb), the readings a jump needs, in order.
  const between = (a: number, fa: number, b: number, fb: number): boolean => {
    if (b - a < 2 || Math.abs(fb - fa) <= JUMPED * fa) return true;
    const m = Math.floor((a + b) / 2);
    const fm = frequencyAt(m);
    if (Math.abs(fm - (fa + fb) / 2) <= JUMPED * fa) return true;
    return between(a, fa, m, fm) && read(m) && between(m, fm, b, fb);
  };
  if (!read(0)) return false;
  for (let a = 0; a < n - 1; a += PITCH_EVERY) {
    const b = Math.min(a + PITCH_EVERY, n - 1);
    const fa = (omega[omega.length - 1] * sampleRate) / (2 * Math.PI);
    const fb = frequencyAt(b);
    if (!between(a, fa, b, fb) || !read(b)) return false;
  }
  return true;
}

/**
 * The fundamental's rising zeros in `samples`, newest first: at most `count`, none after `last` (a fractional index).
 * `frequencyAt(i)` is the fundamental's frequency in Hz at sample `i`, read every PITCH_EVERY samples (more closely
 * where it jumps) and taken as changing in a straight line between. None when there is no fundamental to lock to
 * (silence, or no pitch).
 */
export function risingZeros(
  samples: Float32Array,
  sampleRate: number,
  frequencyAt: (i: number) => number,
  last: number,
  count: number,
): number[] {
  const n = samples.length;
  if (n < 2 || silent(samples) || !readPitch(n, sampleRate, frequencyAt)) return [];
  const segments = at.length - 1;
  // The phase φ at each reading, and the correlation with sin φ and cos φ: within a segment ω grows by a step a
  // sample, so sin and cos follow by two rotations rather than trigonometry per sample.
  const window = hann(n);
  const stepOf = (k: number) => (omega[k + 1] - omega[k]) / (at[k + 1] - at[k]);
  phase.length = 0;
  let s = 0; // ∝ A·cos θ for x = A·sin(φ + θ)
  let c = 0; // ∝ A·sin θ
  let phi = 0;
  for (let k = 0; k < segments; k++) {
    phase.push(phi);
    const from = at[k];
    const to = k === segments - 1 ? n : at[k + 1];
    const step = stepOf(k);
    let sin = Math.sin(phi);
    let cos = Math.cos(phi);
    let rs = Math.sin(omega[k]);
    let rc = Math.cos(omega[k]);
    const ds = Math.sin(step);
    const dc = Math.cos(step);
    for (let i = from; i < to; i++) {
      const x = samples[i] * window[i];
      s += x * sin;
      c += x * cos;
      const nextSin = sin * rc + cos * rs;
      cos = cos * rc - sin * rs;
      sin = nextSin;
      const nextRs = rs * dc + rc * ds;
      rc = rc * dc - rs * ds;
      rs = nextRs;
    }
    const length = at[k + 1] - from;
    phi += omega[k] * length + (step * length * (length - 1)) / 2;
  }
  phase.push(phi);
  if (Math.hypot(s, c) < NO_FUNDAMENTAL * n) return [];

  // Within segment k the phase at u samples in is φk + ωk·u + step·u(u − 1)/2; a rising zero is where φ + θ = 2πm.
  const theta = Math.atan2(c, s);
  const until = Math.max(0, Math.min(last, n - 1));
  let k = segments - 1;
  while (k > 0 && at[k] > until) k--;
  const u0 = until - at[k];
  const zeros: number[] = [];
  for (let m = Math.floor((phase[k] + omega[k] * u0 + (stepOf(k) * u0 * (u0 - 1)) / 2 + theta) / (2 * Math.PI)); zeros.length < count; m--) {
    const target = 2 * Math.PI * m - theta;
    if (target < 0) break;
    while (k > 0 && phase[k] > target) k--;
    const step = stepOf(k);
    // Solve step/2·u² + (ωk − step/2)·u = target − φk, in the form that stays exact as the step goes to 0.
    const rise = target - phase[k];
    const b = omega[k] - step / 2;
    zeros.push(at[k] + (2 * rise) / (b + Math.sqrt(Math.max(0, b * b + 2 * step * rise))));
  }
  return zeros;
}

/** One frame of a Tap, as Cycle Lock reads it. */
export interface LockFrame {
  samples: Float32Array;
  sampleRate: number;
  /** The audio clock's time at the buffer's newest sample, in seconds. */
  end: number;
  /** The fundamental's frequency at an audio clock time, in Hz: the pitch the engine plays then. */
  frequencyAt(time: number): number;
  /** How many cycles of it the trace spans. */
  cycles: number;
  /** How many points it is drawn with. */
  points: number;
}

/** The trace a Scope draws, and the samples it spans (a fractional start, and a length). */
export interface LockedTrace {
  start: number;
  length: number;
  trace: Float32Array;
}

/** The last trace drawn: where it started in its buffer, and the audio clock in samples at that buffer's end. */
interface Drawn {
  trace: Float32Array;
  start: number;
  end: number;
}

/**
 * One Scope's Cycle Lock (issue 180). The trace spans the chosen number of cycles of the pitch played, from one rising
 * zero of the fundamental to another, at the buffer's newest end: the newest sound, at most a cycle and 20 ms old. Of
 * the starts one cycle apart there, it takes the one whose trace best matches the last drawn, the newest of those as
 * good, and never one that would draw sound older than the last: where a wave repeats every two cycles (a Perfect
 * Fifth, FM at 3:2) or never exactly (a chord), the trace keeps to one of its starts. It never averages or alters a
 * sample: what changes is drawn.
 */
export function createCycleLock() {
  let last: Drawn | null = null;
  let candidate = new Float32Array(0);

  /** Of `spans` (newest first), the one whose trace best matches `previous`, moving forward from it. */
  function matching(samples: Float32Array, points: number, spans: { start: number; length: number }[], previous: Drawn | null, clockEnd: number) {
    const n = samples.length;
    const advance = previous ? clockEnd - previous.end : -1;
    if (!previous || previous.trace.length !== points || advance < 0 || advance >= n) return spans[0];
    // The same buffer at the same moment (Freeze): the same start, so the frozen trace never creeps forward.
    const same = advance === 0 && spans.find(({ start }) => start === previous.start);
    if (same) return same;
    // Forward: later than the last trace by at least half the time since its frame, so the Scope moves on.
    const earliest = previous.start - advance / 2;
    const ahead = spans.filter(({ start }) => start >= earliest);
    if (ahead.length < 2) return ahead[0] ?? spans[0];
    if (candidate.length !== points) candidate = new Float32Array(points);
    let energy = 0;
    for (const v of previous.trace) energy += v * v;
    const misses = ahead.map(({ start, length }) => {
      scopeTrace(samples, start, length, points, candidate);
      let miss = 0;
      for (let p = 0; p < points; p++) miss += (candidate[p] - previous.trace[p]) ** 2;
      return miss;
    });
    const best = Math.min(...misses);
    return ahead[misses.findIndex((miss) => miss <= best + AS_GOOD ** 2 * energy)];
  }

  return function lock({ samples, sampleRate, end, frequencyAt, cycles, points }: LockFrame): LockedTrace {
    const n = samples.length;
    const clockEnd = end * sampleRate;
    const zeros = risingZeros(samples, sampleRate, (i) => frequencyAt(end - (n - 1 - i) / sampleRate), n - 1, CANDIDATES + cycles);
    // Each span runs from a rising zero to the one `cycles` later, the newest first, none ending over 20 ms before it.
    const spans = zeros
      .slice(0, -cycles)
      .filter((z) => z >= zeros[0] - OLDER_AT_MOST * sampleRate)
      .map((z, j) => ({ start: zeros[j + cycles], length: z - zeros[j + cycles] }));
    const chosen = spans.length ? matching(samples, points, spans, last, clockEnd) : newestEnd(n, cycles * (sampleRate / frequencyAt(end)));
    const trace = scopeTrace(samples, chosen.start, chosen.length, points);
    last = { trace, start: chosen.start, end: clockEnd };
    return { ...chosen, trace };
  };
}

/** With no fundamental to lock to (silence), the trace spans `length` samples, about the cycles asked, at the newest end. */
function newestEnd(n: number, length: number) {
  const span = length > 0 && length < n - 1 ? length : (n - 1) / 4;
  return { start: n - 1 - span, length: span };
}
