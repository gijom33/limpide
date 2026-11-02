import { clampBpm } from '../music/tempo';

/** A MIDI clock ticks 24 times a beat. */
export const TICKS_PER_BEAT = 24;
/** A clock silent this long (seconds) has stopped: at 40 BPM a tick comes every 63 ms. */
export const CLOCK_TIMEOUT = 1;
/** Ticks the tempo is fitted over: four beats, so the readout holds still and a new tempo is followed in four. */
const WINDOW = 4 * TICKS_PER_BEAT;
/** The readout moves to a new whole BPM only once the clock is this far from it, so a clock between two holds one. */
const HYSTERESIS = 0.75;
/** A gap this many ticks long is a pause (a Stop and a Continue), not a slower tempo: the fit starts again after it. */
const PAUSE_TICKS = 3;

/** The tempo a clock sets: a whole BPM, its beats counted from `origin`, on the clock the ticks were timed by. */
export interface ClockTempo {
  bpm: number;
  origin: number;
}

/**
 * Follows a MIDI clock's ticks (issue 136): the time between them, fitted by least squares over the last four beats
 * so a little jitter on each tick does not reach the readout, gives the BPM, whole, between 40 and 240, and moved only
 * when the clock is clearly off it; the clock's own beats give the beat count, from the first tick heard or the first
 * after a Start. On each of the clock's beats it hands back the tempo with its beats counted so that this one falls on
 * a beat, so the beat count keeps to the clock's even where the clock runs a little off a whole BPM.
 */
export function createClockFollower() {
  // The window's ticks' times, oldest first.
  let times: number[] = [];
  // Ticks since the first beat; -1 until the first tick, or after a Start, when the next tick is the first beat.
  let ticks = -1;
  let bpm: number | undefined;

  /** The fitted time of a tick (seconds) and the line's time a tick, or undefined with less than a beat in. */
  const fitLine = () => {
    const n = times.length;
    if (n <= TICKS_PER_BEAT) return undefined;
    const t0 = times[0];
    const meanI = (n - 1) / 2;
    let meanT = 0;
    for (const t of times) meanT += (t - t0) / n;
    let cov = 0;
    let varI = 0;
    times.forEach((t, i) => {
      cov += (i - meanI) * (t - t0 - meanT);
      varI += (i - meanI) ** 2;
    });
    const tick = cov / varI;
    return { tick, last: t0 + meanT + (n - 1 - meanI) * tick };
  };

  return {
    /** A tick at `time` (seconds). On each of the clock's beats, once the BPM is known, the tempo in force. */
    tick(time: number): ClockTempo | undefined {
      const before = fitLine()?.tick ?? (bpm && 60 / bpm / TICKS_PER_BEAT);
      if (before && times.length && time - times[times.length - 1] > PAUSE_TICKS * before) times = [];
      times = [...times.slice(-WINDOW), time];
      ticks++;
      const line = fitLine();
      if (line) {
        const heard = 60 / line.tick / TICKS_PER_BEAT;
        if (bpm === undefined || Math.abs(heard - bpm) > HYSTERESIS) bpm = clampBpm(heard);
      }
      if (bpm === undefined || ticks % TICKS_PER_BEAT !== 0) return undefined;
      const at = line?.last ?? time;
      return { bpm, origin: at - ((ticks / TICKS_PER_BEAT) * 60) / bpm };
    },
    /** A Start: the next tick is the first beat, the clock's ticks starting afresh. */
    start() {
      ticks = -1;
      times = [];
    },
    /** The ticks broke off (the clock stopped, or a Stop or a Continue): the next are fitted afresh, the beats counted on. */
    lost() {
      times = [];
    },
  };
}
