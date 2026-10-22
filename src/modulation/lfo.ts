export type LfoWaveform = 'sine' | 'triangle' | 'square' | 'saw';

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

// The slide approaches its target like setTargetAtTime: 98% of the way there (e^−4) at the Glide time.
const GLIDE_SHARPNESS = 4;

/** The Oscillator's frequency at `time`, given each Note's arrival (with the Glide in force then). */
export function glideFrequency(history: readonly { time: number; frequency: number; glide: number }[], time: number): number {
  let frequency = history[0]?.frequency ?? 0;
  for (let i = 0; i < history.length && history[i].time <= time; i++) {
    const { frequency: target, glide } = history[i];
    const end = i + 1 < history.length && history[i + 1].time <= time ? history[i + 1].time : time;
    frequency = glide > 0 ? target + (frequency - target) * Math.exp((-(end - history[i].time) * GLIDE_SHARPNESS) / glide) : target;
  }
  return frequency;
}

/** Glide as automation: the time constant setTargetAtTime needs to match glideFrequency. */
export const glideTimeConstant = (glide: number) => glide / GLIDE_SHARPNESS;
