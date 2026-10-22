import { noteToFrequency } from '../music/pitch';
import type { Patch } from '../patch/patch';

/** Listening points in the Voice, one analyser each. */
export interface Taps {
  oscillator: AnalyserNode;
  filter: AnalyserNode;
  amp: AnalyserNode;
}

export interface SynthEngine {
  applyPatch(patch: Patch): void;
  noteOn(note: number, velocity: number, at?: number): void;
  pitchChange(note: number, at?: number): void;
  noteOff(at?: number): void;
  /** Frequency of the most recent Note (0 before any), for Cycle Lock. */
  fundamental(): number;
  readonly taps: Taps;
}

const MASTER_LEVEL = 0.5;

// Web Audio interprets a low-pass biquad's Q in dB: −3 dB is a flat Butterworth response.
const resonanceToQdB = (resonance: number) => -3.01 + resonance * 27;

function createAnalyser(ctx: BaseAudioContext): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 8192;
  analyser.smoothingTimeConstant = 0;
  return analyser;
}

/** The single Voice (Oscillator → Filter → Amp) built from native Web Audio nodes (ADR-0001). */
export function createSynthEngine(ctx: BaseAudioContext): SynthEngine {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const amp = ctx.createGain();
  amp.gain.value = 0;
  const master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;
  const taps: Taps = { oscillator: createAnalyser(ctx), filter: createAnalyser(ctx), amp: createAnalyser(ctx) };

  osc.connect(filter).connect(amp).connect(master).connect(ctx.destination);
  // Taps are side branches, so observing never alters the sound.
  osc.connect(taps.oscillator);
  filter.connect(taps.filter);
  master.connect(taps.amp);
  osc.start();

  let patch: Patch | undefined;
  let fundamental = 0;
  const setPitch = (note: number, t: number) => {
    fundamental = noteToFrequency(note);
    osc.frequency.setValueAtTime(fundamental, t);
  };
  const now = (at?: number) => at ?? ctx.currentTime;

  return {
    taps,
    fundamental: () => fundamental,

    applyPatch(next) {
      patch = next;
      const t = ctx.currentTime;
      filter.frequency.setValueAtTime(next.cutoff, t);
      filter.Q.setValueAtTime(resonanceToQdB(next.resonance), t);
    },

    noteOn(note, velocity, at) {
      if (!patch) return;
      const t = now(at);
      setPitch(note, t);
      const g = amp.gain;
      g.cancelAndHoldAtTime(t);
      // An RC-style approach (95% at Attack) is anchored at `t`; a linear ramp would start
      // from the previous automation event instead, leaking sound before the Gate opens.
      g.setTargetAtTime(velocity, t, patch.ampAttack / 3);
      g.setTargetAtTime(velocity * patch.ampSustain, t + patch.ampAttack, patch.ampDecay / 4);
    },

    pitchChange(note, at) {
      setPitch(note, now(at));
    },

    noteOff(at) {
      if (!patch) return;
      const t = now(at);
      amp.gain.cancelAndHoldAtTime(t);
      amp.gain.setTargetAtTime(0, t, patch.ampRelease / 6);
    },
  };
}
