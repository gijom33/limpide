import { type Adsr, type AutomationStep, DIP, envelopeSchedule, type GateEvent, levelAfter } from '../modulation/envelope';
import { createLfoClock, glideFrequency, glideFrom, glideTimeConstant, LFO_START, type LfoWaveform, lfoShape } from '../modulation/lfo';
import {
  destinationSwings, effectiveCutoff, effectiveResonance, effectiveVolume, KEY_TRACK_CENTRE, type Modulation, soundingPitch,
  VELOCITY_CUTOFF_OCTAVES,
} from '../modulation/modulationModel';
import { bandwidthOctaves } from '../modulation/passBand';
import { harmonicSeries, type Waveform } from '../music/harmonics';
import { FM_INDEX, fmDepthKept, playedTop } from '../music/idealReference';
import { frequencyToNote, noteToFrequency } from '../music/pitch';
import { GLIDE_OFF, type Lfo, type LfoNumber, lfos, type NoiseColour, PARAMS, type Patch, type SubWaveform, type Voices } from '../patch/patch';
import { filterStages, type Stage } from './filterDesign';

/**
 * Which Voices the Amp Tap listens to: all of them summed (the app's default, so a chord is seen as it is heard), or
 * the newest Note's alone (ADR-0007). The Oscillator and Filter Taps always follow the newest Note.
 */
export type TapSource = 'newest' | 'all';
type TapName = keyof Taps;

/** Listening points, one analyser each, in the Voice of the newest Note (the Amp's, in every Voice when asked). */
export interface Taps {
  oscillator: AnalyserNode;
  filter: AnalyserNode;
  amp: AnalyserNode;
}

export interface SynthEngine {
  applyPatch(patch: Patch): void;
  /** A Note starts: on the one Voice (1 Voice), or on a free Voice (more). The Viewers follow it. */
  noteOn(note: number, velocity: number, at?: number): void;
  /** One Voice: the sounding Note changes pitch (last-note priority, Glide) without a new Gate. */
  pitchChange(note: number, at?: number): void;
  /** A keyboard's bend wheel: every Voice's pitch moves by `cents` from `at` on, until the next bend (issue 52). */
  setBend(cents: number, at?: number): void;
  /** The Gate closes: every Voice releases, a Note handed over to start or end later included (issue 101). */
  noteOff(at?: number): void;
  /** Several Voices: the Voice playing `note` releases; the others keep sounding. */
  release(note: number, at?: number): void;
  /** Frequency of the most recent Note (A4 before any), for Cycle Lock. */
  fundamental(): number;
  /** The Modulation model at `time` (default: now), from the Gate history — past times too, for the Timeline. */
  modulationAt(time?: number): Modulation;
  /**
   * The LFO's value times the Depth in force at `time` (−1 to 1): how far it moves its destination, as the plot draws
   * it. `modulationAt(time).lfo` alone (scaled), cheap enough to draw point by point.
   */
  lfoSwingAt(time: number, lfo?: LfoNumber): number;
  /** The Patch in force at `time` (none before the first): what the Timeline draws at that moment. */
  patchAt(time: number): Patch | undefined;
  now(): number;
  /**
   * The Response Curve: gain (linear) at each frequency from the Oscillator Tap to the Filter Tap, at the
   * Effective Cutoff of the moment the Spectrum shows (the middle of its window, about 85 ms ago), so a sweeping
   * Cutoff moves the Curve and the Harmonics together.
   */
  filterResponse(frequencies: Float32Array<ArrayBuffer>): Float32Array;
  /** Whether the output's safety limiter bent the sound in its last frame (the summed Voices, after the master). */
  limiting(): boolean;
  /** What the Amp Tap listens to: the Voice of the newest Note (the default), or every Voice summed. */
  setTapSource(source: TapSource): void;
  readonly taps: Taps;
}

/**
 * Nominal Oscillator level: −6 dB below full scale, so resonant peaks have headroom and every Tap
 * can share one ±1 Scope scale. Floating-point audio never clips inside the graph, only at the output.
 */
export const OSCILLATOR_LEVEL = 0.5;
/** How many Voices the engine builds; a Patch uses the first `voices` of them. */
export const MAX_VOICES = 8;
// Listening volume only, after the Amp Tap, so it is not part of what the Viewers show.
// Without Resonance compensation the worst resonant peak reaches ±1.8 at the Filter Tap (measured over Notes
// and Cutoffs at full Resonance); 0.45 keeps that under full scale at the output (about 0.83).
const MASTER_LEVEL = 0.45;

/** The bend wheel's steps are smoothed over this time constant, in seconds. */
const BEND_SMOOTHING = 0.004;

const SAFETY_RANGE = 4;
const SAFETY_KNEE = 0.8;
// The bend levels off a little below full scale: driven hard, the shaper's oversampling filter rings slightly
// past the curve, and this keeps even that under 1.
const SAFETY_CEILING = 0.97;

