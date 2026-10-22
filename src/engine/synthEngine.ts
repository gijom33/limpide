import { envelopeLevel, envelopeSchedule, type Adsr, type AutomationStep, type GateEvent } from '../modulation/envelope';
import { effectiveCutoff } from '../modulation/modulationModel';
import { filterStages, type Stage } from './filterDesign';
import { harmonicSeries } from '../music/harmonics';
import { noteToFrequency } from '../music/pitch';
import type { FilterMode, Patch } from '../patch/patch';
import { bandwidthOctaves } from '../modulation/passBand';

/** Listening points in the Voice, one analyser each. */
export interface Taps {
  oscillator: AnalyserNode;
  filter: AnalyserNode;
  amp: AnalyserNode;
}

/** What the Modulation model says at a moment: both Envelope levels, the Effective Cutoff and the Filter's shape. */
export interface Modulation {
  amp: number;
  filter: number;
  cutoff: number;
  mode: FilterMode;
  /** Band-pass and notch width in octaves. */
  bandwidth: number;
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

const SAFETY_RANGE = 4;
const SAFETY_KNEE = 0.8;

/** Linear up to the knee, then a tanh bend towards (never past) full scale. */
function safetyCurve(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(4097);
  for (let i = 0; i < curve.length; i++) {
    const x = ((i / (curve.length - 1)) * 2 - 1) * SAFETY_RANGE;
    const over = Math.abs(x) - SAFETY_KNEE;
    const y = over <= 0 ? Math.abs(x) : SAFETY_KNEE + (1 - SAFETY_KNEE) * Math.tanh(over / (1 - SAFETY_KNEE));
    curve[i] = Math.sign(x) * y;
  }
  return curve;
}

// Noise: a seamless loop of white noise, generated from a fixed seed so every render is repeatable.
const NOISE_SECONDS = 2;
function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.round(NOISE_SECONDS * ctx.sampleRate), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x9e3779b9;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = (seed / 2 ** 32) * 2 - 1;
  }
  return buffer;
}

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

