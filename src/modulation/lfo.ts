export type LfoWaveform = 'sine' | 'triangle' | 'square' | 'saw' | 'sawDown';

/** One cycle of an LFO Waveform at `phase` (0–1), matching Web Audio's own oscillator shapes and start phase. */
export function lfoShape(waveform: LfoWaveform, phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  switch (waveform) {
    case 'sine':
      return Math.sin(2 * Math.PI * p);
    case 'triangle':
      return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'saw':
      return p < 0.5 ? 2 * p : 2 * p - 2;
    case 'sawDown':
      return -lfoShape('saw', p);
  }
}

/**
 * The LFO's phase (0–1) at `time`, integrating its Rate over the history of Rate changes, just as a running
 * oscillator does, so the model never drifts from the sound when the Rate knob moves.
 */
export function lfoPhase(history: readonly { time: number; rate: number }[], time: number): number {
  let cycles = 0;
  for (let i = 0; i < history.length && history[i].time < time; i++) {
    const end = i + 1 < history.length ? Math.min(time, history[i + 1].time) : time;
    cycles += history[i].rate * (end - history[i].time);
  }
  return cycles - Math.floor(cycles);
}

/**
 * The LFO's phase over time, across every Rate change and restart since it started, kept as running cycle counts:
 * each mark stores how many cycles had passed when it was made (a restart, at a Note when the LFO retriggers, starts
 * again from none). Old marks can then be forgotten without moving the phase of anything after them (integrating
 * from the start would need them all), and finding the phase is a binary search. Marks may arrive out of order (a
 * Note handed to the engine ahead of a Rate change made before it sounds): the ones after are then recounted.
 */
export function createLfoClock(start: number, rate: number) {
  const marks: { time: number; rate: number; cycles: number; restart: boolean }[] = [{ time: start, rate, cycles: 0, restart: false }];
  /** Index of the last mark at or before `time` (the first, if `time` is before every mark). */
  const indexAt = (time: number) => {
    let lo = 0;
    let hi = marks.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (marks[mid].time <= time) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  /** Recount the cycles of every mark after `from`, and carry a Rate change on to the restarts after it. */
  const recount = (from: number, rateChanged: boolean) => {
    for (let i = from + 1; i < marks.length; i++) {
      const prev = marks[i - 1];
      if (marks[i].restart && rateChanged) marks[i].rate = prev.rate;
      else if (!marks[i].restart) rateChanged = false; // a later Rate change of its own stands
      marks[i].cycles = marks[i].restart ? 0 : prev.cycles + prev.rate * (marks[i].time - prev.time);
    }
  };
  /** The mark at exactly `time`, made if there is none, with the Rate and cycles in force there. */
  const markAt = (time: number) => {
    const i = indexAt(time);
    if (marks[i].time === time) return i;
    const prev = marks[i];
    const at = time < prev.time ? 0 : i + 1;
    marks.splice(at, 0, { time, rate: prev.rate, cycles: prev.cycles + prev.rate * (time - prev.time), restart: false });
    return at;
  };
  return {
    /** The Rate changes at `time`. */
    setRate(time: number, next: number) {
      const i = markAt(time);
      marks[i].rate = next;
      recount(i, true);
    },
    /** The cycle starts again at `time` (a Note, when the LFO retriggers). */
    restart(time: number) {
      const i = markAt(time);
      marks[i].restart = true;
      marks[i].cycles = 0;
      recount(i, false);
    },
    /** The phase (0–1) at `time`. */
    phaseAt(time: number) {
      const m = marks[indexAt(time)];
      const cycles = m.cycles + m.rate * (time - m.time);
      return cycles - Math.floor(cycles);
    },
    /** Forget marks no longer needed before `time`, keeping the one in force then. */
    forgetBefore(time: number) {
      let drop = 0;
      while (drop + 1 < marks.length && marks[drop + 1].time <= time) drop++;
      if (drop) marks.splice(0, drop);
    },
    get size() {
      return marks.length;
    },
  };
}

// The slide approaches its target like setTargetAtTime: 98% of the way there (e^−4) at the Glide time.
const GLIDE_SHARPNESS = 4;

/** Where a slide from `from` towards `target` has reached `elapsed` after it began (no Glide: there at once). */
export const glideFrom = (from: number, target: number, glide: number, elapsed: number) =>
  glide > 0 ? target + (from - target) * Math.exp((-elapsed * GLIDE_SHARPNESS) / glide) : target;

/** The Oscillator's frequency at `time`, given each Note's arrival (with the Glide in force then). */
export function glideFrequency(history: readonly { time: number; frequency: number; glide: number }[], time: number): number {
  let frequency = history[0]?.frequency ?? 0;
  for (let i = 0; i < history.length && history[i].time <= time; i++) {
    const { frequency: target, glide } = history[i];
    const end = i + 1 < history.length && history[i + 1].time <= time ? history[i + 1].time : time;
    frequency = glideFrom(frequency, target, glide, end - history[i].time);
  }
  return frequency;
}

/** Glide as automation: the time constant setTargetAtTime needs to match glideFrequency. */
export const glideTimeConstant = (glide: number) => glide / GLIDE_SHARPNESS;
