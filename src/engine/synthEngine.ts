import { effectiveCutoff } from '../modulation/modulationModel';
import { harmonicSeries } from '../music/harmonics';
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
  /** Frequency of the most recent Note (A4 before any), for Cycle Lock. */
  fundamental(): number;
  /**
   * The Response Curve: gain (linear) at each frequency from the Oscillator Tap to the Filter Tap, at the
   * Effective Cutoff. Includes the Resonance compensation, so it matches what the Filter Tap receives.
   */
  filterResponse(frequencies: Float32Array<ArrayBuffer>): Float32Array;
  readonly taps: Taps;
}

/**
 * Nominal Oscillator level: −6 dB below full scale, so resonant peaks have headroom and every Tap
 * can share one ±1 Scope scale. Floating-point audio never clips inside the graph, only at the output.
 */
export const OSCILLATOR_LEVEL = 0.5;
// Listening volume only, after the Amp Tap, so it is not part of what the Viewers show.
const MASTER_LEVEL = 0.8;

// Web Audio interprets a low-pass biquad's Q in dB: −3 dB is a flat Butterworth response.
const resonanceToQdB = (resonance: number) => -3.01 + resonance * 27;

// The resonant peak boosts by 10^(Q/20). Pulling the Filter's output down by the cube root of that
// keeps the loudest case under full scale, much as analogue ladder filters lose level with resonance.
// Enough Harmonics to reach Nyquist from the lowest Notes; the browser band-limits per pitch.
const WAVE_HARMONICS = 1024;

const resonanceCompensation = (qDb: number) => 10 ** (-Math.max(0, qDb) / 60);

function createAnalyser(ctx: BaseAudioContext): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 8192;
  analyser.smoothingTimeConstant = 0;
  return analyser;
}

/** The single Voice (Oscillator → Filter → Amp) built from native Web Audio nodes (ADR-0001). */
export function createSynthEngine(ctx: BaseAudioContext): SynthEngine {
  const osc = ctx.createOscillator();
  const oscLevel = ctx.createGain();
  oscLevel.gain.value = OSCILLATOR_LEVEL;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const compensation = ctx.createGain();
  // Never connected: a twin of the Filter set from the Modulation model, so the Response Curve shows the
  // Effective Cutoff even while the real Filter is being automated (ADR-0003).
  const responseTwin = ctx.createBiquadFilter();
  responseTwin.type = 'lowpass';
  const amp = ctx.createGain();
  amp.gain.value = 0;
  const master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;
  const taps: Taps = { oscillator: createAnalyser(ctx), filter: createAnalyser(ctx), amp: createAnalyser(ctx) };

  osc.connect(oscLevel).connect(filter).connect(compensation).connect(amp).connect(master).connect(ctx.destination);
  // Taps are side branches, so observing never alters the sound.
  oscLevel.connect(taps.oscillator);
  compensation.connect(taps.filter);
  amp.connect(taps.amp);
  osc.start();

  let patch: Patch | undefined;
  let waveKey = '';
  let fundamental = noteToFrequency(69);
  osc.frequency.value = fundamental;
  const setPitch = (note: number, t: number) => {
    fundamental = noteToFrequency(note);
    osc.frequency.setValueAtTime(fundamental, t);
  };
  const now = (at?: number) => at ?? ctx.currentTime;

  return {
    taps,
    fundamental: () => fundamental,

    filterResponse(frequencies) {
      const magnitude = new Float32Array(frequencies.length);
      responseTwin.getFrequencyResponse(frequencies, magnitude, new Float32Array(frequencies.length));
      const gain = resonanceCompensation(responseTwin.Q.value);
      for (let i = 0; i < magnitude.length; i++) magnitude[i] *= gain;
      return magnitude;
    },

    applyPatch(next) {
      patch = next;
      const t = ctx.currentTime;
      // Play exactly the Fourier series the Ideal Reference draws (normalisation is already in it).
      const key = next.waveform === 'pulse' ? `pulse:${next.pulseWidth}` : next.waveform;
      if (key !== waveKey) {
        waveKey = key;
        const { real, imag } = harmonicSeries(next.waveform, next.pulseWidth, WAVE_HARMONICS);
        osc.setPeriodicWave(ctx.createPeriodicWave(real, imag, { disableNormalization: true }));
      }
      const cutoff = effectiveCutoff(next);
      const qDb = resonanceToQdB(next.resonance);
      filter.frequency.setValueAtTime(cutoff, t);
      filter.Q.setValueAtTime(qDb, t);
      compensation.gain.setValueAtTime(resonanceCompensation(qDb), t);
      responseTwin.frequency.value = cutoff;
      responseTwin.Q.value = qDb;
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