/** Set a biquad to a stage: scheduled at `t` for the playing filter, immediately (no `t`) for a twin. */
function setStage(node: BiquadFilterNode, stage: Stage, cutoff: number, t?: number) {
  node.type = stage.type;
  for (const [param, value] of [[node.frequency, cutoff], [node.Q, stage.Q], [node.gain, stage.gain]] as const) {
    if (t === undefined) param.value = value;
    else param.setValueAtTime(value, t);
  }
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
  // Sources → Mixer. Each source's Mixer level is scaled by the Nominal Level; the Mixer's output is the
  // Oscillator Tap.
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.loop = true;
  const [mix1, mix2, mixNoise] = [ctx.createGain(), ctx.createGain(), ctx.createGain()];
  mix1.gain.value = OSCILLATOR_LEVEL;
  mix2.gain.value = 0;
  mixNoise.gain.value = 0;
  const mixer = ctx.createGain();
  osc.connect(mix1).connect(mixer);
  osc2.connect(mix2).connect(mixer);
  noise.connect(mixNoise).connect(mixer);
  // Two stages: the second is transparent at 12 dB and doubles the Slope at 24 dB (filterStages).
  const filter = ctx.createBiquadFilter();
  const filter2 = ctx.createBiquadFilter();
  // Never connected: a twin of the Filter set from the Modulation model, so the Response Curve shows the
  // Effective Cutoff even while the real Filter is being automated (ADR-0003).
  const twins = [ctx.createBiquadFilter(), ctx.createBiquadFilter()];
  const amp = ctx.createGain();
  amp.gain.value = 0;
  const master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;
  // Protects the listener when several full-level sources and Resonance stack up. It sits after the Amp Tap,
  // so it never changes what the Viewers show (ADR-0006). Exactly linear below 0.8 of full scale; above, a
  // smooth bend that never passes 1. (A DynamicsCompressorNode was rejected: it adds make-up gain to every
  // sound and a few milliseconds of lookahead delay.)
  const [safetyIn, safety, safetyOut] = [ctx.createGain(), ctx.createWaveShaper(), ctx.createGain()];
  safetyIn.gain.value = 1 / SAFETY_RANGE; // the shaper's curve covers ±1; this lets it see inputs up to ±SAFETY_RANGE
  safety.curve = safetyCurve();
  safety.oversample = '4x';
  safetyIn.connect(safety).connect(safetyOut);
  const taps: Taps = { oscillator: createAnalyser(ctx), filter: createAnalyser(ctx), amp: createAnalyser(ctx) };

  // The Filter Envelope (0–1) moves the Cutoff through `detune`, in cents: Cutoff × 2^(Amount × level),
  // exactly the model's law. Amount is a gain after the Envelope, so changing it mid-Note acts at once.
  const filterEnvelope = ctx.createConstantSource();
  filterEnvelope.offset.value = 0;
  const envelopeAmount = ctx.createGain();
  envelopeAmount.gain.value = 0;
  filterEnvelope.connect(envelopeAmount);
  envelopeAmount.connect(filter.detune);
  envelopeAmount.connect(filter2.detune);
  filterEnvelope.start();

  mixer.connect(filter).connect(filter2).connect(amp).connect(master).connect(safetyIn);
  safetyOut.connect(ctx.destination);
  // Taps are side branches, so observing never alters the sound.
  mixer.connect(taps.oscillator);
  filter2.connect(taps.filter);
  amp.connect(taps.amp);
  osc.start();
  osc2.start();
  noise.start();

  let patch: Patch | undefined;
  const waveKeys = new Map<OscillatorNode, string>();
  let fundamental = noteToFrequency(69);
  osc.frequency.value = fundamental;
  osc2.frequency.value = fundamental;
  // Patches in force over time, so past moments use the Cutoff and Amount of their time.
  const patches: { time: number; patch: Patch }[] = [];
  const ampEvents: GateEvent[] = [];
  const filterEvents: GateEvent[] = [];

  const setPitch = (note: number, t: number) => {
    fundamental = noteToFrequency(note);
    osc.frequency.setValueAtTime(fundamental, t);
    osc2.frequency.setValueAtTime(fundamental, t); // Osc 2's offsets ride on top, through its detune
  };

  // Play exactly the Fourier series the Ideal Reference draws (normalisation is already in it).
  const setWave = (node: OscillatorNode, waveform: Patch['waveform'], pulseWidth: number) => {
    const key = waveform === 'pulse' ? `pulse:${pulseWidth}` : waveform;
    if (waveKeys.get(node) === key) return;
    waveKeys.set(node, key);
    const { real, imag } = harmonicSeries(waveform, pulseWidth, WAVE_HARMONICS);
    node.setPeriodicWave(ctx.createPeriodicWave(real, imag, { disableNormalization: true }));
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
      mode: then?.filterMode ?? 'lowpass',
      bandwidth: then ? bandwidthOctaves(filterStages(then.filterMode, then.filterSlope, then.resonance)[0].Q) : 1,
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
      const cutoff = modulationAt().cutoff;
      const total = new Float32Array(frequencies.length).fill(1);
      const stage = new Float32Array(frequencies.length);
      const phase = new Float32Array(frequencies.length);
      for (const twin of twins) {
        twin.frequency.value = cutoff;
        twin.getFrequencyResponse(frequencies, stage, phase);
        for (let i = 0; i < total.length; i++) total[i] *= stage[i];
      }
      return total;
    },

    applyPatch(next) {
      patch = next;
      const t = ctx.currentTime;
      if (patches.at(-1)?.time === t) patches.pop();
      patches.push({ time: t, patch: next });
      if (patches.length > HISTORY * 4) patches.shift();
      setWave(osc, next.waveform, next.pulseWidth);
      setWave(osc2, next.osc2Waveform, next.osc2PulseWidth);
      osc2.detune.setValueAtTime(next.osc2Octave * 1200 + next.osc2Semitone * 100 + next.osc2Detune, t);
      mix1.gain.setValueAtTime(next.mixOsc1 * OSCILLATOR_LEVEL, t);
      mix2.gain.setValueAtTime(next.mixOsc2 * OSCILLATOR_LEVEL, t);
      mixNoise.gain.setValueAtTime(next.mixNoise * OSCILLATOR_LEVEL, t);
      // The base Cutoff; the Filter Envelope adds to it through detune. The twins copy each stage for the curve.
      const stages = filterStages(next.filterMode, next.filterSlope, next.resonance);
      const cutoff = effectiveCutoff(next);
      [filter, filter2].forEach((node, i) => setStage(node, stages[i], cutoff, t));
      twins.forEach((node, i) => setStage(node, stages[i], cutoff));
      envelopeAmount.gain.setValueAtTime(next.filterEnvAmount * 1200, t);
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
