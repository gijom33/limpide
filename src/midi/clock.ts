import { wholeBpm } from '../music/tempo';

/** A MIDI clock ticks 24 times a beat. */
export const TICKS_PER_BEAT = 24;
/** A clock silent this long (seconds) has stopped: at 40 BPM a tick comes every 63 ms. */
export const CLOCK_TIMEOUT = 1;
/** Ticks the tempo is fitted over: four beats, so the readout holds still and a gradual change is followed in four (a jump
 * of a tenth or more is read straight, issue 185). */
const WINDOW = 4 * TICKS_PER_BEAT;
/** The readout moves to a new whole BPM only once the clock is this far from it, so a clock between two holds one. */
const HYSTERESIS = 0.75;
/** A gap this many ticks long is a pause (a Stop and a Continue), not a slower tempo: the fit starts again after it. */
const PAUSE_TICKS = 3;

/**
 * The ticks after the fit's that are checked for a fault (issue 185): a lost or a doubled tick, or a jump to another
 * tempo. Half a beat, so a jump of a tenth of the tempo has moved a tick off the line by then.
 */
const RECENT = TICKS_PER_BEAT / 2;
/** Ticks heard after a fault before it is read as one: a tick or two late is jitter, or a Bluetooth link's bunching. */
const LEAST_AFTER = 4;
/** How far apart (in ticks) the ticks before stray from their curve, at most, for a lost or a doubled tick to show. */
const ROUGH = 0.5;
/** The ticks a fault is read against, at least: two beats. */
const BASE = 2 * TICKS_PER_BEAT;
/**
 * How much better (in squared ticks) a fault must explain the recent ticks than where the ticks were heading, to be
 * read as one.
 */
const DECISIVE = 3;

/** The tempo a clock sets: a whole BPM, its beats counted from `origin`, on the clock the ticks were timed by. */
export interface ClockTempo {
  bpm: number;
  origin: number;
}

/** A tick heard: its place in the clock's count (a missed one counted too), and when it came. */
interface Point {
  index: number;
  time: number;
}

/** The line through ticks by least squares: the time a tick lasts, and the fitted time of a tick by its place. */
function fitLine(points: readonly Point[]) {
  const n = points.length;
  const t0 = points[0].time;
  const i0 = points[0].index;
  let meanI = 0;
  let meanT = 0;
  for (const p of points) {
    meanI += (p.index - i0) / n;
    meanT += (p.time - t0) / n;
  }
  let cov = 0;
  let varI = 0;
  for (const p of points) {
    cov += (p.index - i0 - meanI) * (p.time - t0 - meanT);
    varI += (p.index - i0 - meanI) ** 2;
  }
  const tick = cov / varI;
  return { tick, at: (index: number) => t0 + meanT + (index - i0 - meanI) * tick };
}

/**
 * Where the ticks were heading, by least squares through them on a curve rather than a line (a DAW's tempo ramp bends
 * it): the fitted time of a tick by its place, the ticks after them included.
 */
function fitCurve(points: readonly Point[]) {
  const n = points.length;
  const mid = (points[0].index + points[n - 1].index) / 2;
  const t0 = points[0].time;
  // The normal equations of t = a + b·x + c·x², x the place from the middle.
  const m = [0, 0, 0, 0, 0];
  const r = [0, 0, 0];
  for (const p of points) {
    const x = p.index - mid;
    const t = p.time - t0;
    for (let k = 0; k < 5; k++) m[k] += x ** k;
    for (let k = 0; k < 3; k++) r[k] += t * x ** k;
  }
  const det3 = (a: number[][]) =>
    a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
    a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
    a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  const matrix = [[m[0], m[1], m[2]], [m[1], m[2], m[3]], [m[2], m[3], m[4]]];
  const det = det3(matrix);
  const [a, b, c] = [0, 1, 2].map((col) => det3(matrix.map((row, i) => row.map((v, j) => (j === col ? r[i] : v)))) / det);
  return (index: number) => t0 + a + b * (index - mid) + c * (index - mid) ** 2;
}

type Fault = { kind: 'lost' | 'doubled' | 'jump'; from: number } | null;

/**
 * What explains the recent ticks best, against where the ticks before them were heading (issue 185), if anything does
 * clearly: from the `from`-th of them, every tick a tick late (one was lost), a tick early (one came twice), or later
 * and later, or earlier and earlier, by a tick at least by now (the tempo jumped). Ticks a jump explains as well as a
 * lost or doubled tick are not read as one, so a jump's first ticks do not move the count.
 */
function findFault(recent: readonly number[], spread: number): Fault {
  // `recent`: each tick's distance from where the ticks were heading, in ticks.
  const squares = (from: number, to: number, off: (k: number) => number) => {
    let sum = 0;
    for (let k = from; k < to; k++) sum += (recent[k] - off(k)) ** 2;
    return sum;
  };
  const n = recent.length;
  /** A jump just before the `from`-th: each tick from it on a tick-length's difference further off than the last. */
  const jump = (from: number) => {
    let num = 0;
    let den = 0;
    for (let k = from; k < n; k++) {
      num += recent[k] * (k - from + 1);
      den += (k - from + 1) ** 2;
    }
    const slope = num / den;
    return { off: slope * (n - from), sum: squares(0, from, () => 0) + squares(from, n, (k) => slope * (k - from + 1)) };
  };
  let best = squares(0, n, () => 0) - DECISIVE;
  let fault: Fault = null;
  for (let from = 0; from <= n - LEAST_AFTER; from++) {
    // A clock as rough as a tick (a Bluetooth link's bunching) cannot show one lost or doubled: it is left as it is.
    if (spread < ROUGH)
      for (const [kind, step] of [['lost', 1], ['doubled', -1]] as const) {
        const sum = squares(0, from, () => 0) + squares(from, n, () => step);
        if (sum < best) [best, fault] = [sum, { kind, from }];
      }
    // A jump is read on twice the ticks a lost one is, so a lost tick just heard is not taken for one, and only once
    // it has taken the ticks clearly further off than the clock strays.
    if (n - from < 2 * LEAST_AFTER) continue;
    const { off, sum } = jump(from);
    if (Math.abs(off) >= Math.max(1, 1.5 * spread) && sum < best) [best, fault] = [sum, { kind: 'jump', from }];
  }
  if (fault?.kind !== 'jump') {
    // A jump's first ticks are a tick off by the time a lost or doubled one could show, but later and later rather than
    // all by one: where a jump explains them as well, the count is left for the next ticks to tell, not mended.
    if (fault) for (let k = 0; k < n - 1; k++) if (jump(k).sum <= best) return null;
    return fault;
  }
  // Where it jumped: the place that explains the ticks best, the newest ones included.
  let from = fault.from;
  for (let k = from + 1; k < n - 1; k++) if (jump(k).sum < jump(from).sum) from = k;
  return { kind: 'jump', from };
}

