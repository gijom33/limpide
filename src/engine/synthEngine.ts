import { type Adsr, type AutomationStep, DIP, envelopeSchedule, type GateEvent } from '../modulation/envelope';
import { type BeatGrid, glideFrequency, glideTimeConstant, LFO_START, type LfoWaveform } from '../modulation/lfo';
import {
  destinationSwings, effectiveCutoff, KEY_TRACK_CENTRE, LOWEST_CUTOFF, type Modulation, osc2Cents, osc2EnvelopeCents, PRESSURE_GLIDE,
  type Pressure, pressed, pressurePitch, VELOCITY_CUTOFF_OCTAVES,
} from '../modulation/modulationModel';
import { createCache } from '../music/cache';
import { harmonicSeries, type Waveform } from '../music/harmonics';
import { fmDepthKept, playedTop } from '../music/idealReference';
import { A4_HZ, noteToFrequency } from '../music/pitch';
import { type FilterMode, type FilterSlope, fmIndex, GLIDE_OFF, type Lfo, type LfoNumber, lfoHz, lfos, type NoiseColour, PARAMS, type Patch, type SubWaveform, type Voices } from '../patch/patch';
import { CUTOFF_CLAMP, CUTOFF_SPAN, centsOverFloor, fadesOutAtTheTop, filterLevel, filterStages, filterStagesAt, isPeaked, LEVEL_FADE_CURVE, makeUp, makeUpCurve, RESONANCE_FADE_CURVE, resonanceCurve, type Stage } from './filterDesign';
import { append, createGateHistory, createModulationRecord, type GateRecord, lastAt } from './modulationRecord';
import { heardAt, type OutputClockContext } from './outputClock';

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
  /**
   * The Patch to play from now. Only the AudioParams it changes are written; with `whole` (a whole new Patch loaded),
   * every one, as if from nothing (issue 218).
   */
  applyPatch(patch: Patch, options?: { whole?: boolean }): void;
  /**
   * A Note starts: on the one Voice (1 Voice), or on a free Voice (more). The Viewers follow it. With Legato on, one
   * played while the Gate is open slides there instead, unless struck `afresh` (every key up, Hold keeping the last).
   */
  noteOn(note: number, velocity: number, at?: number, options?: { afresh?: boolean }): void;
  /** One Voice: the sounding Note changes pitch (last-note priority, Glide) without a new Gate. */
  pitchChange(note: number, at?: number): void;
  /** A keyboard's bend wheel: every Voice's pitch moves by `cents` from `at` on, until the next bend (issue 52). */
  setBend(cents: number, at?: number): void;
  /**
   * A keyboard's aftertouch (issue 132): from `at` on, its Destination moves as the model's `pressed` says, every Voice
   * alike, until the next. The Patch in force stays the knobs'.
   */
  setPressure(pressure: Pressure, at?: number): void;
  /** The Gate closes: every Voice releases, a Note handed over to start or end later included (issue 101). */
  noteOff(at?: number): void;
  /** Several Voices: the Voice playing `note` releases; the others keep sounding. */
  release(note: number, at?: number): void;
  /**
   * All Sound Off (issue 185): every Voice still sounding, held or in its Release, falls silent at `at` over a dip of
   * a few milliseconds (no click), recorded in the model as the Amp Envelope plays it.
   */
  silence(at?: number): void;
  /**
   * Frequency of the most recent Note (A4 before any), at Osc 1's Octave (the Sub's with the Sub up), through its Glide
   * and the bend: the period each Scope shows and writes, held still through vibrato.
   */
  fundamental(): number;
  /**
   * The same at `time`, now or past, with the LFOs on Pitch too: the pitch the Oscillators play, which Cycle Lock
   * follows across a Tap's buffer (issue 180).
   */
  fundamentalAt(time: number): number;
  /**
   * The newest Note played (a MIDI note number), a player's or a Note handed over ahead included; null before any. The
   * Note the Synth Geek Layer's numbers are worked out at (issue 133, decision 6).
   */
  newestNote(): number | null;
  /** Be told each time the newest Note changes (a Note on, or a pitch change on one Voice). */
  onNewestNote(listener: () => void): () => void;
  /** The Modulation model at `time` (default: the clock shown, `shownNow`), from the Gate history — past times too, for the Timeline. */
  modulationAt(time?: number): Modulation;
  /**
   * The LFO's value times the Depth in force at `time` (−1 to 1): how far it moves its destination, as the plot draws
   * it. `modulationAt(time).lfo` alone (scaled), cheap enough to draw point by point.
   */
  lfoSwingAt(time: number, lfo?: LfoNumber): number;
  /** The Patch in force at `time` (none before the first): what the Timeline draws at that moment. */
  patchAt(time: number): Patch | undefined;
  /**
   * From when the model's past stays as it is (issue 215): its history is only ever added to at or after now, but before the
   * first Patch and the first Note they stand in for what came before (the first Note's key for the Key Track's), and
   * the first Patch is replaced while the clock stands still. Infinity before either.
   */
  settledFrom(): number;
  /**
   * The tempo an LFO with Sync on follows (issue 112): `bpm`, its beats counted from `origin` (by default now), where a
   * synced LFO running freely starts a cycle. Its Rate follows at once.
   */
  setTempo(bpm: number, origin?: number): void;
  /** The tempo in force, and where its beats are counted from. */
  tempo(): BeatGrid;
  now(): number;
  /**
   * From when no Voice sounds, on the engine's clock (issue 216): Infinity while a key is held or a Note is handed over
   * ahead, else when the last Release has faded; −Infinity before any Note.
   */
  quietFrom(): number;
  /**
   * The page pauses the sound in a long silence (issue 216): the engine's clock stands still from here, and what is
   * drawn from it runs on by the page's clock (`shownNow`). The page stops the AudioContext itself.
   */
  pause(): void;
  /**
   * Back from a pause, before anything is played: the LFOs and the beat are carried on by the time paused, in the sound
   * as in the model, so they go on from where they were shown and the clock drawn from is the engine's again.
   */
  wake(): void;
  /** Whether the page has paused the sound. */
  paused(): boolean;
  /**
   * The time to draw at: the engine's clock, carried on by the page's while paused, so the LFO plots, the rings and the
   * Response Curve go on moving (issue 216, the owner).
   */
  shownNow(): number;
  /**
   * The engine's time whose sound is heard at `pageTime`, in seconds on the page's clock (`performance.now()`'s): where
   * a MIDI clock's beat or a Tap Tempo tap is placed, so a synced LFO is heard on it, the output's latency allowed for (issue 185).
   */
  heardAt(pageTime: number): number;
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

/**
 * How long a change of Filter Mode fades from the old Mode's sound to the new one's, in seconds (issue 248): short
 * enough to be heard as the switch itself, long enough that no step is heard.
 */
const MODE_FADE = 0.01;
/** The frames the browser renders at a time: a scheduled node's `ended` comes once its last one is rendered. */
const RENDER_QUANTUM = 128;

/** The bend wheel's steps are smoothed over this time constant, in seconds. */
const BEND_SMOOTHING = 0.004;

const SAFETY_RANGE = 4;
/** Where the safety limiter starts to bend the sound: below it, it is exactly linear. */
export const SAFETY_KNEE = 0.8;
// The bend levels off a little below full scale: driven hard, the shaper's oversampling filter rings slightly
// past the curve, and this keeps even that under 1.
const SAFETY_CEILING = 0.97;

/** The safety limiter's curve, every engine's: linear up to the knee, then a tanh bend towards (never past) the ceiling. */
export const SAFETY_CURVE = ((): Float32Array<ArrayBuffer> => {
  const curve = new Float32Array(4097);
  const bend = SAFETY_CEILING - SAFETY_KNEE;
  for (let i = 0; i < curve.length; i++) {
    const x = ((i / (curve.length - 1)) * 2 - 1) * SAFETY_RANGE;
    const over = Math.abs(x) - SAFETY_KNEE;
    const y = over <= 0 ? Math.abs(x) : SAFETY_KNEE + bend * Math.tanh(over / bend);
    curve[i] = Math.sign(x) * y;
  }
  return curve;
})();

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

/**
 * Each Noise loop's peak, for the Guides (issue 159): white's samples reach ±1, as an Oscillator does; pink, kept at
 * white's RMS, reaches about 2.2 at the usual 44.1 and 48 kHz (a little more at 96 kHz).
 */
export const NOISE_PEAK: Record<NoiseColour, number> = { white: 1, pink: 2.2 };