/** Linear up to the knee, then a tanh bend towards (never past) the ceiling. */
function safetyCurve(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(4097);
  const bend = SAFETY_CEILING - SAFETY_KNEE;
  for (let i = 0; i < curve.length; i++) {
    const x = ((i / (curve.length - 1)) * 2 - 1) * SAFETY_RANGE;
    const over = Math.abs(x) - SAFETY_KNEE;
    const y = over <= 0 ? Math.abs(x) : SAFETY_KNEE + bend * Math.tanh(over / bend);
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

const rmsOf = (data: Float32Array) => Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);

/**
 * Pink Noise (issue 92): the white loop through Paul Kellet's filter, falling 3 dB an octave, at white's RMS. The
 * filter runs over the loop twice and keeps the second pass, so its end leads into its start without a click; its
 * offset is taken out.
 */
function pinkBuffer(ctx: BaseAudioContext, white: AudioBuffer): AudioBuffer {
  const input = white.getChannelData(0);
  const buffer = ctx.createBuffer(1, input.length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const b = [0, 0, 0, 0, 0, 0, 0];
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      b[0] = 0.99886 * b[0] + x * 0.0555179;
      b[1] = 0.99332 * b[1] + x * 0.0750759;
      b[2] = 0.969 * b[2] + x * 0.153852;
      b[3] = 0.8665 * b[3] + x * 0.3104856;
      b[4] = 0.55 * b[4] + x * 0.5329522;
      b[5] = -0.7616 * b[5] - x * 0.016898;
      data[i] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + x * 0.5362;
      b[6] = x * 0.115926;
    }
  const mean = data.reduce((sum, v) => sum + v, 0) / data.length;
  for (let i = 0; i < data.length; i++) data[i] -= mean;
  const scale = rmsOf(input) / rmsOf(data);
  for (let i = 0; i < data.length; i++) data[i] *= scale;
  return buffer;
}

// Enough Harmonics to reach Nyquist from the lowest Notes; the browser band-limits per pitch.
const WAVE_HARMONICS = 1024;
// The Oscillators' waves cut short for Ring (issue 103) kept for the Notes to come: each holds many tables.
const CUT_WAVES = 32;
/**
 * Each Voice's offset is taken out below this, by a second-order high-pass (issue 103): FM with Osc 2 on Osc 1's pitch
 * puts a sideband at 0 Hz, and two in-tune waves through Ring their product's average. That offset holds from Note to
 * Note, so the filter settles once per Patch; this low, it bends a 110 Hz saw's ramps by about 2 % in the Scope, where
 * 5 Hz would bend them by 10 %.
 */
const DC_BLOCK = 1;
// A Voice's own pitches, kept to tune its pulses through a Glide.
const HISTORY = 64;
// The Modulation model's history (Gate events, the newest Note's pitches, Patches in force) is kept by age, not
// count, so the Timeline's past never changes however busily knobs turn: well beyond its few seconds, so a
// Freeze can be held a while. A count cap still bounds memory.
const MODEL_SECONDS = 30;
const MODEL_LIMIT = 4096;
/** Drop entries older than the model keeps, always keeping the one in force at the oldest kept time. */
/**
 * Add an entry to a history, first dropping any later than it: a Gate or a Note handed over ahead of the clock (the
 * Hold rhythm) is cancelled by one that comes earlier, as `cancelAndHoldAtTime` cancels it in the sound.
 */
function append<T extends { time: number }>(entries: T[], entry: T) {
  while (entries.length && entries[entries.length - 1].time > entry.time) entries.pop();
  entries.push(entry);
}

/** A Gate event in the model's history, with the Envelope's level when it came. */
type GateRecord = GateEvent & { start: number };

/** The index of the last entry at or before `t`, −1 if none: a binary search (the entries are in time order). */
function lastAt(entries: readonly { time: number }[], t: number): number {
  let lo = -1;
  let hi = entries.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (entries[mid].time <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function trim<T extends { time: number }>(entries: T[], now: number) {
  const oldest = now - MODEL_SECONDS;
  let drop = 0;
  while (drop + 1 < entries.length && entries[drop + 1].time <= oldest) drop++;
  if (entries.length - drop > MODEL_LIMIT) drop = entries.length - MODEL_LIMIT;
  if (drop) entries.splice(0, drop);
}

/** Samples each Tap's Viewers analyse: the Spectrum's frequency detail, and how far behind the sound it is. */
const TAP_WINDOW = 8192;

function createAnalyser(ctx: BaseAudioContext): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = TAP_WINDOW;
  analyser.smoothingTimeConstant = 0;
  return analyser;
}

/**
 * The LFO Waveforms as series of sines, as Web Audio defines its own oscillators, but not normalised: normalising
 * scales the series to its overshoot at the corners, so a square's plateaus would sit near ±0.85 and a saw's ramp
 * would fall short, while the Modulation model (and every Viewer) has them at exactly ±1 (ADR-0003). A sine and a
 * triangle play as Web Audio's own unless a restart starts them part-way through their cycle (issue 124).
 */
const LFO_SERIES: Record<LfoWaveform, (n: number) => number> = {
  sine: (n) => (n === 1 ? 1 : 0),
  triangle: (n) => (n % 2 ? (n % 4 === 1 ? 8 : -8) / (n * Math.PI) ** 2 : 0),
  square: (n) => (n % 2 ? 4 / (n * Math.PI) : 0),
  saw: (n) => (n % 2 ? 2 : -2) / (n * Math.PI),
  sawDown: (n) => (n % 2 ? -2 : 2) / (n * Math.PI),
};
const LFO_TERMS = 2048;

/**
 * Each term softened by Lanczos's sigma factor (issue 66). As written, the series rings at its jumps (Gibbs): to about
 * ±1.2 at 1 Hz, and still 5 % off the model a millisecond later. Softened, it is within 0.2 % of the model a
 * millisecond from the jump, its corner a fraction of a millisecond rounder; what little it still passes ±1 by
 * (about 5 %, for well under a millisecond) the LFO's clamp holds back.
 */
const sigma = (n: number) => Math.sin((Math.PI * n) / LFO_TERMS) / ((Math.PI * n) / LFO_TERMS);

/**
 * An LFO Waveform whose cycle starts at phase `start` of the Modulation model's (`lfoShape`'s): an oscillator always
 * starts at its wave's phase 0, so a retriggered one is given its wave turned to start there (issue 124). Each term
 * sin(2πn(p + start)) is a sine and a cosine of 2πnp.
 */
function lfoWave(ctx: BaseAudioContext, waveform: LfoWaveform, start: number): PeriodicWave {
  const [real, imag] = [new Float32Array(LFO_TERMS), new Float32Array(LFO_TERMS)];
  for (let n = 1; n < LFO_TERMS; n++) {
    const term = LFO_SERIES[waveform](n) * sigma(n);
    real[n] = term * Math.sin(2 * Math.PI * n * start);
    imag[n] = term * Math.cos(2 * Math.PI * n * start);
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

/**
 * Where an LFO's oscillators meet, before its Destinations: a waveshaper passing −1 to 1 as they are and holding
 * anything past them at ±1, so no Destination is moved further than the model says, at any Rate (the browser drops a
 * series' top terms at fast ones, whatever softening they had), and the tremolo's gain never passes the Envelope's
 * level nor flips polarity (issue 66).
 */
function lfoClamp(ctx: BaseAudioContext): WaveShaperNode {
  const clamp = ctx.createWaveShaper();
  clamp.curve = Float32Array.of(-1, 1);
  return clamp;
}

/**
 * Set an LFO oscillator's Waveform, its cycle starting at phase `start` (where it was restarted, issue 124): a sine or
 * a triangle (whose series never overshoots) starting at 0 as Web Audio's own.
 */
function setLfoWaveform(lfo: OscillatorNode, waveform: LfoWaveform, start: number, wave: (w: LfoWaveform, start: number) => PeriodicWave) {
  if (start === 0 && (waveform === 'sine' || waveform === 'triangle')) lfo.type = waveform;
  else lfo.setPeriodicWave(wave(waveform, start));
}

/** A stop for a node to play on: a stop called again replaces the last, and there is no way to take one back. */
const NEVER = 1e9;

/**
 * The oscillators behind one that can start its cycle again (issue 94): an OscillatorNode cannot be reset, so at each
 * restart a new one takes over. A restart handed over ahead of now leaves the node it replaces running until then;
 * one earlier still stops every node at its own moment, so one node sounds at a time however restarts arrive (issue
 * 101). An ended node is cut off by `cut`.
 */
function createTakeover(first: OscillatorNode, start: number, cut: (node: OscillatorNode) => void) {
  // Each node not yet ended, and when it starts and stops.
  const running = new Map<OscillatorNode, { start: number; stop: number }>();
  const add = (node: OscillatorNode, at: number) => {
    running.set(node, { start: at, stop: Infinity });
    node.onended = () => {
      running.delete(node);
      cut(node);
    };
    node.start(at);
  };
  add(first, start);
  let restartAt = -1;
  return {
    /** Every node not yet ended: a new wave or rate reaches each. */
    nodes: () => running.keys(),
    /** Every node not yet ended, and when it starts. */
    starts: () => [...running].map(([node, span]) => [node, span.start] as const),
    /** A node from `make` takes over at `t`; a second restart at the same moment is the same one (false). */
    restart(t: number, make: () => OscillatorNode) {
      if (t === restartAt) return false;
      restartAt = t;
      for (const [node, span] of running) {
        if (span.stop <= t) continue;
        node.stop(t); // one not yet started never sounds, and ends all the same
        span.stop = t;
      }
      add(make(), t);
      return true;
    },
    /**
     * The restarts handed over for after `t` are called off (a Gate off before their Notes, issue 102): their nodes
     * never sound, and the node sounding at `t` plays on, rather than restart inside the Release.
     */
    cancelAfter(t: number) {
      for (const [node, span] of running) {
        if (span.start > t) {
          node.stop(t);
          span.stop = t;
        } else if (span.stop > t && span.stop !== Infinity) {
          node.stop(NEVER);
          span.stop = Infinity;
        }
      }
      if (restartAt > t) restartAt = -1;
    },
  };
}

/**
 * An oscillator that can start its cycle again (issue 94). Everything that moves its pitch reaches it through two
 * constant sources that stay for the Voice's life, its frequency (Hz) and its detune (cents): each node, at 0 on
 * both, only adds them up, so a restart rewires nothing but the node itself.
 */
function createRestartable(ctx: BaseAudioContext, frequency: number, outputs: AudioNode[]) {
  const [hz, cents] = [ctx.createConstantSource(), ctx.createConstantSource()];
  hz.offset.value = frequency;
  cents.offset.value = 0;
  hz.start();
  cents.start();
  // The wave each node plays: a node handed over for a later Note plays that Note's (issue 103).
  const waves = new Map<OscillatorNode, PeriodicWave>();
  const play = (node: OscillatorNode, wave: PeriodicWave) => {
    if (waves.get(node) === wave) return;
    node.setPeriodicWave(wave);
    waves.set(node, wave);
  };
  let latest: OscillatorNode;
  const make = (wave?: PeriodicWave) => {
    const node = ctx.createOscillator();
    node.frequency.value = 0;
    node.detune.value = 0;
    if (wave) play(node, wave);
    hz.connect(node.frequency);
    cents.connect(node.detune);
    for (const o of outputs) node.connect(o);
    latest = node;
    return node;
  };
  // An ended node is cut from what feeds it as well as from what it feeds (issue 101).
  const takeover = createTakeover(make(), ctx.currentTime, (node) => {
    hz.disconnect(node.frequency);
    cents.disconnect(node.detune);
    node.disconnect();
    waves.delete(node);
  });
  return {
    frequency: hz.offset,
    detune: cents.offset,
    /** Each node not yet ended plays `waveAt(when it starts)`, so one handed over for a later Note keeps that Note's. */
    setWave(waveAt: (start: number) => PeriodicWave) {
      for (const [node, start] of takeover.starts()) play(node, waveAt(start));
    },
    /**
     * Start the cycle again at `t`, on `wave`; the node it takes over from keeps its own until `t`. A second restart at
     * the same moment is the same one: its node plays the later Note's `wave`.
     */
    restart(t: number, wave: PeriodicWave) {
      if (!takeover.restart(t, () => make(wave))) play(latest, wave);
    },
    cancelAfter: takeover.cancelAfter,
  };
}
type Restartable = ReturnType<typeof createRestartable>;

/**
 * One Oscillator. Most Waveforms play their Fourier series directly (a PeriodicWave). A pulse is built the
 * analogue way, as a saw minus a delayed copy of itself: the delay (width / frequency) sets the Pulse Width and,
 * unlike a PeriodicWave, can be modulated smoothly (PWM). It is scaled to match the pulse's series exactly. After a
 * restart the delay still holds the old cycle for one width: a fraction of a cycle, inside the Note's attack.
 */
function createVoiceOscillator(ctx: BaseAudioContext) {
  const direct = ctx.createGain();
  const delay = ctx.createDelay(1);
  const inverted = ctx.createGain();
  const out = ctx.createGain();
  const pwm = [ctx.createGain(), ctx.createGain()]; // each LFO → delay time
  const source: Restartable = createRestartable(ctx, A4, [direct, delay]);
  direct.connect(out);
  delay.connect(inverted).connect(out);
  for (const g of pwm) {
    g.connect(delay.delayTime);
    g.gain.value = 0;
  }
  inverted.gain.value = 0;
  return { source, out, direct, delay, inverted, pwm };
}

/** Set a biquad to a stage: scheduled at `t` for the playing filter, immediately (no `t`) for a twin. */
function setStage(node: BiquadFilterNode, stage: Stage, cutoff: number, t?: number) {
  node.type = stage.type;
  for (const [param, value] of [[node.frequency, cutoff], [node.Q, stage.Q], [node.gain, stage.gain]] as const) {
    if (t === undefined) param.value = value;
    else param.setValueAtTime(value, t);
  }
}

/**
 * Drops what is scheduled on `param` after `t`, holding the value it has then. Firefox has no `cancelAndHoldAtTime`
 * (issue 46): there the value held is the current one, which differs only while a ramp is under way at `t`.
 */
function holdAt(param: AudioParam, t: number) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(t);
  } else {
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
  }
}

function play(param: AudioParam, steps: AutomationStep[], scale = 1) {
  for (const s of steps) {
    if (s.kind === 'cancelAndHold') holdAt(param, s.time);
    else if (s.kind === 'cancelAndSet') {
      param.cancelScheduledValues(s.time);
      param.setValueAtTime(s.value * scale, s.time);
    } else if (s.kind === 'linearRamp') param.linearRampToValueAtTime(s.target * scale, s.time);
    else param.setTargetAtTime(s.target * scale, s.time, s.timeConstant);
  }
}

const ampAdsr = (p: Patch): Adsr => ({ attack: p.ampAttack, decay: p.ampDecay, sustain: p.ampSustain, release: p.ampRelease });
const filterAdsr = (p: Patch): Adsr => ({ attack: p.filterAttack, decay: p.filterDecay, sustain: p.filterSustain, release: p.filterRelease });

// A released Voice counts as free again once its Release has run this many time constants.
const RELEASE_TAIL = 6;
// Below this level (−60 dB) a Voice counts as silent: a Note restarts its Oscillators at once, with no dip (issue 102).
const SILENT = 0.001;
const A4 = noteToFrequency(69);

/**
 * One LFO: a real oscillator, wired to each destination through a gain set from its Depth (zero unless it is aimed
 * there): the Cutoff and the pitch in cents (through `detune`), Osc 2's tuning in cents, each Filter stage's Q, the
 * tremolo's gain.
 * Pulse Width goes through each Voice's own gains, since its swing depends on the Note. The oscillator feeds a bus
 * the rest is wired to, so a retriggering Note can swap in a new oscillator that starts its cycle at that Note; the
 * bus is the LFO's clamp, holding it within ±1.
 */
interface LfoNodes {
  takeover: ReturnType<typeof createTakeover>;
  bus: WaveShaperNode;
  toCutoff: GainNode;
  toPitch: GainNode;
  toOsc2: GainNode;
  toQ: [GainNode, GainNode];
  toVolume: GainNode;
}

/** What every Voice shares: the LFOs, the pitch bend, the noise loop, the Oscillators' waves, and where the Voices' outputs go. */
interface Shared {
  lfos: [LfoNodes, LfoNodes];
  /** The pitch bend in cents, into every Oscillator's detune (the LFO on Pitch goes there too). */
  bend: ConstantSourceNode;
  /** The tremolo's resting gain, into every Voice's: 1 less the LFOs' total swing on Volume. */
  tremoloRest: ConstantSourceNode;
  noise: Record<NoiseColour, AudioBuffer>;
  /** A Waveform's series up to its Harmonic `harmonics`, as a wave the Oscillators play. */
  wave(waveform: Exclude<Waveform, 'pulse'>, harmonics: number): PeriodicWave;
  master: GainNode;
}

/**
 * One Voice: Oscillators → Mixer → Filter → Amp, built from native Web Audio nodes (ADR-0001), with its own
 * Envelopes, Velocity and Key Track sources. The engine builds MAX_VOICES of these; a Patch with 1 Voice only
 * ever plays the first, exactly as the monophonic instrument did.
 */
function createVoice(ctx: BaseAudioContext, shared: Shared, index: number) {
  // Sources → Mixer. Each source's Mixer level is scaled by the Nominal Level; the Mixer's output, its offset taken
  // out, is the Oscillator Tap.
  const oscillators = [createVoiceOscillator(ctx), createVoiceOscillator(ctx)];
  const [osc, osc2] = oscillators.map((v) => v.source);
  // Both colours of Noise run; the Patch's colour is the one let through.
  const noises = (['white', 'pink'] as const).map((colour) => {
    const source = ctx.createBufferSource();
    source.buffer = shared.noise[colour];
    source.loop = true;
    const gate = ctx.createGain();
    gate.gain.value = colour === 'white' ? 1 : 0;
    source.connect(gate);
    return { colour, source, gate };
  });
  const [mix1, mix2, mixNoise] = [ctx.createGain(), ctx.createGain(), ctx.createGain()];
  mix1.gain.value = OSCILLATOR_LEVEL;
  mix2.gain.value = 0;
  mixNoise.gain.value = 0;
  const mixer = ctx.createGain();
  oscillators[0].out.connect(mix1).connect(mixer);
  oscillators[1].out.connect(mix2).connect(mixer);
  for (const n of noises) n.gate.connect(mixNoise);
  mixNoise.connect(mixer);
  // Ring Modulation (issue 88): Osc 1 through a gain that Osc 2 sets, so their product, before their own levels.
  // Cross-modulation (issue 89): Osc 2 into Osc 1's frequency, through a gain that tracks the Note (see crossDepth).
  const cross = ctx.createGain();
  cross.gain.value = 0;
  oscillators[1].out.connect(cross).connect(osc.frequency);
  const crossLfos = [ctx.createGain(), ctx.createGain()]; // each LFO → FM's gain (issue 97), scaled as crossDepth
  for (const g of crossLfos) {
    g.gain.value = 0;
    g.connect(cross.gain);
  }
  const ring = ctx.createGain();
  ring.gain.value = 0;
  oscillators[0].out.connect(ring);
  oscillators[1].out.connect(ring.gain);
  const mixRing = ctx.createGain();
  mixRing.gain.value = 0;
  ring.connect(mixRing).connect(mixer);
  // The Sub-oscillator: a square or a sine, one or two octaves below Osc 1 (issue 91), following its pitch, Glide and
  // vibrato. It runs an octave down; its detune takes it the second.
  const mixSub = ctx.createGain();
  mixSub.gain.value = 0;
  const sub = createRestartable(ctx, A4 / 2, [mixSub]);
  const subWaves = Object.fromEntries(
    (['square', 'sine'] as const).map((w) => {
      const { real, imag } = harmonicSeries(w, 0.5, WAVE_HARMONICS);
      return [w, ctx.createPeriodicWave(real, imag, { disableNormalization: true })];
    }),
  ) as Record<SubWaveform, PeriodicWave>;
  let subWaveform: SubWaveform = 'square';
  sub.setWave(() => subWaves.square);
  mixSub.connect(mixer);
  const dcBlock = ctx.createBiquadFilter();
  dcBlock.type = 'highpass';
  dcBlock.frequency.value = DC_BLOCK;
  dcBlock.Q.value = -3.01; // in dB: a flat Butterworth response
  mixer.connect(dcBlock);
  // Two stages: the second is transparent at 12 dB and doubles the Slope at 24 dB (filterStages).
  const filter = ctx.createBiquadFilter();
  const filter2 = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  amp.gain.value = 0;
  // After the Amp, the LFOs on Volume (tremolo): its gain is the shared resting level plus each LFO's swing.
  const tremoloGain = ctx.createGain();
  tremoloGain.gain.value = 0;
  shared.tremoloRest.connect(tremoloGain.gain);

  // The Filter Envelope (0–1) moves the Cutoff through `detune`, in cents: Cutoff × 2^(Amount × level),
  // exactly the model's law. Amount is a gain after the Envelope, so changing it mid-Note acts at once.
  const filterEnvelope = ctx.createConstantSource();
  filterEnvelope.offset.value = 0;
  const envelopeAmount = ctx.createGain();
  envelopeAmount.gain.value = 0;
  filterEnvelope.connect(envelopeAmount);
  envelopeAmount.connect(filter.detune);
  envelopeAmount.connect(filter2.detune);
  // The same Envelope on Osc 2's pitch (issue 93): its Env Amount in cents.
  const osc2EnvAmount = ctx.createGain();
  osc2EnvAmount.gain.value = 0;
  filterEnvelope.connect(osc2EnvAmount).connect(osc2.detune);
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

  // Key Track, the same way: the Note (in semitones from C4, gliding as the Oscillators do) times the amount.
  const trackedNote = ctx.createConstantSource();
  trackedNote.offset.value = 69 - KEY_TRACK_CENTRE; // the Oscillators start on A4
  const keyTrackAmount = ctx.createGain();
  keyTrackAmount.gain.value = 0;
  trackedNote.connect(keyTrackAmount);
  keyTrackAmount.connect(filter.detune);
  keyTrackAmount.connect(filter2.detune);
  trackedNote.start();

  dcBlock.connect(filter).connect(filter2).connect(amp).connect(tremoloGain).connect(shared.master);
  // Every Voice's noise starts at a different point of the loop, so a chord's noise is not one noise, louder.
  for (const n of noises) n.source.start(0, (index * NOISE_SECONDS) / MAX_VOICES);

  // The shared LFOs, wired to this Voice's destinations through the shared gains set from their Depths.
  shared.lfos.forEach((l, i) => {
    l.toCutoff.connect(filter.detune);
    l.toCutoff.connect(filter2.detune);
    l.toQ[0].connect(filter.Q);
    l.toQ[1].connect(filter2.Q);
    l.toPitch.connect(sub.detune);
    l.toOsc2.connect(osc2.detune);
    l.toVolume.connect(tremoloGain.gain);
    for (const o of oscillators) {
      l.toPitch.connect(o.source.detune);
      l.bus.connect(o.pwm[i]);
    }
    l.bus.connect(crossLfos[i]);
  });
  shared.bend.connect(sub.detune);
  for (const o of oscillators) shared.bend.connect(o.source.detune);

  const pulseWidths = [0.5, 0.5];
  // Each Oscillator's pitch over the Note's, from its knobs: a pulse's width is a fraction of its own cycle (issue 90).
  const ratios = [1, 1];
  /**
   * FM's gain on a Note of `frequency`: the index times Osc 2's frequency, in Hz. Osc 1's Octave scales what
   * reaches its frequency, so the gain is divided by it, keeping the index the knob's.
   */
  const crossDepth = (frequency: number, fm = patch?.crossMod ?? 0) => (fm * FM_INDEX * frequency * ratios[1]) / ratios[0];
  /**
   * FM's gain, and each LFO's swing of it by its law (issue 97), on a Note of `frequency`: at once, or over a Glide.
   * High up, all of them shrink together as far as keeps Osc 1's sidebands under the top (issue 103).
   */
  const tuneCross = (frequency: number, t: number, timeConstant?: number) => {
    const swings = patch ? destinationSwings(patch, 'fm', patch.crossMod) : [0, 0];
    const kept = patch ? fmDepthKept(patch, frequency * ratios[0], ctx.sampleRate) : 1;
    [cross, ...crossLfos].forEach((node, i) => {
      const depth = crossDepth(frequency, i ? swings[i - 1] : undefined) * kept;
      if (timeConstant) node.gain.setTargetAtTime(depth, t, timeConstant);
      else node.gain.setValueAtTime(depth, t);
    });
  };
  const pitches: { time: number; frequency: number; note: number; glide: number }[] = [];
  let patch: Patch | undefined;

  /** Point each pulse's delay at (width / frequency), and scale its LFO swing for that frequency. */
  const tunePulses = (frequency: number, t: number, timeConstant?: number) => {
    oscillators.forEach((o, i) => {
      const own = frequency * ratios[i];
      const delay = pulseWidths[i] / own;
      if (timeConstant) o.delay.delayTime.setTargetAtTime(delay, t, timeConstant);
      else o.delay.delayTime.setValueAtTime(delay, t);
      const width = pulseWidths[i];
      const swings = patch ? destinationSwings(patch, 'pulseWidth', width) : [0, 0];
      swings.forEach((swing, n) => o.pwm[n].gain.setValueAtTime(swing / own, t));
    });
  };

  /**
   * How many Harmonics Osc 1 and Osc 2 play on a Note of `frequency`: all of them, but while Ring is up only those whose
   * products with the other's stay under the top of what the browser plays, so Ring's sums do not fold back (issue
   * 103). A Sine needs only its own pitch; two richer waves share the top evenly. Each keeps at least its first.
   */
  const harmonicsOn = (frequency: number): number[] => {
    if (!patch?.mixRing) return [WAVE_HARMONICS, WAVE_HARMONICS];
    const hz = ratios.map((r) => frequency * r);
    const rich = [patch.waveform, patch.osc2Waveform].map((w) => w !== 'sine');
    const top = playedTop(ctx.sampleRate);
    const reach = (i: number) => (rich[i] ? Math.max(top / 2, hz[i]) : hz[i]);
    return [0, 1].map((i) => (rich[i] ? Math.min(WAVE_HARMONICS, Math.max(1, Math.floor((top - reach(1 - i)) / hz[i]))) : WAVE_HARMONICS));
  };
  /** Osc `i`'s wave on a Note of `frequency`. */
  const waveOn = (i: number, frequency: number) => {
    const waveform = (i ? patch?.osc2Waveform : patch?.waveform) ?? 'saw';
    return shared.wave(waveform === 'pulse' ? 'saw' : waveform, harmonicsOn(frequency)[i]);
  };

  // Play exactly the Fourier series the Ideal Reference draws (normalisation is already in it). A pulse plays a
  // saw here, and becomes a pulse through the delayed, inverted copy.
  const sawPeak = harmonicSeries('saw', 0.5, WAVE_HARMONICS).magnitudes[1];
  const setWave = (i: number, waveform: Patch['waveform'], width: number, t: number) => {
    const o = oscillators[i];
    const pulse = waveform === 'pulse';
    // The node sounding at `t` takes the wave for the pitch then; one handed over for a later Note, that Note's.
    o.source.setWave((start) => waveOn(i, start > t ? pitches[lastAt(pitches, start)].frequency : frequencyAt(t)));
    pulseWidths[i] = width;
    // saw(t) − saw(t − d·T) has |Harmonic n| = 2·|sin(πnd)| × the saw's: scale it to the pulse series' level.
    const scale = pulse ? harmonicSeries('pulse', width, 256).magnitudes[1] / (2 * Math.sin(Math.PI * width) * sawPeak) : 1;
    o.direct.gain.setValueAtTime(scale, t);
    o.inverted.gain.setValueAtTime(pulse ? -scale : 0, t);
  };

  const frequencyAt = (t: number) => glideFrequency(pitches, t) || A4;

  const voice = {
    /** The Note this Voice is playing or releasing; null once it has faded. */
    note: null as number | null,
    /** Its own Amp Envelope's Gate events, so a Note can tell whether it still sounds (issue 102). */
    amps: [] as GateRecord[],
    startedAt: -Infinity,
    /** When its key went up, and when its Release will have faded, or null while the key is down. */
    releasedAt: null as number | null,
    freeAt: -Infinity,
    pitches,

    /** Move to a Note: at once, or sliding there over the Glide. */
    setPitch(note: number, t: number, glide: number) {
      const frequency = noteToFrequency(note);
      append(pitches, { time: t, frequency, note, glide });
      if (pitches.length > HISTORY) pitches.shift();
      for (const [node, f] of [[osc, frequency], [osc2, frequency], [sub, frequency / 2]] as const) {
        // Every Oscillator follows the Note, the Sub from an octave down: Osc 1's Octave, Osc 2's offsets and the Sub's
        // second octave ride on top, through their detunes.
        holdAt(node.frequency, t);
        if (glide) node.frequency.setTargetAtTime(f, t, glideTimeConstant(glide));
        else node.frequency.setValueAtTime(f, t);
      }
      tunePulses(frequency, t, glide ? glideTimeConstant(glide) : undefined);
      for (const node of [cross, ...crossLfos]) holdAt(node.gain, t);
      tuneCross(frequency, t, glide ? glideTimeConstant(glide) : undefined);
      holdAt(trackedNote.offset, t);
      if (glide) trackedNote.offset.setTargetAtTime(note - KEY_TRACK_CENTRE, t, glideTimeConstant(glide));
      else trackedNote.offset.setValueAtTime(note - KEY_TRACK_CENTRE, t);
    },

    /**
     * Start Osc 1, Osc 2 and the Sub at the start of their cycles, together (issue 94): each Note sounds the same. Osc 1
     * and Osc 2 start on their waves for the Note's `frequency` (issue 103).
     */
    restart(t: number, frequency: number) {
      [osc, osc2].forEach((o, i) => o.restart(t, waveOn(i, frequency)));
      sub.restart(t, subWaves[subWaveform]);
    },
    /** Call off their restarts after `t`, for a Note whose Gate closed before it started (issue 102). */
    cancelRestarts(t: number) {
      for (const o of [osc, osc2, sub]) o.cancelAfter(t);
    },

    /**
     * Play the model's Envelope schedules for a Gate change. After a dip the Attack carries on from its silence with no
     * hold between: without cancelAndHoldAtTime (Firefox) a hold would bring back the level from before the dip.
     */
    gate(ampEvent: GateEvent, filterEvent: GateEvent, velocity: number, dip?: GateRecord) {
      if (ampEvent.on) noteVelocity.offset.setValueAtTime(velocity, ampEvent.time);
      const attack = envelopeSchedule(ampEvent);
      play(amp.gain, dip ? [...envelopeSchedule(dip, dip.start), ...attack.filter((s) => s.kind !== 'cancelAndHold')] : attack);
      play(filterEnvelope.offset, envelopeSchedule(filterEvent));
    },

    apply(next: Patch, t: number) {
      patch = next;
      const osc2Tuning = next.osc2Octave * 1200 + next.osc2Semitone * 100 + next.osc2Detune;
      ratios[0] = 2 ** next.osc1Octave;
      ratios[1] = 2 ** (osc2Tuning / 1200);
      setWave(0, next.waveform, next.pulseWidth, t);
      setWave(1, next.osc2Waveform, next.osc2PulseWidth, t);
      tunePulses(frequencyAt(t), t);
      tuneCross(frequencyAt(t), t);
      // Osc 1's Octave moves it and the Sub; Osc 2's offsets count from the Note.
      osc.detune.setValueAtTime(next.osc1Octave * 1200, t);
      sub.detune.setValueAtTime((next.osc1Octave + next.subOctave + 1) * 1200, t);
      if (next.subWaveform !== subWaveform) {
        subWaveform = next.subWaveform;
        sub.setWave(() => subWaves[next.subWaveform]);
      }
      osc2.detune.setValueAtTime(osc2Tuning, t);
      mix1.gain.setValueAtTime(next.mixOsc1 * OSCILLATOR_LEVEL, t);
      mix2.gain.setValueAtTime(next.mixOsc2 * OSCILLATOR_LEVEL, t);
      mixNoise.gain.setValueAtTime(next.mixNoise * OSCILLATOR_LEVEL, t);
      for (const n of noises) n.gate.gain.setValueAtTime(n.colour === next.noiseColour ? 1 : 0, t);
      mixSub.gain.setValueAtTime(next.mixSub * OSCILLATOR_LEVEL, t);
      mixRing.gain.setValueAtTime(next.mixRing * OSCILLATOR_LEVEL, t);
      // The base Cutoff; the Filter Envelope adds to it through detune.
      const stages = filterStages(next.filterMode, next.filterSlope, next.resonance);
      const cutoff = effectiveCutoff(next);
      [filter, filter2].forEach((node, i) => setStage(node, stages[i], cutoff, t));
      envelopeAmount.gain.setValueAtTime(next.filterEnvAmount * 1200, t);
      osc2EnvAmount.gain.setValueAtTime(next.osc2EnvAmount * 100, t);
      velocityAmount.gain.setValueAtTime(next.velocityCutoff * VELOCITY_CUTOFF_OCTAVES * 1200, t);
      keyTrackAmount.gain.setValueAtTime(next.keyTrack * 100, t); // cents per semitone
    },

    /** A Tap listens to this Voice's stage: a side branch, so observing never alters the sound. */
    attach(taps: Taps, tap: TapName) {
      ({ oscillator: dcBlock, filter: filter2, amp: tremoloGain } as const)[tap].connect(taps[tap]);
    },
    detach(taps: Taps, tap: TapName) {
      ({ oscillator: dcBlock, filter: filter2, amp: tremoloGain } as const)[tap].disconnect(taps[tap]);
    },
  };
  return voice;
}
type Voice = ReturnType<typeof createVoice>;

/**
 * The instrument: up to MAX_VOICES Voices (Oscillator → Filter → Amp each) summed into one master and safety
 * stage, with one LFO shared. The Taps, the Modulation model and Cycle Lock follow the Voice of the newest Note,
 * so the Viewers always show one Note as if it were played alone (ADR-0007).
 */
export function createSynthEngine(ctx: BaseAudioContext): SynthEngine {
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
  master.connect(safetyIn).connect(safety).connect(safetyOut).connect(ctx.destination);
  // Listens to what reaches the limiter, so the Viewers can say when it is bending the sound (a chord can reach
  // the knee while the one Voice the Amp Tap shows stays well under it).
  const limiterInput = ctx.createAnalyser();
  limiterInput.fftSize = 2048;
  limiterInput.smoothingTimeConstant = 0;
  master.connect(limiterInput);
  const limiterFrame = new Float32Array(limiterInput.fftSize);
  const taps: Taps = { oscillator: createAnalyser(ctx), filter: createAnalyser(ctx), amp: createAnalyser(ctx) };
  // Never connected: a twin of the Filter set from the Modulation model, so the Response Curve shows the
  // Effective Cutoff even while the real Filter is being automated (ADR-0003).
  const twins = [ctx.createBiquadFilter(), ctx.createBiquadFilter()];

  // The LFOs: real oscillators, wired to each destination through gains set from their Depths; the Modulation
  // model computes the same shapes from their phases, so the Viewers move exactly as the sound does (ADR-0003).
  const lfoNodes = (): LfoNodes => {
    const osc = ctx.createOscillator();
    osc.frequency.value = PARAMS.lfoRate.default;
    const bus = lfoClamp(ctx);
    osc.connect(bus);
    const [toCutoff, toPitch, toOsc2, q1, q2, toVolume] = Array.from({ length: 6 }, () => {
      const g = ctx.createGain();
      g.gain.value = 0;
      bus.connect(g);
      return g;
    });
    return { takeover: createTakeover(osc, ctx.currentTime, (node) => node.disconnect()), bus, toCutoff, toPitch, toOsc2, toQ: [q1, q2], toVolume };
  };
  const bend = ctx.createConstantSource();
  bend.offset.value = 0;
  bend.start();
  const tremoloRest = ctx.createConstantSource();
  tremoloRest.offset.value = 1;
  tremoloRest.start();
  const white = noiseBuffer(ctx);
  // The Oscillators' waves, shared by every Voice; the most recently asked for are kept, as each Note may ask for its
  // own while Ring is up (issue 103).
  const oscillatorWaves = new Map<string, PeriodicWave>();
  const oscillatorWave = (waveform: Exclude<Waveform, 'pulse'>, harmonics: number) => {
    const key = `${waveform} ${harmonics}`;
    let wave = oscillatorWaves.get(key);
    if (wave) oscillatorWaves.delete(key);
    else {
      const { real, imag } = harmonicSeries(waveform, 0.5, WAVE_HARMONICS);
      wave = ctx.createPeriodicWave(real.subarray(0, harmonics + 1), imag.subarray(0, harmonics + 1), { disableNormalization: true });
    }
    oscillatorWaves.set(key, wave);
    if (oscillatorWaves.size > CUT_WAVES) oscillatorWaves.delete(oscillatorWaves.keys().next().value as string);
    return wave;
  };
  const shared: Shared = {
    lfos: [lfoNodes(), lfoNodes()], bend, tremoloRest, noise: { white, pink: pinkBuffer(ctx, white) }, wave: oscillatorWave, master,
  };
  const voices = Array.from({ length: MAX_VOICES }, (_, i) => createVoice(ctx, shared, i));
  const waves = new Map<string, PeriodicWave>();
  const wave = (w: LfoWaveform, start: number) => {
    const key = `${w} ${start}`;
    return waves.get(key) ?? waves.set(key, lfoWave(ctx, w, start)).get(key)!;
  };
  // Where each LFO oscillator's cycle started, as a phase of its Waveform: a retriggered one's at its Waveform's
  // start then (`LFO_START`), kept through any later change of Waveform, as the model's clock keeps it (issue 124).
  const lfoStarts = new WeakMap<OscillatorNode, number>();
  const setLfoWave = (node: OscillatorNode, waveform: LfoWaveform) => setLfoWaveform(node, waveform, lfoStarts.get(node) ?? 0, wave);
  const lfoStart = ctx.currentTime;
  // The model's copy of each LFO's phase, advanced with every Rate change exactly as its oscillator is (ADR-0003).
  const lfoClocks = [createLfoClock(lfoStart, PARAMS.lfoRate.default), createLfoClock(lfoStart, PARAMS.lfo2Rate.default)];
  /**
   * A retriggering LFO starts its cycle again at `t`, where its Waveform classically starts (issue 124): a new
   * oscillator takes over from the running one there (an oscillator cannot be reset), and the model's clock restarts
   * with it, at the same phase. A chord's Notes restart it once.
   */
  const restartLfo = (i: number, l: Lfo, t: number) => {
    const nodes = shared.lfos[i];
    const start = LFO_START[l.waveform];
    const restarted = nodes.takeover.restart(t, () => {
      const next = ctx.createOscillator();
      lfoStarts.set(next, start);
      setLfoWave(next, l.waveform);
      next.frequency.value = l.rate;
      next.connect(nodes.bus);
      return next;
    });
    if (restarted) lfoClocks[i].restart(t, start);
  };
  /** Both LFOs' values at `t`, under the Patch then in force. */
  const lfoValues = (then: Patch, t: number): [number, number] => {
    const [one, two] = lfos(then);
    return [lfoShape(one.waveform, lfoClocks[0].phaseAt(t)), lfoShape(two.waveform, lfoClocks[1].phaseAt(t))];
  };

  let patch: Patch | undefined;
  // The Modulation model's history: the newest Note's pitches and Gate events, which is what the Viewers show. Each
  // entry keeps where it starts from (the slide's frequency and Note, the Envelope's level), so a past moment is one
  // search away rather than a replay of the history: the Timeline asks for every column, every frame (issue 45).
  const pitches: { time: number; frequency: number; note: number; glide: number; from: number; fromNote: number }[] = [];
  // Patches in force over time, so past moments use the Cutoff and Amount of their time.
  const patches: { time: number; patch: Patch }[] = [];
  const ampEvents: GateRecord[] = [];
  const filterEvents: GateRecord[] = [];
  // The pitch bend over time, in cents, for the model as for the sound.
  const bends: { time: number; cents: number }[] = [];
  const bendAt = (t: number) => {
    const i = lastAt(bends, t);
    return i >= 0 ? bends[i].cents : 0;
  };
  /** The Voice of the newest Note: the Taps listen to it (or to every Voice, when asked). */
  let lead: Voice | null = null;
  let tapSource: TapSource = 'newest';
  const listening = new Map<Voice, Set<TapName>>(voices.map((v) => [v, new Set<TapName>()]));
  /** Connect each Tap to the Voices it should hear now, and to nothing else. */
  const listen = () => {
    for (const v of voices) {
      const wanted = new Set<TapName>();
      if (v === lead) wanted.add('oscillator').add('filter').add('amp');
      if (tapSource === 'all') wanted.add('amp');
      const current = listening.get(v)!;
      for (const tap of current) if (!wanted.has(tap)) { v.detach(taps, tap); current.delete(tap); }
      for (const tap of wanted) if (!current.has(tap)) { v.attach(taps, tap); current.add(tap); }
    }
  };

  const at = (time?: number) => time ?? ctx.currentTime;
  const voiceCount = (): Voices => patch?.voices ?? 1;

  const record = (events: GateRecord[], e: GateEvent) => {
    const entry = { ...e, start: 0 };
    append(events, entry);
    const previous = events[events.length - 2];
    if (previous) entry.start = levelAfter(previous, previous.start, entry.time);
    trim(events, e.time);
    return entry;
  };
  const levelAt = (events: readonly GateRecord[], t: number) => {
    const i = lastAt(events, t);
    return i < 0 ? 0 : levelAfter(events[i], events[i].start, t);
  };
  /**
   * A Gate change on a Voice, recorded in its own history, and in the model's when it is the newest Note's. A Gate on
   * after a dip from `dipFrom` (issue 102) records the dip first, as the Amp Envelope plays it.
   */
  const gate = (voice: Voice, on: boolean, t: number, velocity: number, dipFrom?: number) => {
    if (!patch) return;
    const ampEvent: GateEvent = { time: t, on, adsr: ampAdsr(patch), peak: velocity };
    const filterEvent: GateEvent = { time: t, on, adsr: filterAdsr(patch), peak: 1 };
    const dipEvent: GateEvent | undefined = dipFrom === undefined ? undefined : { time: dipFrom, on: false, adsr: ampAdsr(patch), peak: 0, dip: true };
    // The sound dips from the Voice's own level; the model's history from its newest Note's.
    const dip = dipEvent && record(voice.amps, dipEvent);
    if (dipEvent && voice === lead) record(ampEvents, dipEvent);
    record(voice.amps, ampEvent);
    if (voice === lead) {
      record(ampEvents, ampEvent);
      record(filterEvents, filterEvent);
    }
    voice.gate(ampEvent, filterEvent, velocity, dip);
    if (on) {
      voice.startedAt = t;
      voice.releasedAt = null;
      voice.freeAt = Infinity;
    } else {
      // A Gate off before its Note has started (one handed over, then stopped; a key let go within the dip) calls off
      // the Note's restart of the Oscillators, which would come inside the Release (issue 102).
      if (voice.startedAt > t) voice.cancelRestarts(t);
      voice.releasedAt = t;
      voice.freeAt = t + patch.ampRelease * RELEASE_TAIL;
    }
  };

  /** Which Voice plays a new Note: one Voice always the first; otherwise a free one, else the oldest. */
  const allocate = (note: number, t: number): Voice => {
    const available = voices.slice(0, voiceCount());
    if (available.length === 1) return available[0];
    for (const v of available) if (v.freeAt <= t) v.note = null;
    return (
      available.find((v) => v.note === note) ?? // a Note already sounding retriggers its own Voice
      available.find((v) => v.note === null) ??
      available.filter((v) => v.releasedAt !== null).sort((a, b) => a.releasedAt! - b.releasedAt!)[0] ??
      available.reduce((oldest, v) => (v.startedAt < oldest.startedAt ? v : oldest))
    );
  };

  const follow = (voice: Voice) => {
    if (voice === lead) return;
    lead = voice;
    listen();
  };
  follow(voices[0]);

  const setLeadPitch = (voice: Voice, note: number, t: number) => {
    // Glide is a one-Voice behaviour: a Note slides from the previous one; with more Voices, Notes start at pitch.
    const glide = patch && pitches.length && voiceCount() === 1 && patch.glide > GLIDE_OFF * 1.001 ? patch.glide : 0;
    voice.setPitch(note, t, glide);
    const entry = { time: t, frequency: noteToFrequency(note), note, glide, from: noteToFrequency(note), fromNote: note };
    append(pitches, entry);
    const previous = pitches[pitches.length - 2];
    if (previous) {
      entry.from = glideFrom(previous.from, previous.frequency, previous.glide, t - previous.time);
      entry.fromNote = glideFrom(previous.fromNote, previous.note, previous.glide, t - previous.time);
    }
    trim(pitches, t);
  };
  // The newest Note's frequency at `t`, through its Glide (before the first Note, the first Note's; none: 0).
  const glidingAt = (t: number) => {
    const i = lastAt(pitches, t);
    if (i < 0) return pitches[0]?.frequency ?? 0;
    const p = pitches[i];
    return glideFrom(p.from, p.frequency, p.glide, t - p.time);
  };
  // The Note Key Track follows at `t`: the same slide as the Oscillators, in semitones.
  const trackedNoteAt = (t: number) => {
    const i = lastAt(pitches, t);
    if (i < 0) return pitches[0]?.note ?? 69;
    const p = pitches[i];
    return glideFrom(p.fromNote, p.note, p.glide, t - p.time);
  };

  /** The Patch in force at `t` (before the first, the first). */
  const patchAt = (t: number) => (patches.length ? patches[Math.max(0, lastAt(patches, t))].patch : undefined);

  // The LFO's Rate over time, from when it started: its phase is integrated across Rate changes.

  const modulationAt = (time?: number): Modulation => {
    const t = at(time);
    const filterLevel = levelAt(filterEvents, t);
    const then = patchAt(t);
    const lfo: [number, number] = then ? lfoValues(then, t) : [0, 0];
    // The newest Note, while its Gate is open (the latest Gate event at or before `t`), at its own key.
    const latest = lastAt(ampEvents, t);
    const gate = ampEvents[latest];
    // The latest Note's Velocity (the Amp Envelope's peak), which stays in force until the next Note.
    let opened = latest;
    while (opened >= 0 && !ampEvents[opened].on) opened--;
    const velocity = opened >= 0 ? ampEvents[opened].peak : 0;
    const latestPitch = lastAt(pitches, t);
    const note = latestPitch >= 0 ? pitches[latestPitch].note : 69;
    const gliding = frequencyToNote(glidingAt(t) || A4);
    const vibrato = then ? soundingPitch(then, gliding, lfo) - gliding : 0;
    const resonance = then ? effectiveResonance(then, lfo) : 0;
    return {
      amp: levelAt(ampEvents, t),
      filter: filterLevel,
      lfo,
      cutoff: then ? effectiveCutoff(then, filterLevel, lfo, velocity, trackedNoteAt(t)) : 0,
      resonance,
      mode: then?.filterMode ?? 'lowpass',
      bandwidth: then ? bandwidthOctaves(filterStages(then.filterMode, then.filterSlope, resonance)[0].Q) : 1,
      volume: then ? effectiveVolume(then, lfo) : 1,
      sounding: gate?.on ? { note, velocity } : null,
      pitch: gliding + vibrato + bendAt(t) / 100,
      vibrato,
    };
  };

  return {
    taps,
    // During a Glide, the frequency the Oscillators have reached: Cycle Lock follows the slide, at Osc 1's Octave.
    // With the Sub sounding, the sound repeats at the Sub's pitch, one or two octaves lower: that is the fundamental.
    fundamental: () => {
      const then = patchAt(ctx.currentTime);
      const frequency = (glidingAt(ctx.currentTime) || A4) * 2 ** ((then?.osc1Octave ?? 0) + bendAt(ctx.currentTime) / 1200);
      return then?.mixSub ? frequency * 2 ** then.subOctave : frequency;
    },
    modulationAt,
    lfoSwingAt: (time, n = 1) => {
      const then = patchAt(time);
      if (!then) return 0;
      const l = lfos(then)[n - 1];
      return l.amount * lfoShape(l.waveform, lfoClocks[n - 1].phaseAt(time));
    },
    patchAt,
    now: () => ctx.currentTime,
    setTapSource(source) {
      if (source === tapSource) return;
      tapSource = source;
      listen();
    },
    limiting() {
      limiterInput.getFloatTimeDomainData(limiterFrame);
      for (let i = 0; i < limiterFrame.length; i++) if (Math.abs(limiterFrame[i]) > SAFETY_KNEE) return true;
      return false;
    },

    filterResponse(frequencies) {
      const { cutoff, resonance } = modulationAt(ctx.currentTime - TAP_WINDOW / 2 / ctx.sampleRate);
      // An LFO on Resonance moves the twins' Q with it.
      if (patch) filterStages(patch.filterMode, patch.filterSlope, resonance).forEach((stage, i) => (twins[i].Q.value = stage.Q));
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
      trim(patches, t);
      lfos(next).forEach((l, i) => {
        lfoClocks[i].setRate(t, l.rate);
        lfoClocks[i].forgetBefore(t - MODEL_SECONDS);
      });
      for (const v of voices) v.apply(next, t);
      // The laws' swings (issue 74), in the units the nodes take: cents for the pitches and the Cutoff.
      const cutoffCents = destinationSwings(next, 'cutoff').map((octaves) => octaves * 1200);
      const pitchCents = destinationSwings(next, 'pitch').map((semitones) => semitones * 100);
      const detuneCents = destinationSwings(next, 'detune');
      const osc2 = destinationSwings(next, 'osc2Pitch').map((semitones, i) => semitones * 100 + detuneCents[i]);
      // Resonance: each stage's Q moves from where the swing's low end puts it to where its high end does.
      const resonances = destinationSwings(next, 'resonance', next.resonance);
      // Volume: the knob's level (issue 62), the tremolo resting its total swing below it, so the wave's top is the
      // knob's own level; each LFO's swing scaled with it.
      const volumeSwings = destinationSwings(next, 'volume').map((s) => s * next.volume);
      tremoloRest.offset.setValueAtTime(next.volume - volumeSwings[0] - volumeSwings[1], t);
      lfos(next).forEach((l, i) => {
        const nodes = shared.lfos[i];
        // A restart handed over ahead of now leaves the old oscillator running until then: it follows too.
        for (const osc of nodes.takeover.nodes()) {
          setLfoWave(osc, l.waveform);
          osc.frequency.setValueAtTime(l.rate, t);
        }
        nodes.toCutoff.gain.setValueAtTime(cutoffCents[i], t);
        nodes.toPitch.gain.setValueAtTime(pitchCents[i], t);
        nodes.toOsc2.gain.setValueAtTime(osc2[i], t);
        nodes.toVolume.gain.setValueAtTime(volumeSwings[i], t);
        const high = filterStages(next.filterMode, next.filterSlope, next.resonance + resonances[i]);
        const low = filterStages(next.filterMode, next.filterSlope, next.resonance - resonances[i]);
        nodes.toQ.forEach((g, k) => g.gain.setValueAtTime((high[k].Q - low[k].Q) / 2, t));
      });
      // The twins copy each stage for the Response Curve.
      const stages = filterStages(next.filterMode, next.filterSlope, next.resonance);
      twins.forEach((node, i) => setStage(node, stages[i], effectiveCutoff(next)));
      // Several Voices sum before the master: the listening level makes room for them (after the Amp Tap, so
      // the Viewers' scale is unchanged, ADR-0006); one Voice plays exactly as loud as before.
      master.gain.setValueAtTime(MASTER_LEVEL / Math.sqrt(next.voices), t);
    },

    noteOn(note, velocity, time) {
      const asked = at(time);
      const voice = allocate(note, asked);
      // A legato Note, one Voice pressed on while its Note still sounds held, slides on from it: restarting the
      // Oscillators there would click mid-sound (issue 94, decision 2).
      const legato = voiceCount() === 1 && voice.note !== null && voice.releasedAt === null;
      follow(voice);
      // Any other Note restarts them. On a Voice still sounding (in its Release, or taken while held) it dips to silence
      // first, so the restart does not click, and the Note starts after the dip, the same way every time (issue 102).
      // Its history holds the Notes handed over ahead of the clock, so one of those dips as it will sound.
      const dipFrom = !legato && levelAt(voice.amps, asked) > SILENT ? asked : undefined;
      const t = dipFrom === undefined ? asked : asked + DIP;
      if (patch) lfos(patch).forEach((l, i) => l.retrigger === 'note' && restartLfo(i, l, t));
      if (!legato) voice.restart(t, noteToFrequency(note));
      voice.note = note;
      setLeadPitch(voice, note, t);
      gate(voice, true, t, velocity, dipFrom);
    },

    pitchChange(note, time) {
      if (lead) setLeadPitch(lead, note, at(time));
    },

    setBend(cents, time) {
      const t = at(time);
      // A few milliseconds of smoothing, so a wheel's steps do not click.
      bend.offset.setTargetAtTime(cents, t, BEND_SMOOTHING);
      append(bends, { time: t, cents });
      trim(bends, t);
    },

    noteOff(time) {
      const t = at(time);
      // The newest Note first, so the model records its Gate off; the others just release. A Note a player handed
      // over has its release recorded already, later than `t`: it closes at `t` too (issue 101).
      for (const v of [...voices].sort((a, b) => (a === lead ? -1 : b === lead ? 1 : 0))) {
        if (v.note !== null && (v.releasedAt === null || v.releasedAt > t)) gate(v, false, t, 0);
      }
      // One Voice never allocates, so its Gate off must count whether or not a Note was recorded for it.
      if (voiceCount() === 1 && (voices[0].note === null || voices[0].releasedAt !== t)) gate(voices[0], false, t, 0);
    },

    release(note, time) {
      const t = at(time);
      for (const v of voices) if (v.note === note && v.releasedAt === null) gate(v, false, t, 0);
    },
  };
}
