import { envelopeLevel, envelopeSchedule, type Adsr, type AutomationStep, type GateEvent } from '../modulation/envelope';
import { glideFrequency, glideTimeConstant, lfoPhase, lfoShape, type LfoWaveform } from '../modulation/lfo';
import { effectiveCutoff, LFO_CUTOFF_OCTAVES, LFO_PITCH_CENTS, LFO_PULSE_WIDTH, VELOCITY_CUTOFF_OCTAVES } from '../modulation/modulationModel';
import { filterStages, type Stage } from './filterDesign';
import { harmonicSeries } from '../music/harmonics';
import { noteToFrequency } from '../music/pitch';
import { GLIDE_OFF, PARAMS, type FilterMode, type Patch } from '../patch/patch';
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
  /** The LFO's value (−1 to 1). */
  lfo: number;
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

const LFO_TYPES: Record<LfoWaveform, OscillatorType> = { sine: 'sine', triangle: 'triangle', square: 'square', saw: 'sawtooth' };
const MIN_PULSE = 0.05;
const MAX_PULSE = 0.95;

/**
 * One Oscillator. Most Waveforms play their Fourier series directly (a PeriodicWave). A pulse is built the
 * analogue way, as a saw minus a delayed copy of itself: the delay (width / frequency) sets the Pulse Width and,
 * unlike a PeriodicWave, can be modulated smoothly (PWM). It is scaled to match the pulse's series exactly.
 */
