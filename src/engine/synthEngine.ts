import { envelopeLevel, envelopeSchedule, type Adsr, type AutomationStep, type GateEvent } from '../modulation/envelope';
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

/** What the Modulation model says at a moment: both Envelope levels and the resulting Effective Cutoff. */
export interface Modulation {
  amp: number;
  filter: number;
  cutoff: number;
}

export interface SynthEngine {
  applyPatch(patch: Patch): void;
  noteOn(note: number, velocity: number, at?: number): void;
  pitchChange(note: number, at?: number): void;
  noteOff(at?: number): void;
  /** Frequency of the most recent Note (A4 before any), for Cycle Lock. */
  fundamental(): number;
  /** The Modulation model at `time` (default: now), from the Gate history — past times too, for the Timeline. */
  modulationAt(time?: number): Modulation;
  /** The Cutoff knob's own setting at `time` (before modulation). */
  baseCutoffAt(time: number): number;
  now(): number;
  /**
   * The Response Curve: gain (linear) at each frequency from the Oscillator Tap to the Filter Tap, at the
   * Effective Cutoff right now.
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
// Without Resonance compensation the worst resonant peak reaches ±1.8 at the Filter Tap (measured over Notes
// and Cutoffs at full Resonance); 0.45 keeps that under full scale at the output (about 0.83).
const MASTER_LEVEL = 0.45;

// Web Audio interprets a low-pass biquad's Q in dB: −3 dB is a flat Butterworth response.
const resonanceToQdB = (resonance: number) => -3.01 + resonance * 27;

// Enough Harmonics to reach Nyquist from the lowest Notes; the browser band-limits per pitch.
const WAVE_HARMONICS = 1024;
// Gate events kept for the Modulation model: plenty for the Envelope Timeline's few seconds.
const HISTORY = 64;

function createAnalyser(ctx: BaseAudioContext): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 8192;
  analyser.smoothingTimeConstant = 0;
  return analyser;
}

function play(param: AudioParam, steps: AutomationStep[], scale = 1) {
  for (const s of steps) {
    if (s.kind === 'cancelAndHold') param.cancelAndHoldAtTime(s.time);
    else param.setTargetAtTime(s.target * scale, s.time, s.timeConstant);
  }
}

const ampAdsr = (p: Patch): Adsr => ({ attack: p.ampAttack, decay: p.ampDecay, sustain: p.ampSustain, release: p.ampRelease });
const filterAdsr = (p: Patch): Adsr => ({ attack: p.filterAttack, decay: p.filterDecay, sustain: p.filterSustain, release: p.filterRelease });

/** The single Voice (Oscillator → Filter → Amp) built from native Web Audio nodes (ADR-0001). */
export function createSynthEngine(ctx: BaseAudioContext): SynthEngine {
  const osc = ctx.createOscillator();
  const oscLevel = ctx.createGain();
  oscLevel.gain.value = OSCILLATOR_LEVEL;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  // Never connected: a twin of the Filter set from the Modulation model, so the Response Curve shows the
  // Effective Cutoff even while the real Filter is being automated (ADR-0003).
  const responseTwin = ctx.createBiquadFilter();
  responseTwin.type = 'lowpass';
  const amp = ctx.createGain();
  amp.gain.value = 0;
  const master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;
  const taps: Taps = { oscillator: createAnalyser(ctx), filter: createAnalyser(ctx), amp: createAnalyser(ctx) };

  // The Filter Envelope (0–1) moves the Cutoff through `detune`, in cents: Cutoff × 2^(Amount × level),
  // exactly the model's law. Amount is a gain after the Envelope, so changing it mid-Note acts at once.
  const filterEnvelope = ctx.createConstantSource();
  filterEnvelope.offset.value = 0;
  const envelopeAmount = ctx.createGain();
  envelopeAmount.gain.value = 0;
  filterEnvelope.connect(envelopeAmount).connect(filter.detune);
  filterEnvelope.start();

  osc.connect(oscLevel).connect(filter).connect(amp).connect(master).connect(ctx.destination);
  // Taps are side branches, so observing never alters the sound.
  oscLevel.connect(taps.oscillator);
  filter.connect(taps.filter);
  amp.connect(taps.amp);
  osc.start();

  let patch: Patch | undefined;
  let waveKey = '';
  let fundamental = noteToFrequency(69);
  osc.frequency.value = fundamental;
  // Patches in force over time, so past moments use the Cutoff and Amount of their time.
  const patches: { time: number; patch: Patch }[] = [];
  const ampEvents: GateEvent[] = [];
  const filterEvents: GateEvent[] = [];

  const setPitch = (note: number, t: number) => {
    fundamental = noteToFrequency(note);
    osc.frequency.setValueAtTime(fundamental, t);
  };
  const at = (time?: number) => time ?? ctx.currentTime;

  /** Record a Gate change in the model's history, then play the model's schedule for it. */
  const gate = (on: boolean, t: number, velocity: number) => {
    if (!patch) return;
    const ampEvent: GateEvent = { time: t, on, adsr: ampAdsr(patch), peak: velocity };
    const filterEvent: GateEvent = { time: t, on, adsr: filterAdsr(patch), peak: 1 };
    for (const [events, e] of [[ampEvents, ampEvent], [filterEvents, filterEvent]] as const) {
      events.push(e);
      if (events.length > HISTORY) events.shift();
    }
    play(amp.gain, envelopeSchedule(ampEvent));
    play(filterEnvelope.offset, envelopeSchedule(filterEvent));
  };

  const patchAt = (t: number) => {
    for (let i = patches.length - 1; i >= 0; i--) if (patches[i].time <= t) return patches[i].patch;
    return patches[0]?.patch;
  };

  const modulationAt = (time?: number): Modulation => {
    const t = at(time);
    const filterLevel = envelopeLevel(filterEvents, t);
    const then = patchAt(t);
    return {
      amp: envelopeLevel(ampEvents, t),
      filter: filterLevel,
      cutoff: then ? effectiveCutoff(then, filterLevel) : 0,
    };
  };

  return {
    taps,
    fundamental: () => fundamental,
    modulationAt,
    baseCutoffAt: (time) => {
      const then = patchAt(time);
      return then ? effectiveCutoff(then) : 0;
    },
    now: () => ctx.currentTime,

    filterResponse(frequencies) {
      responseTwin.frequency.value = modulationAt().cutoff;
      const magnitude = new Float32Array(frequencies.length);
      responseTwin.getFrequencyResponse(frequencies, magnitude, new Float32Array(frequencies.length));
      return magnitude;
    },

    applyPatch(next) {
      patch = next;
      const t = ctx.currentTime;
      if (patches.at(-1)?.time === t) patches.pop();
      patches.push({ time: t, patch: next });
      if (patches.length > HISTORY * 4) patches.shift();
      // Play exactly the Fourier series the Ideal Reference draws (normalisation is already in it).
      const key = next.waveform === 'pulse' ? `pulse:${next.pulseWidth}` : next.waveform;
      if (key !== waveKey) {
        waveKey = key;
        const { real, imag } = harmonicSeries(next.waveform, next.pulseWidth, WAVE_HARMONICS);
        osc.setPeriodicWave(ctx.createPeriodicWave(real, imag, { disableNormalization: true }));
      }
      const qDb = resonanceToQdB(next.resonance);
      // The base Cutoff; the Filter Envelope adds to it through detune.
      filter.frequency.setValueAtTime(effectiveCutoff(next), t);
      filter.Q.setValueAtTime(qDb, t);
      envelopeAmount.gain.setValueAtTime(next.filterEnvAmount * 1200, t);
      responseTwin.Q.value = qDb;
    },

    noteOn(note, velocity, time) {
      const t = at(time);
      setPitch(note, t);
      gate(true, t, velocity);
    },

    pitchChange(note, time) {
      setPitch(note, at(time));
    },

    noteOff(time) {
      gate(false, at(time), 0);
    },
  };
}