/**
 * Follows a MIDI clock's ticks (issue 136): the time between them, fitted by least squares over the last four beats
 * so a little jitter on each tick does not reach the readout, gives the BPM, whole, between 40 and 240, and moved only
 * when the clock is clearly off it; the clock's own beats give the beat count, from the first tick heard or the first
 * after a Start. On each of the clock's beats it hands back the tempo with its beats counted so that this one falls on
 * a beat, so the beat count keeps to the clock's even where the clock runs a little off a whole BPM. A tick lost or
 * doubled is counted as the clock meant it, not read as a tempo change, and a jump to another tempo is read afresh
 * from where it came, the readout passing straight from one to the other (issue 185).
 */
export function createClockFollower() {
  // The window's ticks, oldest first.
  let points: Point[] = [];
  // Ticks since the first beat; -1 until the first tick, or after a Start, when the next tick is the first beat.
  let ticks = -1;
  let bpm: number | undefined;
  // Between a Stop and a Continue.
  let stopped = false;
  /** How long a tick lasts at `bpm`, in seconds. */
  const tickLength = (at: number) => 60 / at / TICKS_PER_BEAT;
  /**
   * The line through the window, or undefined with less than a beat in. Once faults are looked for, the newest few
   * ticks are left out until one would show (issue 185): a lost tick not yet read as one does not move the readout.
   */
  const line = () => {
    const settled = points.length >= BASE + LEAST_AFTER ? points.slice(0, 1 - LEAST_AFTER) : points;
    return settled.length > TICKS_PER_BEAT ? fitLine(settled) : undefined;
  };

  /** Mends a fault in the recent ticks, if there is one: the ticks it moved the clock's count by. */
  const mend = (): number => {
    const n = points.length;
    if (n < BASE + LEAST_AFTER) return 0;
    const count = Math.min(RECENT, n - BASE);
    const head = points.slice(0, n - count);
    const tail = points.slice(n - count);
    const { tick } = fitLine(head);
    const heading = fitCurve(head);
    const strays = head.map((p) => (p.time - heading(p.index)) / tick);
    const fault = findFault(
      tail.map((p) => (p.time - heading(p.index)) / tick),
      Math.max(...strays) - Math.min(...strays),
    );
    if (!fault) return 0;
    const after = tail.slice(fault.from);
    if (fault.kind === 'jump') {
      points = after; // the new tempo is read from its own ticks alone
      return 0;
    }
    const shift = fault.kind === 'lost' ? 1 : -1;
    // A doubled tick: one of the two is dropped, and the ticks after it come back a place.
    const moved = (fault.kind === 'doubled' ? after.slice(1) : after).map((p) => ({ index: p.index + shift, time: p.time }));
    points = [...head, ...tail.slice(0, fault.from), ...moved];
    return shift;
  };

  return {
    /**
     * A tick at `time` (seconds). On each of the clock's beats, once the BPM is known, the tempo in force. Between a
     * Stop and a Continue the clock's place in its track stands still: its ticks give the BPM but count no beats.
     */
    tick(time: number): ClockTempo | undefined {
      const before = line()?.tick ?? (bpm && tickLength(bpm));
      const last = points.at(-1);
      if (before && last && time - last.time > PAUSE_TICKS * before) points = [];
      points = [...points.slice(-WINDOW), { index: (points.at(-1)?.index ?? -1) + 1, time }];
      const shift = mend();
      const fitted = line();
      if (fitted) {
        const heard = 60 / fitted.tick / TICKS_PER_BEAT;
        if (bpm === undefined || Math.abs(heard - bpm) > HYSTERESIS) bpm = wholeBpm(heard);
      }
      if (stopped) return undefined;
      ticks += 1 + shift;
      if (bpm === undefined || ticks % TICKS_PER_BEAT !== 0) return undefined;
      const at = fitted ? fitted.at(points[points.length - 1].index) : time;
      return { bpm, origin: at - ticks * tickLength(bpm) };
    },
    /** A Start: the next tick is the first beat, the clock's ticks starting afresh. */
    start() {
      ticks = -1;
      points = [];
      stopped = false;
    },
    /** A Stop: the beats stand still until a Continue or a Start. */
    stop() {
      stopped = true;
    },
    /** A Continue: the beats go on from where they stood, the ticks fitted afresh (the clock may start them anew). */
    resume() {
      stopped = false;
      points = [];
    },
    /** The ticks stopped coming: the next clock is a new one, its BPM read afresh, its beats counted on. */
    lost() {
      points = [];
      bpm = undefined;
    },
  };
}