// Enough Harmonics to reach Nyquist from the lowest Notes; the browser band-limits per pitch.
const WAVE_HARMONICS = 1024;
// How many of the Oscillators' waves are kept, cut short for Ring (issue 103), for the Notes to come: each holds
// many tables.
const KEPT_WAVES = 32;
// The LFOs' waves kept: one per Waveform and start, which a retriggered LFO keeps through a change of Waveform.
const KEPT_LFO_WAVES = 32;
// A synced free LFO comes back onto the beat over this many of its cycles, after its note value or the tempo changes
// (review 14): off by half a cycle at most, it runs a quarter faster or slower meanwhile.
const PULL_CYCLES = 2;
/**
 * Each Voice's offset is taken out below this, by a second-order high-pass (issue 103): FM with Osc 2 on Osc 1's pitch
 * puts a sideband at 0 Hz, and two in-tune waves through Ring their product's average. That offset holds from Note to
 * Note, so the filter settles once per Patch; this low, it bends a 110 Hz saw's ramps by about 2 % in the Scope, where
 * 5 Hz would bend them by 10 %.
 */
const DC_BLOCK = 1;
// A Voice's own pitches, kept to tune its pulses through a Glide.
const HISTORY = 64;
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
    /**
     * A node from `make` takes over at `t`; a second restart at the same moment is the same one (false), unless it is
     * `again`, which replaces it (a beat-locked LFO locked again, issue 112).
     */
    restart(t: number, make: () => OscillatorNode, { again = false } = {}) {
      if (t === restartAt && !again) return false;
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
    /** What its detune sums to, everything that moves its pitch off `frequency`, as a signal in cents. */
    cents,
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
 * How far a pulse's delay follows its Oscillator's pitch (issue 98): from this many cents down to as many up, past
 * what Env Amount, both LFOs, the bend and the tuning knobs reach together.
 */
const FOLLOWED_CENTS = 12000;

/** Cents between the points of CYCLE_CURVE: the line between two is within a millionth of the curve. */
const CYCLE_STEP = 2;
/**
 * One cycle's length, as a share of the Note's period, at `x` × FOLLOWED_CENTS cents off the Note (x from −1 to 1):
 * 2^(−cents/1200).
 */
const CYCLE_CURVE = Float32Array.from({ length: (2 * FOLLOWED_CENTS) / CYCLE_STEP + 1 }, (_, i) => 2 ** (-(i * CYCLE_STEP - FOLLOWED_CENTS) / 1200));

/**
 * One Oscillator. Most Waveforms play their Fourier series directly (a PeriodicWave). A pulse is built the
 * analogue way, as a saw minus a delayed copy of itself: the delay (the width's share of a cycle) sets the Pulse Width and,
 * unlike a PeriodicWave, can be modulated smoothly (PWM). It is scaled to match the pulse's series exactly. After a
 * restart the delay still holds the old cycle for one width: a fraction of a cycle, inside the Note's attack.
 *
 * The delay is the width (the knob, and each LFO's swing of it) times the Note's period, times one cycle's length at
 * the pitch the Oscillator sounds over the Note's (issue 98): a waveshaper turns everything that moves its pitch, in
 * cents, into 2^(−cents/1200) at audio rate, so the width stays the knob's however Env Amount, an LFO, the bend or
 * its tuning moves it. A Glide moves the Note's period, which slides with the Oscillators.
 */
function createVoiceOscillator(ctx: BaseAudioContext) {
  const direct = ctx.createGain();
  const delay = ctx.createDelay(1);
  const inverted = ctx.createGain();
  const out = ctx.createGain();
  const source: Restartable = createRestartable(ctx, A4_HZ, [direct, delay]);
  const width = ctx.createConstantSource();
  width.offset.value = 0.5;
  const pwm = [ctx.createGain(), ctx.createGain()]; // each LFO → the width
  const period = ctx.createGain(); // the Note's period, in seconds
  period.gain.value = 1 / A4_HZ;
  const centsIn = ctx.createGain(); // the shaper takes −1 to 1 for ±FOLLOWED_CENTS
  centsIn.gain.value = 1 / FOLLOWED_CENTS;
  const cycle = ctx.createWaveShaper();
  cycle.curve = CYCLE_CURVE;
  const toDelay = ctx.createGain(); // the width's share of the Note's period, times the cycle's length
  toDelay.gain.value = 0;
  delay.delayTime.value = 0;
  source.cents.connect(centsIn).connect(cycle).connect(toDelay.gain);
  width.connect(period);
  for (const g of pwm) {
    g.connect(period);
    g.gain.value = 0;
  }
  period.connect(toDelay).connect(delay.delayTime);
  width.start();
  direct.connect(out);
  delay.connect(inverted).connect(out);
  inverted.gain.value = 0;
  return { source, out, direct, inverted, width, pwm, period };
}

/** Every one of FM's gains: its own, then each LFO's swing of it. */
const EVERY_FM_GAIN = [true, true, true];

/** Whether two keys (what a change detector or a lock was worked out from) are the same, part by part. */
const sameKey = (a: readonly unknown[] | null, b: readonly unknown[] | null) =>
  a === b || (!!a && !!b && a.length === b.length && a.every((part, i) => part === b[i]));

/**
 * What one thing in the sound was last worked out from (issues 218 and 219), so a change that leaves it as it was does
 * not write it again: `changed(key)` says whether `key` differs, part by part, from the last one, and keeps it. With
 * `afresh` (a whole new Patch written), or with no `start`, it is a change whatever it is.
 */
function createChangeDetector<Key extends readonly unknown[]>(start: Key | null = null) {
  let last = start;
  return {
    changed(key: Key, { afresh = false } = {}) {
      if (!afresh && sameKey(last, key)) return false;
      last = key;
      return true;
    },
  };
}
type ChangeDetector<Key extends readonly unknown[]> = ReturnType<typeof createChangeDetector<Key>>;

/**
 * Set a biquad to a stage, its Cutoff aside: scheduled at `t` through `writes` for the playing filter, immediately
 * (without them) for a twin.
 */
function setStage(node: BiquadFilterNode, stage: Stage, scheduled?: { writes: Writes; t: number }) {
  if (node.type !== stage.type) node.type = stage.type;
  for (const [param, value] of [[node.Q, stage.Q], [node.gain, stage.gain]] as const) {
    if (scheduled) scheduled.writes.set(param, value, scheduled.t);
    else param.value = value;
  }
}

/**
 * The AudioParams only applying a Patch writes, each set at a moment and held from there (issue 218): what each was
 * last given, and from when, so a write that would leave it as it is is skipped. One written out of order (before the
 * latest) is always made, and what holds after the latest stays as it was. `forget` starts again from nothing: a
 * whole new Patch writes every parameter.
 */
function createWrites() {
  let last = new WeakMap<AudioParam, { value: number; time: number }>();
  // While aftertouch is written, its time constant: each write glides there (issue 219).
  let glide: number | undefined;
  return {
    set(param: AudioParam, value: number, t: number) {
      const was = last.get(param);
      if (was && was.value === value && t >= was.time) return;
      moveTo(param, value, t, glide);
      if (!was || t >= was.time) last.set(param, { value, time: t });
    },
    /** Make the writes `act` makes glide over `timeConstant` rather than step: aftertouch's (issue 219). */
    gliding(timeConstant: number, act: () => void) {
      glide = timeConstant;
      try {
        act();
      } finally {
        glide = undefined;
      }
    },
    /** The time constant the writes now glide over, if any: for what is moved other than through `set`. */
    glide: () => glide,
    forget() {
      last = new WeakMap();
    },
  };
}
type Writes = ReturnType<typeof createWrites>;

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

/** Move `param` to `value` at `t`: at once, or sliding there with a Glide's `timeConstant`. */
function moveTo(param: AudioParam, value: number, t: number, timeConstant?: number) {
  if (timeConstant) param.setTargetAtTime(value, t, timeConstant);
  else param.setValueAtTime(value, t);
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

/**
 * One LFO: a real oscillator, wired to each destination through a gain set from its Depth (zero unless it is aimed
 * there): the Cutoff and the pitch in cents (through `detune`), Osc 2's tuning in cents, the Resonance (into the
 * shared curve to each Filter stage's Q), the tremolo's gain.
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
  /** Its swing of the Resonance, into each `FilterSide.resonanceQ` (which takes the Resonance's 0 to 1 as −1 to 1). */
  toResonance: GainNode;
  toVolume: GainNode;
}

/**
 * One of the Filter's two sides (issue 248), what every Voice's same side shares: the Mode it plays, and the Resonance's
 * curves for it. A change of Mode goes to the side not heard, and every Voice fades over to it (MODE_FADE), so the old
 * Mode's sound is never cut at one sample; once the fade is over, the side faded out is unwired and costs nothing.
 */
interface FilterSide {
  /** The Mode it plays, once it has been given one. */
  mode?: FilterMode;
  /**
   * A curve from the Resonance to what it adds to the first stage's Q over its flat one, as the model moves the
   * Resonance (resonanceCurve, issues 166 and 219), then each stage's share of it, into every Voice's Filter.
   */
  resonanceQ: WaveShaperNode;
  toQ: [GainNode, GainNode];
  /**
   * The band-pass's make-up over a gain of 1 (issue 231), from the same Resonance through its curve (makeUpCurve),
   * into every Voice's Filter level: it follows the Resonance however it is moved, and changes with the side's stages.
   */
  makeUp: WaveShaperNode;
  /** The Mode and Slope its curves were made for: only they make them again (issue 219). Its stages' gains. */
  curveFrom: ChangeDetector<readonly [FilterMode, FilterSlope]>;
  curveStages: [number, number];
}

/** What every Voice shares: the LFOs, the pitch bend, the noise loop, the Oscillators' waves, and where the Voices' outputs go. */
interface Shared {
  lfos: [LfoNodes, LfoNodes];
  /**
   * The Resonance as the knob and aftertouch set it, into each side's `resonanceQ`, where both LFOs' swings of it meet
   * it (issue 219): one write moves every Voice's.
   */
  resonanceIn: ConstantSourceNode;
  /** The Filter's two sides (issue 248): one plays the Mode heard, the other only while a change of Mode fades. */
  sides: [FilterSide, FilterSide];
  /** The pitch bend in cents, into every Oscillator's detune (the LFO on Pitch goes there too). */
  bend: ConstantSourceNode;
  /** Aftertouch on Pitch in cents (issue 132), beside the bend: it glides over its own time constant (issue 219). */
  pressing: ConstantSourceNode;
  /** The tremolo's resting gain, into every Voice's: 1 less the LFOs' total swing on Volume. */
  tremoloRest: ConstantSourceNode;
  noise: Record<NoiseColour, AudioBuffer>;
  /** A Waveform's series up to its Harmonic `harmonics`, as a wave the Oscillators play. */
  wave(waveform: Exclude<Waveform, 'pulse'>, harmonics: number): PeriodicWave;
  master: GainNode;
  /** How applying a Patch writes the AudioParams only it sets: those it changes alone (issue 218). */
  writes: Writes;
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
  // FM (issue 89): Osc 2 into Osc 1's frequency, through a gain that tracks the Note (see fmDepth).
  const fm = ctx.createGain();
  fm.gain.value = 0;
  oscillators[1].out.connect(fm).connect(osc.frequency);
  const fmLfos = [ctx.createGain(), ctx.createGain()]; // each LFO → FM's gain (issue 97), scaled as fmDepth
  for (const g of fmLfos) {
    g.gain.value = 0;
    g.connect(fm.gain);
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
  const sub = createRestartable(ctx, A4_HZ / 2, [mixSub]);
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
  // The Cutoff: each stage's frequency the bottom of its range, its detune the cents over it, the knob's (`cutoff`)
  // and everything that moves it summed, then held within the range by a clamp, as the model holds the Effective
  // Cutoff (issue 166). The sum is scaled to the clamp's curve, which takes the span as 1.
  const cutoff = ctx.createConstantSource();
  const cutoffSum = ctx.createGain();
  cutoffSum.gain.value = 1 / CUTOFF_SPAN;
  const cutoffClamp = ctx.createWaveShaper();
  cutoffClamp.curve = CUTOFF_CLAMP;
  cutoff.connect(cutoffSum).connect(cutoffClamp);
  cutoff.start();
  // Near the top the Resonance fades, and a high-pass falls silent (issue 195), as `filterStagesAt` and `filterLevel`
  // have it: the clamped Cutoff, through each fade's curve, takes its share off each stage's Q over its flat one (the
  // shared `toQ`), and off what a high-pass lets through. Each side's fade gains are −1 in the Modes they fade, 0 in
  // the others.
  const toFade = ctx.createGain();
  toFade.gain.value = 1 / CUTOFF_SPAN;
  cutoffClamp.connect(toFade);
  const fadeShapers = [RESONANCE_FADE_CURVE, LEVEL_FADE_CURVE].map((curve) => {
    const shaper = ctx.createWaveShaper();
    shaper.curve = curve;
    toFade.connect(shaper);
    return shaper;
  });
  const amp = ctx.createGain();
  amp.gain.value = 0;
  // The Filter's two sides (issue 248): each two stages (the second transparent at 12 dB, doubling the Slope at 24 dB:
  // filterStages), then its level. Only the side heard is wired from the Mixer and to the Amp, directly, so nothing
  // costs more than one Filter while no Mode changes; while a change fades, both are, each through its share of the
  // sound (`share`). The first side is heard until a Mode changes.
  /**
   * A side's two stages, new: from silence, as a side faded in must start, not from the sound it was unwired in. Each
   * takes its Resonance from `kept` and goes to `level`; until a Patch sets them they are the browser's low-pass.
   */
  const newStages = (kept: GainNode[], level: GainNode) => {
    const stages = [ctx.createBiquadFilter(), ctx.createBiquadFilter()] as const;
    stages.forEach((node, k) => {
      node.frequency.value = LOWEST_CUTOFF;
      cutoffClamp.connect(node.detune);
      kept[k].connect(node.Q);
    });
    stages[0].connect(stages[1]).connect(level);
    return stages;
  };
  const sides = shared.sides.map((sharedSide) => {
    const [resonanceFade, levelFade] = fadeShapers.map((shaper) => {
      const fade = ctx.createGain();
      fade.gain.value = 0;
      shaper.connect(fade);
      return fade;
    });
    const kept = sharedSide.toQ.map((toQ) => {
      const gain = ctx.createGain();
      resonanceFade.connect(gain.gain);
      toQ.connect(gain);
      return gain;
    });
    const level = ctx.createGain();
    levelFade.connect(level.gain);
    sharedSide.makeUp.connect(level.gain);
    const share = ctx.createGain();
    share.gain.value = 0;
    level.connect(share);
    // Whether the Mixer reaches it, and what reaches the Amp from it: its level, its share, or nothing.
    return { stages: newStages(kept, level), kept, resonanceFade, levelFade, level, share, wired: false, out: undefined as GainNode | undefined };
  });
  type Side = (typeof sides)[number];
  // The Taps listening to what the Filter sends the Amp: they follow its wiring.
  const filterTaps = new Set<AnalyserNode>();
  /** Wire `side` from the Mixer or not, and to the Amp from `out` (its level or its share) or not. */
  const wire = (side: Side, wired: boolean, out?: GainNode) => {
    if (side.wired !== wired) {
      if (wired) dcBlock.connect(side.stages[0]);
      else dcBlock.disconnect(side.stages[0]);
      side.wired = wired;
    }
    if (side.out === out) return;
    for (const node of [amp, ...filterTaps]) {
      side.out?.disconnect(node);
      out?.connect(node);
    }
    side.out = out;
  };
  wire(sides[0], true, sides[0].level);
  // After the Amp, the LFOs on Volume (tremolo): its gain is the shared resting level plus each LFO's swing.
  const tremoloGain = ctx.createGain();
  tremoloGain.gain.value = 0;
  shared.tremoloRest.connect(tremoloGain.gain);

  // The Filter Envelope (0–1) moves the Cutoff by its cents: Cutoff × 2^(Amount × level), exactly the model's law.
  // Amount is a gain after the Envelope, so changing it mid-Note acts at once.
  const filterEnvelope = ctx.createConstantSource();
  filterEnvelope.offset.value = 0;
  const envelopeAmount = ctx.createGain();
  envelopeAmount.gain.value = 0;
  filterEnvelope.connect(envelopeAmount);
  envelopeAmount.connect(cutoffSum);
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
  velocityAmount.connect(cutoffSum);
  noteVelocity.start();

  // Key Track, the same way: the Note (in semitones from C4, gliding as the Oscillators do) times the amount.
  const trackedNote = ctx.createConstantSource();
  trackedNote.offset.value = 69 - KEY_TRACK_CENTRE; // the Oscillators start on A4
  const keyTrackAmount = ctx.createGain();
  keyTrackAmount.gain.value = 0;
  trackedNote.connect(keyTrackAmount);
  keyTrackAmount.connect(cutoffSum);
  trackedNote.start();

  // To the master only while wired (`setWired`).
  amp.connect(tremoloGain);
  // Every Voice's noise starts at a different point of the loop, so a chord's noise is not one noise, louder.
  for (const n of noises) n.source.start(0, (index * NOISE_SECONDS) / MAX_VOICES);

  // The shared LFOs, wired to this Voice's destinations through the shared gains set from their Depths.
  shared.lfos.forEach((l, i) => {
    l.toCutoff.connect(cutoffSum);
    l.toPitch.connect(sub.detune);
    l.toOsc2.connect(osc2.detune);
    l.toVolume.connect(tremoloGain.gain);
    for (const o of oscillators) {
      l.toPitch.connect(o.source.detune);
      l.bus.connect(o.pwm[i]);
    }
    l.bus.connect(fmLfos[i]);
  });
  for (const pitch of [shared.bend, shared.pressing]) {
    pitch.connect(sub.detune);
    for (const o of oscillators) pitch.connect(o.source.detune);
  }

  // Each Oscillator's pitch over the Note's, from its knobs: FM's depth and the Harmonics Ring keeps count from them.
  const pitchOverNote = [1, 1];
  /**
   * FM's gain on a Note of `frequency`: the index times Osc 2's frequency, in Hz. Osc 1's Octave scales what
   * reaches its frequency, so the gain is divided by it, keeping the index the knob's.
   */
  const fmDepth = (frequency: number, amount = patch?.crossMod ?? 0) => (fmIndex(amount) * frequency * pitchOverNote[1]) / pitchOverNote[0];
  /**
   * FM's gain, and each LFO's swing of it by its law (issue 97), on a Note of `frequency`: at once, or over a Glide.
   * High up, all of them shrink together as far as keeps Osc 1's sidebands under the top (issue 103). Only the gains
   * `retuned` says (FM's own, then each LFO's), when told (issue 218).
   */
  const tuneFm = (frequency: number, t: number, { timeConstant, retuned = EVERY_FM_GAIN }: { timeConstant?: number; retuned?: boolean[] } = {}) => {
    const swings = patch ? destinationSwings(patch, 'fm', patch.crossMod) : [0, 0];
    const kept = patch ? fmDepthKept(patch, frequency * pitchOverNote[0], ctx.sampleRate) : 1;
    [fm, ...fmLfos].forEach((node, i) => {
      if (retuned[i]) moveTo(node.gain, fmDepth(frequency, i ? swings[i - 1] : undefined) * kept, t, timeConstant);
    });
  };
  /** FM's depth from `t` on, for a Note of `frequency` that starts there: at once, or over its `glide`. */
  const fmTo = (frequency: number, t: number, glide: number, retuned = EVERY_FM_GAIN) => {
    [fm, ...fmLfos].forEach((node, i) => retuned[i] && holdAt(node.gain, t));
    tuneFm(frequency, t, { timeConstant: glide ? glideTimeConstant(glide) : undefined, retuned });
  };
  const pitches: { time: number; frequency: number; note: number; glide: number }[] = [];
  let patch: Patch | undefined;
  const write = shared.writes.set;
  // What FM's gain and each LFO's swing of it were last worked out from, besides the Note: knobs that leave it alone
  // leave them as they are (issue 218).
  const fmGainsFrom = EVERY_FM_GAIN.map(() => createChangeDetector<readonly number[]>());

  /** Give each pulse the period of a Note of `frequency`: at once, or over a Glide. */
  const tunePulses = (frequency: number, t: number, timeConstant?: number) => {
    for (const o of oscillators) {
      holdAt(o.period.gain, t);
      moveTo(o.period.gain, 1 / frequency, t, timeConstant);
    }
  };

  /**
   * How many Harmonics Osc 1 and Osc 2 play on a Note of `frequency`: all of them, but while Ring is up only those whose
   * products with the other's stay under the top of what the browser plays, so Ring's sums do not fold back (issue
   * 103). A Sine needs only its own pitch; two richer waves share the top evenly. Each keeps at least its first.
   */
  const harmonicsOn = (frequency: number): number[] => {
    if (!patch?.mixRing) return [WAVE_HARMONICS, WAVE_HARMONICS];
    const hz = pitchOverNote.map((r) => frequency * r);
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
    write(o.width.offset, width, t);
    const swings = patch ? destinationSwings(patch, 'pulseWidth', width) : [0, 0];
    swings.forEach((swing, n) => write(o.pwm[n].gain, swing, t));
    // saw(t) − saw(t − d·T) has |Harmonic n| = 2·|sin(πnd)| × the saw's: scale it to the pulse series' level.
    const scale = pulse ? harmonicSeries('pulse', width, 256).magnitudes[1] / (2 * Math.sin(Math.PI * width) * sawPeak) : 1;
    write(o.direct.gain, scale, t);
    write(o.inverted.gain, pulse ? -scale : 0, t);
  };

  const frequencyAt = (t: number) => glideFrequency(pitches, t) || A4_HZ;

  const voice = {
    /** The Note this Voice is playing or releasing; null once it has faded. */
    note: null as number | null,
    /** Its own Amp Envelope's Gate events, so a Note can tell whether it still sounds (issue 102). */
    amps: createGateHistory(),
    startedAt: -Infinity,
    /** When its key went up, and when its Release will have faded, or null while the key is down. */
    releasedAt: null as number | null,
    freeAt: -Infinity,
    pitches,
    /**
     * Whether its sound reaches the master (issue 257). Unwired, and none of the Taps listening, nothing the browser
     * renders pulls it, so its nodes cost the audio thread nothing; it starts so, until the engine wires it.
     */
    wired: false,
    setWired(on: boolean) {
      if (on === voice.wired) return;
      if (on) tremoloGain.connect(shared.master);
      else tremoloGain.disconnect(shared.master);
      voice.wired = on;
    },

    /** Move to a Note: at once, or sliding there over the Glide. */
    setPitch(note: number, t: number, glide: number) {
      const frequency = noteToFrequency(note);
      append(pitches, { time: t, frequency, note, glide });
      if (pitches.length > HISTORY) pitches.shift();
      const slide = glide ? glideTimeConstant(glide) : undefined;
      for (const [node, f] of [[osc, frequency], [osc2, frequency], [sub, frequency / 2]] as const) {
        // Every Oscillator follows the Note, the Sub from an octave down: Osc 1's Octave, Osc 2's offsets and the Sub's
        // second octave ride on top, through their detunes.
        holdAt(node.frequency, t);
        moveTo(node.frequency, f, t, slide);
      }
      tunePulses(frequency, t, slide);
      fmTo(frequency, t, glide);
      holdAt(trackedNote.offset, t);
      moveTo(trackedNote.offset, note - KEY_TRACK_CENTRE, t, slide);
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

    /** All Sound Off (issue 185): the Amp Envelope falls from where it is to silence over a dip, whatever its Release. */
    cut(ampRecord: GateRecord, filterEvent: GateEvent) {
      play(amp.gain, envelopeSchedule(ampRecord, ampRecord.start));
      play(filterEnvelope.offset, envelopeSchedule(filterEvent));
    },

    /** Take on `next` from `t`, writing only what it changes; `whole`, everything (issue 218). */
    apply(next: Patch, t: number, { whole = false } = {}) {
      patch = next;
      const osc2Tuning = osc2Cents(next);
      pitchOverNote[0] = 2 ** next.osc1Octave;
      pitchOverNote[1] = 2 ** (osc2Tuning / 1200);
      setWave(0, next.waveform, next.pulseWidth, t);
      setWave(1, next.osc2Waveform, next.osc2PulseWidth, t);
      // FM's depth for the new knobs: through a Glide, from where the slide has reached on to the Note's, with the
      // Oscillators; and again at the start of each Note handed over for later (issue 98). Knobs that leave what it is
      // worked out from as it was leave it as each Note set it; one at nothing stays at nothing.
      const fmSwings = destinationSwings(next, 'fm', next.crossMod);
      const fmNow = [next.crossMod, ...fmSwings].map((amount) => (amount ? [amount, next.crossMod, ...fmSwings, ...pitchOverNote] : []));
      const retuned = fmNow.map((now, i) => fmGainsFrom[i].changed(now, { afresh: whole }));
      if (retuned.some(Boolean)) {
        tuneFm(frequencyAt(t), t, { timeConstant: shared.writes.glide(), retuned });
        const sliding = pitches[lastAt(pitches, t)];
        if (sliding?.glide) tuneFm(sliding.frequency, t, { timeConstant: glideTimeConstant(sliding.glide), retuned });
        for (const later of pitches) if (later.time > t) fmTo(later.frequency, later.time, later.glide, retuned);
      }
      // Osc 1's Octave moves it and the Sub; Osc 2's offsets count from the Note.
      write(osc.detune, next.osc1Octave * 1200, t);
      write(sub.detune, (next.osc1Octave + next.subOctave + 1) * 1200, t);
      if (next.subWaveform !== subWaveform) {
        subWaveform = next.subWaveform;
        sub.setWave(() => subWaves[next.subWaveform]);
      }
      write(osc2.detune, osc2Tuning, t);
      write(mix1.gain, next.mixOsc1 * OSCILLATOR_LEVEL, t);
      write(mix2.gain, next.mixOsc2 * OSCILLATOR_LEVEL, t);
      write(mixNoise.gain, next.mixNoise * OSCILLATOR_LEVEL, t);
      for (const n of noises) write(n.gate.gain, n.colour === next.noiseColour ? 1 : 0, t);
      write(mixSub.gain, next.mixSub * OSCILLATOR_LEVEL, t);
      write(mixRing.gain, next.mixRing * OSCILLATOR_LEVEL, t);
      voice.setSides(next.filterSlope, t);
      // The knob's Cutoff; the Filter Envelope and the rest add to it.
      write(cutoff.offset, centsOverFloor(effectiveCutoff(next)), t);
      write(envelopeAmount.gain, next.filterEnvAmount * 1200, t);
      write(osc2EnvAmount.gain, osc2EnvelopeCents(next, 1), t); // the Envelope's level, 0 to 1, in cents
      write(velocityAmount.gain, next.velocityCutoff * VELOCITY_CUTOFF_OCTAVES * 1200, t);
      write(keyTrackAmount.gain, next.keyTrack * 100, t); // cents per semitone
    },

    /**
     * Each side's stages at their flat Q for its Mode, at `slope`, from `t`; the Resonance over it comes through the
     * side's shared `toQ`, faded at the top (issue 195).
     */
    setSides(slope: FilterSlope, t: number) {
      sides.forEach((side, s) => {
        const mode = shared.sides[s].mode;
        if (!mode) return;
        const flat = filterStages(mode, slope, 0);
        side.stages.forEach((node, i) => setStage(node, flat[i], { writes: shared.writes, t }));
        write(side.resonanceFade.gain, isPeaked(mode) ? -1 : 0, t);
        write(side.levelFade.gain, fadesOutAtTheTop(mode) ? -1 : 0, t);
      });
    },

    /**
     * Fade over to side `to` from `t` (issue 248), from `startShare`, its share of the sound then, to all of it: both
     * sides wired, each through its share, until `settle`.
     */
    fadeTo(to: number, t: number, startShare: number) {
      sides.forEach((side, s) => {
        wire(side, true, side.share);
        side.share.gain.cancelScheduledValues(t);
        side.share.gain.setValueAtTime(s === to ? startShare : 1 - startShare, t);
        side.share.gain.linearRampToValueAtTime(s === to ? 1 : 0, t + MODE_FADE);
      });
    },
    /** Once the fade to side `to` is over: it alone wired, directly, and the other side not at all, with new stages. */
    settle(to: number) {
      sides.forEach((side, s) => {
        if (s === to) return wire(side, true, side.level);
        wire(side, false);
        side.stages.forEach((node, k) => {
          node.disconnect();
          cutoffClamp.disconnect(node.detune);
          side.kept[k].disconnect(node.Q);
        });
        side.stages = newStages(side.kept, side.level);
      });
    },

    /** A Tap listens to this Voice's stage: a side branch, so observing never alters the sound. */
    attach(taps: Taps, tap: TapName) {
      if (tap !== 'filter') return ({ oscillator: dcBlock, amp: tremoloGain } as const)[tap].connect(taps[tap]);
      filterTaps.add(taps.filter);
      for (const side of sides) side.out?.connect(taps.filter);
    },
    detach(taps: Taps, tap: TapName) {
      if (tap !== 'filter') return ({ oscillator: dcBlock, amp: tremoloGain } as const)[tap].disconnect(taps[tap]);
      filterTaps.delete(taps.filter);
      for (const side of sides) side.out?.disconnect(taps.filter);
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
export function createSynthEngine(
  ctx: BaseAudioContext,
  {
    wall = () => performance.now() / 1000,
  }: {
    /** The page's clock, in seconds, which carries the clock drawn from on while paused (issue 216). */
    wall?: () => number;
  } = {},
): SynthEngine {
  const master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;
  // Protects the listener when several full-level sources and Resonance stack up. It sits after the Amp Tap,
  // so it never changes what the Viewers show (ADR-0006). Exactly linear below 0.8 of full scale; above, a
  // smooth bend that never passes 1. (A DynamicsCompressorNode was rejected: it adds make-up gain to every
  // sound and a few milliseconds of lookahead delay.)
  const [safetyIn, safety, safetyOut] = [ctx.createGain(), ctx.createWaveShaper(), ctx.createGain()];
  safetyIn.gain.value = 1 / SAFETY_RANGE; // the shaper's curve covers ±1; this lets it see inputs up to ±SAFETY_RANGE
  safety.curve = SAFETY_CURVE;
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
    const [toCutoff, toPitch, toOsc2, toResonance, toVolume] = Array.from({ length: 5 }, () => {
      const g = ctx.createGain();
      g.gain.value = 0;
      bus.connect(g);
      return g;
    });
    for (const side of sides) {
      toResonance.connect(side.resonanceQ);
      toResonance.connect(side.makeUp);
    }
    return { takeover: createTakeover(osc, ctx.currentTime, (node) => node.disconnect()), bus, toCutoff, toPitch, toOsc2, toResonance, toVolume };
  };
  const resonanceIn = ctx.createConstantSource();
  resonanceIn.offset.value = -1;
  resonanceIn.start();
  // Each side of the Filter's Resonance curve and make-up (issue 248), from the same Resonance. The make-up (issue 231)
  // is not smoothed: it changes with its side's stages, at the same sample, so each side plays its own Mode's level.
  const sides = [0, 1].map((): FilterSide => {
    const resonanceQ = ctx.createWaveShaper();
    resonanceIn.connect(resonanceQ);
    const toQ = [ctx.createGain(), ctx.createGain()] as [GainNode, GainNode];
    for (const g of toQ) resonanceQ.connect(g);
    const makeUp = ctx.createWaveShaper();
    makeUp.curve = makeUpCurve('lowpass', 12);
    resonanceIn.connect(makeUp);
    return { resonanceQ, toQ, makeUp, curveFrom: createChangeDetector<readonly [FilterMode, FilterSlope]>(), curveStages: [0, 0] };
  }) as [FilterSide, FilterSide];
  // The side heard, or faded to (issue 248); when its fade began, and its share of the sound then.
  let heard = 0;
  let fade = { start: -MODE_FADE, startShare: 1 };
  // The latest fade's number: a fade's end acts only while its fade is still the latest, so beginning a fade, or settling
  // one early, gives up the end of the one before. Whether the latest has settled: until then the side faded out keeps
  // its old Mode, though silent once the fade is over by the clock (the 1.26.1 review and statistics run).
  let latestFade = 0;
  let settled = true;
  // A Mode asked for while a fade was under way, for when it is over; and the Slope the sides were last set to.
  let pending: FilterMode | undefined;
  let slopeNow: FilterSlope = 12;
  /** The side heard's share of the sound at `t`: all of it, but while a change of Mode fades or waits to. */
  const heardShare = (t: number) =>
    t >= fade.start + MODE_FADE ? 1 : fade.startShare + ((1 - fade.startShare) * Math.max(0, t - fade.start)) / MODE_FADE;
  // What the twins' stages were last set from: a knob that leaves them as they are does not set them again (issue 218).
  const twinStagesFrom = createChangeDetector<readonly [FilterMode, FilterSlope, number]>();
  const [bend, pressing] = [ctx.createConstantSource(), ctx.createConstantSource()];
  for (const cents of [bend, pressing]) {
    cents.offset.value = 0;
    cents.start();
  }
  const tremoloRest = ctx.createConstantSource();
  tremoloRest.offset.value = 1;
  tremoloRest.start();
  const white = noiseBuffer(ctx);
  // The Oscillators' waves, shared by every Voice; the most recently asked for are kept, as each Note may ask for its
  // own while Ring is up (issue 103).
  const oscillatorWaves = createCache<string, PeriodicWave>(KEPT_WAVES);
  const oscillatorWave = (waveform: Exclude<Waveform, 'pulse'>, harmonics: number) =>
    oscillatorWaves.get(`${waveform} ${harmonics}`, () => {
      const { real, imag } = harmonicSeries(waveform, 0.5, WAVE_HARMONICS);
      return ctx.createPeriodicWave(real.subarray(0, harmonics + 1), imag.subarray(0, harmonics + 1), { disableNormalization: true });
    });
  const shared: Shared = {
    lfos: [lfoNodes(), lfoNodes()], resonanceIn, sides, bend, pressing, tremoloRest, noise: { white, pink: pinkBuffer(ctx, white) }, wave: oscillatorWave, master,
    writes: createWrites(),
  };
  const write = shared.writes.set;
  const voices = Array.from({ length: MAX_VOICES }, (_, i) => createVoice(ctx, shared, i));
  const lfoWaves = createCache<string, PeriodicWave>(KEPT_LFO_WAVES);
  const wave = (w: LfoWaveform, start: number) => lfoWaves.get(`${w} ${start}`, () => lfoWave(ctx, w, start));
  // Where each LFO oscillator's cycle started, as a phase of its Waveform: a retriggered one's at its Waveform's
  // start then (`LFO_START`), kept through any later change of Waveform, as the model's clock keeps it (issue 124).
  const lfoStarts = new WeakMap<OscillatorNode, number>();
  const setLfoWave = (node: OscillatorNode, waveform: LfoWaveform) => setLfoWaveform(node, waveform, lfoStarts.get(node) ?? 0, wave);
  // What the engine played, which the Viewers ask about (issue 244): the Gates, pitches, Patches, bend, aftertouch, each
  // LFO's clock (advanced with every Rate change and restart exactly as its oscillators are, ADR-0003) and the tempo.
  const model = createModulationRecord(ctx.currentTime);
  // The chord each LFO last restarted for: when its Notes were asked for, and when it restarted.
  const lfoChords: ({ asked: number; t: number } | null)[] = [null, null];
  // What each synced free LFO was last locked to the beat with (issue 112): the tempo, its note value and Waveform.
  const locks: (readonly [bpm: number, origin: number, note: Lfo['note'], waveform: LfoWaveform] | null)[] = [null, null];
  const lockedWith = (l: Lfo) => {
    const { bpm, origin } = model.tempo();
    return [bpm, origin, l.note, l.waveform] as const;
  };
  // A synced free LFO being pulled onto the beat: the Rate it runs at until then (review 14).
  const pulls: ({ rate: number; until: number } | null)[] = [null, null];
  const hz = (l: Lfo) => lfoHz(l, model.tempo().bpm);
  /** The Rate LFO `i` runs at `t`: its own, or a pull's while it lasts. */
  const lfoRate = (i: number, l: Lfo, t: number) => {
    const pull = pulls[i];
    return pull && t < pull.until ? pull.rate : hz(l);
  };
  /**
   * LFO `i` at its Rate from `t`, in the clock and in its oscillators (a restart handed over ahead of now leaves the
   * old one running until then: it follows too), its Waveform too with `withWaveform` (issue 196: applyPatch's and
   * setTempo's one loop).
   */
  const followRate = (i: number, l: Lfo, t: number, { withWaveform = false } = {}) => {
    const rate = lfoRate(i, l, t);
    model.recordLfoRate(i, t, rate);
    for (const osc of shared.lfos[i].takeover.nodes()) {
      const was = lfoSetTo.get(osc);
      if (withWaveform && was?.waveform !== l.waveform) setLfoWave(osc, l.waveform);
      if (was?.rate !== rate) osc.frequency.setValueAtTime(rate, t);
      lfoSetTo.set(osc, { rate, waveform: withWaveform ? l.waveform : was?.waveform });
    }
  };
  /**
   * The Rate each LFO oscillator was last set to run at, and its Waveform: a Patch that leaves both as they are, on
   * every oscillator of the LFO, leaves them alone (issue 218). Forgotten when a whole new Patch is written.
   */
  let lfoSetTo = new WeakMap<OscillatorNode, { rate: number; waveform?: LfoWaveform }>();
  /** An LFO oscillator runs at `rate` from `t`, what it was set to after `t` called off, its Waveform as it was. */
  const setLfoRate = (osc: OscillatorNode, rate: number, t: number) => {
    osc.frequency.cancelScheduledValues(t);
    osc.frequency.setValueAtTime(rate, t);
    lfoSetTo.set(osc, { rate, waveform: lfoSetTo.get(osc)?.waveform });
  };
  /** Whether every oscillator of LFO `i` is set already to the Rate and Waveform it runs at `t` under `l`. */
  const lfoAlreadyAt = (i: number, l: Lfo, t: number) => {
    const rate = lfoRate(i, l, t);
    return [...shared.lfos[i].takeover.nodes()].every((osc) => lfoSetTo.get(osc)?.rate === rate && lfoSetTo.get(osc)?.waveform === l.waveform);
  };
  /** A new oscillator for LFO `i`, its cycle starting at phase `start` of its Waveform, wired to the LFO's bus. */
  const lfoOscillator = (i: number, l: Lfo, start: number) => () => {
    const next = ctx.createOscillator();
    lfoStarts.set(next, start);
    setLfoWave(next, l.waveform);
    next.frequency.value = hz(l);
    lfoSetTo.set(next, { rate: hz(l), waveform: l.waveform });
    next.connect(shared.lfos[i].bus);
    return next;
  };
  /**
   * A retriggering LFO starts its cycle again at `t`, where its Waveform classically starts (issue 124): a new
   * oscillator takes over from the running one there (an oscillator cannot be reset), and the model's clock restarts
   * with it, at the same phase; restarts handed over for after `t` are called off in both. A chord's Notes, asked for
   * at the same moment, restart it once, where the first of them starts: those that dip first (issue 102) start 3 ms
   * into its cycle, rather than it jumping 3 ms into the others'.
   */
  const restartLfo = (i: number, l: Lfo, asked: number, t: number) => {
    const chord = lfoChords[i];
    if (chord && chord.asked === asked && chord.t <= t) return;
    lfoChords[i] = { asked, t };
    const start = LFO_START[l.waveform];
    if (!shared.lfos[i].takeover.restart(t, lfoOscillator(i, l, start))) return;
    model.cancelLfoRestarts(i, t);
    model.recordLfoRestart(i, t, start);
  };
  /** A pull onto the beat still to end after `t` is called off, in the sound and the model: the LFO runs at its Rate. */
  const endPull = (i: number, l: Lfo, t: number) => {
    const pull = pulls[i];
    pulls[i] = null;
    if (!pull || pull.until <= t) return;
    for (const osc of shared.lfos[i].takeover.nodes()) setLfoRate(osc, hz(l), t);
    model.cancelLfoRates(i, t);
    model.recordLfoRate(i, t, hz(l));
  };
  /**
   * Each synced LFO running freely starts its cycle on a beat (issue 112): at its Waveform's start (`LFO_START`) on the
   * tempo's origin and every note value after, in the sound and the model alike. Locked again only when what it is
   * locked with changes (Sync coming on, the note value, the Waveform, the tempo). From now, it is pulled onto the beat
   * (review 14): it carries on from its phase and runs a little faster or slower for `PULL_CYCLES` of its cycles, by
   * the fraction of a cycle it is off the beat (a quarter of its Rate at most), and is on it from there; a jump to the
   * beat's phase clicked on the Volume. An origin still to come (a player's first beat) restarts it there, a new
   * oscillator taking over, as the player's first Note starts.
   */
  const lockToBeat = (then: Patch, t: number) => {
    const tempo = model.tempo();
    lfos(then).forEach((l, i) => {
      const lock = l.sync === 'on' && l.retrigger === 'free' ? lockedWith(l) : null;
      if (sameKey(lock, locks[i])) return;
      locks[i] = lock;
      endPull(i, l, t);
      if (!lock) return;
      const nodes = shared.lfos[i];
      nodes.takeover.cancelAfter(t);
      model.cancelLfoRestarts(i, t);
      const rate = hz(l);
      if (tempo.origin > t) {
        const start = LFO_START[l.waveform];
        nodes.takeover.restart(tempo.origin, lfoOscillator(i, l, start), { again: true });
        model.recordLfoRestart(i, tempo.origin, start);
        return;
      }
      // How far the beat is ahead of the LFO, the nearer way round: made up over the pull.
      const ahead = LFO_START[l.waveform] + (t - tempo.origin) * rate - model.lfoPhaseAt(i, t);
      const off = ahead - Math.round(ahead);
      if (Math.abs(off) < 1e-9) return;
      // Whole samples, so the oscillator's Rate changes back where the model's does.
      const span = Math.max(1, Math.round((PULL_CYCLES / rate) * ctx.sampleRate)) / ctx.sampleRate;
      const pull = { rate: rate + off / span, until: t + span };
      pulls[i] = pull;
      for (const osc of nodes.takeover.nodes()) {
        setLfoRate(osc, pull.rate, t); // until the pull ends
        osc.frequency.setValueAtTime(rate, pull.until);
      }
      model.recordLfoRate(i, t, pull.rate);
      model.recordLfoRate(i, pull.until, rate);
    });
  };
  /** Call off the LFOs' restarts after `t`, in the sound and the model, for a Note whose Gate closed before it started. */
  const cancelLfoRestarts = (t: number) => {
    shared.lfos.forEach((nodes, i) => {
      nodes.takeover.cancelAfter(t);
      model.cancelLfoRestarts(i, t);
      if ((lfoChords[i]?.t ?? -Infinity) > t) lfoChords[i] = null;
    });
  };
  // When the page paused the sound, on the page's clock (issue 216).
  let pausedAt: number | null = null;
  const shownNow = () => ctx.currentTime + (pausedAt === null ? 0 : Math.max(0, wall() - pausedAt));
  /**
   * Back from a pause of `seconds`: the record carries each LFO's history and the beat on by it (its `carryOn`), and
   * each LFO's oscillator starts again here at the phase the record then has, so a synced LFO stays on the beat.
   */
  const carryOn = (seconds: number) => {
    const t = ctx.currentTime;
    if (!(seconds > 0) || !patch) return;
    const then = patch;
    lfos(then).forEach((l, i) => endPull(i, l, t));
    model.carryOn(seconds, t);
    lfos(then).forEach((l, i) => {
      lfoChords[i] = null;
      if (locks[i] !== null) locks[i] = lockedWith(l);
      shared.lfos[i].takeover.restart(t, lfoOscillator(i, l, model.lfoPhaseAt(i, t)), { again: true });
    });
  };

  let patch: Patch | undefined;
  // What aftertouch on Pitch last moved its node to, in cents: a message on another Destination leaves it be.
  const pressingCents = createChangeDetector<readonly [number]>([0]);
  /** The Voice of the newest Note: the Taps listen to it (or to every Voice, when asked). */
  let lead: Voice | null = null;
  let tapSource: TapSource = 'newest';
  const listening = new Map<Voice, Set<TapName>>(voices.map((v) => [v, new Set<TapName>()]));
  /** Connect each Tap to the Voices it should hear now, and to nothing else. */
  const listen = () => {
    for (const v of voices) {
      const wanted = new Set<TapName>();
      if (v === lead) wanted.add('oscillator').add('filter').add('amp');
      if (tapSource === 'all' && v.wired) wanted.add('amp');
      const current = listening.get(v)!;
      for (const tap of current) if (!wanted.has(tap)) { v.detach(taps, tap); current.delete(tap); }
      for (const tap of wanted) if (!current.has(tap)) { v.attach(taps, tap); current.add(tap); }
    }
  };

  const at = (time?: number) => time ?? ctx.currentTime;
  const voiceCount = (): Voices => patch?.voices ?? 1;

  /** When each Voice ringing out beyond the setting is next looked at: the end of its Release. */
  const lookAt = new Map<Voice, number>();
  /**
   * Only the Voices that may sound are wired (issue 257): those the Voices setting uses, the newest Note's (the Taps
   * listen to it), and any still ringing out, looked at again when its Release has faded. The others are unwired, so
   * at 1 Voice the browser renders one Voice, not eight. A Voice set on is wired at once, silent, before any Note can
   * take it, and one unwired is silent: neither clicks.
   */
  const rewire = () => {
    const now = ctx.currentTime;
    voices.forEach((v, i) => {
      const ringing = v.freeAt > now;
      v.setWired(i < voiceCount() || v === lead || ringing);
      if (i < voiceCount() || v === lead || !ringing || !Number.isFinite(v.freeAt) || lookAt.get(v) === v.freeAt) return;
      // The browser's clock tells when the Release is over, as for a Mode's fade: a silent source ending then.
      lookAt.set(v, v.freeAt);
      const timer = ctx.createConstantSource();
      timer.offset.value = 0;
      timer.connect(master);
      timer.onended = () => {
        timer.disconnect();
        if (lookAt.get(v) === v.freeAt) lookAt.delete(v);
        rewire();
      };
      timer.start(v.freeAt);
      timer.stop(v.freeAt + RENDER_QUANTUM / ctx.sampleRate);
    });
    listen();
  };

  /**
   * A Gate off before its Note has started (one handed over, then stopped; a key let go within the dip) calls off the
   * Note's restart of the Oscillators and of the retriggered LFOs, which would come inside the Release (issue 102).
   */
  const callOffRestarts = (voice: Voice, t: number) => {
    if (voice.startedAt <= t) return;
    voice.cancelRestarts(t);
    cancelLfoRestarts(t);
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
    const dip = dipEvent && voice.amps.record(dipEvent);
    if (dipEvent && voice === lead) model.amp.record(dipEvent);
    voice.amps.record(ampEvent);
    if (voice === lead) {
      model.amp.record(ampEvent);
      model.filter.record(filterEvent);
    }
    voice.gate(ampEvent, filterEvent, velocity, dip);
    if (on) {
      voice.startedAt = t;
      voice.releasedAt = null;
      voice.freeAt = Infinity;
    } else {
      callOffRestarts(voice, t);
      voice.releasedAt = t;
      voice.freeAt = t + patch.ampRelease * RELEASE_TAIL;
      // One beyond the setting rings out, then is unwired.
      if (voices.indexOf(voice) >= voiceCount()) rewire();
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
    rewire();
  };
  follow(voices[0]);

  // The newest Note played, and who wants to know when it changes: the Synth Geek Layer's readouts.
  let newest: number | null = null;
  const newestListeners = new Set<() => void>();
  const setLeadPitch = (voice: Voice, note: number, t: number) => {
    // Glide is a one-Voice behaviour: a Note slides from the previous one; with more Voices, Notes start at pitch.
    const glide = patch && model.hasPitch() && voiceCount() === 1 && patch.glide > GLIDE_OFF * 1.001 ? patch.glide : 0;
    voice.setPitch(note, t, glide);
    model.recordPitch(t, note, glide);
    if (note !== newest) {
      newest = note;
      for (const listener of newestListeners) listener();
    }
  };
  /** Each side's Resonance curves for its Mode at `slope`, made again only when they change, and its stages' shares. */
  const setSideCurves = (slope: FilterSlope, t: number) => {
    for (const side of sides) {
      if (!side.mode) continue;
      if (side.curveFrom.changed([side.mode, slope])) {
        const { curve, stages } = resonanceCurve(side.mode, slope);
        side.resonanceQ.curve = curve;
        side.makeUp.curve = makeUpCurve(side.mode, slope);
        side.curveStages = stages;
      }
      side.toQ.forEach((g, k) => write(g.gain, side.curveStages[k], t));
    }
  };
  /** Every Voice settles on side `to`, the side faded out unwired: the latest fade is over. */
  const settleOn = (to: number) => {
    for (const v of voices) v.settle(to);
    settled = true;
  };
  /**
   * Every Voice fades over to side `to` from `t`, from its share of the sound then. When the browser says the fade is
   * over, if it is still the latest, a Mode asked for meanwhile fades in next; or else the side faded out is unwired.
   */
  const fadeTo = (to: number, t: number) => {
    const share = heardShare(t);
    const startShare = to === heard ? share : 1 - share;
    heard = to;
    fade = { start: t, startShare };
    settled = false;
    for (const v of voices) v.fadeTo(to, t, startShare);
    const fading = ++latestFade;
    const timer = ctx.createConstantSource();
    timer.offset.value = 0;
    timer.connect(master);
    timer.onended = () => {
      timer.disconnect();
      if (fading !== latestFade) return;
      settleOn(to);
      if (!pending) return;
      // The side faded out, unwired with new stages, takes the Mode; its fade starts a little after now, as the sound
      // may have gone on past the clock read here by the time the fade is written (an offline render does not wait).
      sides[1 - heard].mode = pending;
      pending = undefined;
      for (const v of voices) v.setSides(slopeNow, ctx.currentTime);
      setSideCurves(slopeNow, ctx.currentTime);
      fadeTo(1 - heard, ctx.currentTime + (2 * RENDER_QUANTUM) / ctx.sampleRate);
    };
    timer.start(t);
    timer.stop(t + MODE_FADE + RENDER_QUANTUM / ctx.sampleRate);
  };
  /**
   * A change of Filter Mode at `t` (issue 248): the side not heard takes the new Mode, and every Voice fades over to it,
   * so no side changes Mode while it is heard. While a fade is under way, a change back to the Mode faded from turns
   * the fade round from where it is; any other waits for the fade's end, and the last one asked for fades in then. Once
   * the fade is over by the clock, though the browser has not yet said so, a change settles it and fades in at once.
   */
  const toMode = (mode: FilterMode, t: number) => {
    if (!sides[heard].mode) sides[heard].mode = mode;
    if (!settled && t >= fade.start + MODE_FADE) {
      // The fade is over by the clock: settled now, its end's own settling and any Mode waiting given up for this one.
      ++latestFade;
      settleOn(heard);
      pending = undefined;
    }
    if (!settled) {
      pending = sides[heard].mode === mode || sides[1 - heard].mode === mode ? undefined : mode;
      if (sides[1 - heard].mode === mode) fadeTo(1 - heard, t);
      return;
    }
    if (sides[heard].mode === mode) return;
    sides[1 - heard].mode = mode;
    fadeTo(1 - heard, t);
  };
  /**
   * What the sound takes from the Patch it plays, `next` (the knobs as aftertouch moved its Destination, issue 132): every
   * Voice's settings, and the gains the LFOs reach their Destinations through: only those it changes, or with `whole`
   * every one (issue 218).
   */
  const applyToSound = (next: Patch, t: number, { whole = false } = {}) => {
    slopeNow = next.filterSlope;
    toMode(next.filterMode, t);
    for (const v of voices) v.apply(next, t, { whole });
    // The laws' swings (issue 74), in the units the nodes take: cents for the pitches and the Cutoff.
    const cutoffCents = destinationSwings(next, 'cutoff').map((octaves) => octaves * 1200);
    const pitchCents = destinationSwings(next, 'pitch').map((semitones) => semitones * 100);
    const detuneCents = destinationSwings(next, 'detune');
    const osc2 = destinationSwings(next, 'osc2Pitch').map((semitones, i) => semitones * 100 + detuneCents[i]);
    // Resonance: the knob's (aftertouch's with it) and each LFO's swing, which the curve turns into each stage's Q. The
    // curve takes the Resonance's 0 to 1 as −1 to 1.
    const resonances = destinationSwings(next, 'resonance', next.resonance);
    setSideCurves(next.filterSlope, t);
    write(resonanceIn.offset, 2 * next.resonance - 1, t);
    // Volume: the knob's level (issue 62), the tremolo resting its total swing below it, so the wave's top is the
    // knob's own level; each LFO's swing scaled with it.
    const volumeSwings = destinationSwings(next, 'volume').map((s) => s * next.volume);
    write(tremoloRest.offset, next.volume - volumeSwings[0] - volumeSwings[1], t);
    shared.lfos.forEach((nodes, i) => {
      write(nodes.toCutoff.gain, cutoffCents[i], t);
      write(nodes.toPitch.gain, pitchCents[i], t);
      write(nodes.toOsc2.gain, osc2[i], t);
      write(nodes.toVolume.gain, volumeSwings[i], t);
      write(nodes.toResonance.gain, 2 * resonances[i], t);
    });
    // The twins copy each stage for the Response Curve, when the stages change.
    if (twinStagesFrom.changed([next.filterMode, next.filterSlope, next.resonance], { afresh: whole })) {
      const stages = filterStages(next.filterMode, next.filterSlope, next.resonance);
      twins.forEach((node, i) => setStage(node, stages[i]));
    }
  };

  return {
    taps,
    fundamental: () => model.fundamentalAt(ctx.currentTime, { withVibrato: false }),
    fundamentalAt: (time) => model.fundamentalAt(time, { withVibrato: true }),
    newestNote: () => newest,
    onNewestNote(listener) {
      newestListeners.add(listener);
      return () => newestListeners.delete(listener);
    },
    // Drawn at the clock shown: through a pause, the rings and the Pitch marker go on moving (issue 216).
    modulationAt: (time) => model.modulationAt(time ?? shownNow()),
    lfoSwingAt: model.lfoSwingAt,
    patchAt: model.patchAt,
    settledFrom: model.settledFrom,
    setTempo(bpm, origin = ctx.currentTime) {
      model.setTempo(bpm, origin);
      if (!patch) return;
      const t = ctx.currentTime;
      lfos(patch).forEach((l, i) => l.sync === 'on' && followRate(i, l, t));
      lockToBeat(patch, t);
    },
    tempo: model.tempo,
    now: () => ctx.currentTime,
    quietFrom: () => Math.max(...voices.map((v) => v.freeAt)),
    pause() {
      pausedAt ??= wall();
    },
    wake() {
      if (pausedAt === null) return;
      const seconds = wall() - pausedAt;
      pausedAt = null;
      carryOn(seconds);
    },
    paused: () => pausedAt !== null,
    shownNow,
    heardAt: (pageTime) => heardAt(ctx as OutputClockContext, pageTime, performance.now() / 1000),
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
      const { cutoff, resonance } = model.modulationAt(shownNow() - TAP_WINDOW / 2 / ctx.sampleRate);
      // An LFO on Resonance moves the twins' Q with it; near the top the Resonance fades, a high-pass with it (issue 195).
      if (patch) filterStagesAt(patch.filterMode, patch.filterSlope, resonance, cutoff).forEach((stage, i) => (twins[i].Q.value = stage.Q));
      // A band-pass's make-up at the Resonance as moved (issue 231): what is drawn is what is heard.
      const level = patch ? filterLevel(patch.filterMode, cutoff) * makeUp(patch.filterMode, patch.filterSlope, resonance) : 1;
      const total = new Float32Array(frequencies.length).fill(level);
      const stage = new Float32Array(frequencies.length);
      const phase = new Float32Array(frequencies.length);
      for (const twin of twins) {
        twin.frequency.value = cutoff;
        twin.getFrequencyResponse(frequencies, stage, phase);
        for (let i = 0; i < total.length; i++) total[i] *= stage[i];
      }
      return total;
    },

    applyPatch(next, { whole = false } = {}) {
      const voicesBefore = voiceCount();
      patch = next;
      if (next.voices !== voicesBefore) rewire();
      if (whole) {
        shared.writes.forget();
        lfoSetTo = new WeakMap();
      }
      const t = ctx.currentTime;
      lfos(next).forEach((l, i) => {
        if (!lfoAlreadyAt(i, l, t)) followRate(i, l, t, { withWaveform: true });
      });
      model.recordPatch(t, next);
      // Aftertouch's Destination from where its glide has reached, then gliding on to where it is going (issue 219).
      const [now, to] = [model.pressureAt(t), model.pressureTo(t)];
      applyToSound(pressed(next, now), t, { whole });
      if (now.amount !== to.amount) shared.writes.gliding(PRESSURE_GLIDE, () => applyToSound(pressed(next, to), t));
      lockToBeat(next, t);
      // Several Voices sum before the master: the listening level makes room for them (after the Amp Tap, so
      // the Viewers' scale is unchanged, ADR-0006); one Voice plays exactly as loud as before.
      write(master.gain, MASTER_LEVEL / Math.sqrt(next.voices), t);
    },

    setPressure(pressure, time) {
      const t = at(time);
      // It glides from where it has reached, as the bend wheel moves Pitch, so pressing harder does not step (issue
      // 219). Moved to another Destination while pressed, it starts there at once and the last one is let go at once.
      const glide = model.recordPressure(t, pressure);
      const knobs = patch;
      const move = () => knobs && applyToSound(pressed(knobs, pressure), t);
      if (glide) shared.writes.gliding(glide, move);
      else move();
      const cents = pressurePitch(pressure) * 100;
      if (pressingCents.changed([cents])) moveTo(pressing.offset, cents, t, glide);
    },

    noteOn(note, velocity, time, { afresh = false } = {}) {
      const asked = at(time);
      const voice = allocate(note, asked);
      // A legato Note, one Voice pressed on while its Note still sounds held, slides on from it: restarting the
      // Oscillators there would click mid-sound (issue 94, decision 2).
      const legato = voiceCount() === 1 && voice.note !== null && voice.releasedAt === null;
      follow(voice);
      if (legato && !afresh && patch?.legato === 'on') {
        // With Legato on, played over a key held, it changes the pitch alone (issue 119): the Envelopes and the
        // retriggered LFOs carry on, as they do when the newest key goes up and the Note returns to one still held.
        voice.note = note;
        setLeadPitch(voice, note, asked);
        return;
      }
      // Any other Note restarts them. On a Voice still sounding (in its Release, or taken while held) it dips to silence
      // first, so the restart does not click, and the Note starts after the dip, the same way every time (issue 102).
      // Its history holds the Notes handed over ahead of the clock, so one of those dips as it will sound.
      const dipFrom = !legato && voice.amps.levelAt(asked) > SILENT ? asked : undefined;
      const t = dipFrom === undefined ? asked : asked + DIP;
      if (patch) lfos(patch).forEach((l, i) => l.retrigger === 'note' && restartLfo(i, l, asked, t));
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
      model.recordBend(t, cents);
      // A few milliseconds of smoothing, so a wheel's steps do not click.
      bend.offset.setTargetAtTime(model.bendAt(t), t, BEND_SMOOTHING);
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

    silence(time) {
      if (!patch) return;
      const t = at(time);
      for (const v of voices.slice(0, voiceCount())) {
        if (v.freeAt <= t) continue;
        const cut: GateEvent = { time: t, on: false, adsr: ampAdsr(patch), peak: 0, dip: true };
        const filterEvent: GateEvent = { time: t, on: false, adsr: filterAdsr(patch), peak: 1 };
        const entry = v.amps.record(cut);
        if (v === lead) {
          model.amp.record(cut);
          model.filter.record(filterEvent);
        }
        v.cut(entry, filterEvent);
        callOffRestarts(v, t);
        if (v.releasedAt === null || v.releasedAt > t) v.releasedAt = t;
        v.freeAt = t + DIP;
      }
    },
  };
}