function createVoiceOscillator(ctx: BaseAudioContext) {
  const node = ctx.createOscillator();
  const direct = ctx.createGain();
  const delay = ctx.createDelay(1);
  const inverted = ctx.createGain();
  const out = ctx.createGain();
  const pwm = ctx.createGain(); // LFO → delay time
  node.connect(direct).connect(out);
  node.connect(delay).connect(inverted).connect(out);
  pwm.connect(delay.delayTime);
  pwm.gain.value = 0;
  inverted.gain.value = 0;
  node.start();
  return { node, out, direct, delay, inverted, pwm };
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
  const voices = [createVoiceOscillator(ctx), createVoiceOscillator(ctx)];
  const [osc, osc2] = voices.map((v) => v.node);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.loop = true;
  const [mix1, mix2, mixNoise] = [ctx.createGain(), ctx.createGain(), ctx.createGain()];
  mix1.gain.value = OSCILLATOR_LEVEL;
  mix2.gain.value = 0;
  mixNoise.gain.value = 0;
  const mixer = ctx.createGain();
  voices[0].out.connect(mix1).connect(mixer);
  voices[1].out.connect(mix2).connect(mixer);
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

  // Velocity → Cutoff, the same way: the Note's Velocity (held until the next Note) times the amount, in cents.
  const noteVelocity = ctx.createConstantSource();
  noteVelocity.offset.value = 0;
  const velocityAmount = ctx.createGain();
  velocityAmount.gain.value = 0;
  noteVelocity.connect(velocityAmount);
  velocityAmount.connect(filter.detune);
  velocityAmount.connect(filter2.detune);
  noteVelocity.start();

  mixer.connect(filter).connect(filter2).connect(amp).connect(master).connect(safetyIn);
  safetyOut.connect(ctx.destination);
  // Taps are side branches, so observing never alters the sound.
  mixer.connect(taps.oscillator);
  filter2.connect(taps.filter);
  amp.connect(taps.amp);
  noise.start();

  // The LFO: a real oscillator, wired to each destination through a gain set from the Amount; the Modulation
  // model computes the same shape from its phase, so the Viewers move exactly as the sound does (ADR-0003).
  const lfo = ctx.createOscillator();
  lfo.frequency.value = PARAMS.lfoRate.default;
  const [lfoToCutoff, lfoToPitch] = [ctx.createGain(), ctx.createGain()];
  lfoToCutoff.gain.value = 0;
  lfoToPitch.gain.value = 0;
  lfo.connect(lfoToCutoff);
  lfoToCutoff.connect(filter.detune);
  lfoToCutoff.connect(filter2.detune);
  lfo.connect(lfoToPitch);
  for (const v of voices) {
    lfoToPitch.connect(v.node.detune);
    lfo.connect(v.pwm);
  }
  const lfoStart = ctx.currentTime;
  lfo.start(lfoStart);

  let patch: Patch | undefined;
  const waveKeys = new Map<OscillatorNode, string>();
  const pitches: { time: number; frequency: number; glide: number }[] = [];
  osc.frequency.value = noteToFrequency(69);
  osc2.frequency.value = noteToFrequency(69);
  // Patches in force over time, so past moments use the Cutoff and Amount of their time.
  const patches: { time: number; patch: Patch }[] = [];
  const ampEvents: GateEvent[] = [];
  const filterEvents: GateEvent[] = [];
  const pulseWidths = [0.5, 0.5];

  /** Point each pulse's delay at (width / frequency), and scale its LFO swing for that frequency. */
  const tunePulses = (frequency: number, t: number, timeConstant?: number) => {
    voices.forEach((v, i) => {
      const delay = pulseWidths[i] / frequency;
      if (timeConstant) v.delay.delayTime.setTargetAtTime(delay, t, timeConstant);
      else v.delay.delayTime.setValueAtTime(delay, t);
      const width = pulseWidths[i];
      const swing = patch?.lfoDestination === 'pulseWidth' ? Math.min(LFO_PULSE_WIDTH * patch.lfoAmount, width - MIN_PULSE, MAX_PULSE - width) : 0;
      v.pwm.gain.setValueAtTime(swing / frequency, t);
    });
  };

  const setPitch = (note: number, t: number) => {
    const frequency = noteToFrequency(note);
    const glide = patch && pitches.length && patch.glide > GLIDE_OFF * 1.001 ? patch.glide : 0;
    pitches.push({ time: t, frequency, glide });
    if (pitches.length > HISTORY) pitches.shift();
    for (const node of [osc, osc2]) {
      // Both Oscillators follow the Note; Osc 2's offsets ride on top, through its detune.
      node.frequency.cancelAndHoldAtTime(t);
      if (glide) node.frequency.setTargetAtTime(frequency, t, glideTimeConstant(glide));
      else node.frequency.setValueAtTime(frequency, t);
    }
    tunePulses(frequency, t, glide ? glideTimeConstant(glide) : undefined);
  };

  // Play exactly the Fourier series the Ideal Reference draws (normalisation is already in it). A pulse plays a
  // saw here, and becomes a pulse through the delayed, inverted copy.
  const sawPeak = harmonicSeries('saw', 0.5, WAVE_HARMONICS).magnitudes[1];
  const setWave = (index: number, waveform: Patch['waveform'], width: number) => {
    const v = voices[index];
    const t = ctx.currentTime;
    const pulse = waveform === 'pulse';
    const key = pulse ? 'saw' : waveform;
    if (waveKeys.get(v.node) !== key) {
      waveKeys.set(v.node, key);
      const { real, imag } = harmonicSeries(pulse ? 'saw' : waveform, 0.5, WAVE_HARMONICS);
      v.node.setPeriodicWave(ctx.createPeriodicWave(real, imag, { disableNormalization: true }));
    }
    pulseWidths[index] = width;
    // saw(t) − saw(t − d·T) has |Harmonic n| = 2·|sin(πnd)| × the saw's: scale it to the pulse series' level.
    const scale = pulse ? harmonicSeries('pulse', width, 256).magnitudes[1] / (2 * Math.sin(Math.PI * width) * sawPeak) : 1;
    v.direct.gain.setValueAtTime(scale, t);
    v.inverted.gain.setValueAtTime(pulse ? -scale : 0, t);
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

  // The LFO's Rate over time, from when it started: its phase is integrated across Rate changes.
  const lfoRates = () => [
    { time: lfoStart, rate: PARAMS.lfoRate.default },
    ...patches.map((p) => ({ time: p.time, rate: p.patch.lfoRate })),
  ];

  const modulationAt = (time?: number): Modulation => {
    const t = at(time);
    const filterLevel = envelopeLevel(filterEvents, t);
    const then = patchAt(t);
    const lfoValue = then ? lfoShape(then.lfoWaveform, lfoPhase(lfoRates(), t)) : 0;
    // The latest Note's Velocity (the Amp Envelope's peak), which stays in force until the next Note.
    let velocity = 0;
    for (const e of ampEvents) if (e.on && e.time <= t) velocity = e.peak;
    return {
      amp: envelopeLevel(ampEvents, t),
      filter: filterLevel,
      lfo: lfoValue,
      cutoff: then ? effectiveCutoff(then, filterLevel, lfoValue, velocity) : 0,
      mode: then?.filterMode ?? 'lowpass',
      bandwidth: then ? bandwidthOctaves(filterStages(then.filterMode, then.filterSlope, then.resonance)[0].Q) : 1,
    };
  };

  return {
    taps,
    // During a Glide, the frequency the Oscillators have reached: Cycle Lock follows the slide.
    fundamental: () => glideFrequency(pitches, ctx.currentTime) || noteToFrequency(69),
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
      setWave(0, next.waveform, next.pulseWidth);
      setWave(1, next.osc2Waveform, next.osc2PulseWidth);
      tunePulses(glideFrequency(pitches, t) || noteToFrequency(69), t);
      lfo.type = LFO_TYPES[next.lfoWaveform];
      lfo.frequency.setValueAtTime(next.lfoRate, t);
      lfoToCutoff.gain.setValueAtTime(next.lfoDestination === 'cutoff' ? LFO_CUTOFF_OCTAVES * 1200 * next.lfoAmount : 0, t);
      lfoToPitch.gain.setValueAtTime(next.lfoDestination === 'pitch' ? LFO_PITCH_CENTS * next.lfoAmount : 0, t);
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
      velocityAmount.gain.setValueAtTime(next.velocityCutoff * VELOCITY_CUTOFF_OCTAVES * 1200, t);
    },

    noteOn(note, velocity, time) {
      const t = at(time);
      noteVelocity.offset.setValueAtTime(velocity, t);
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
