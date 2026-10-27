import { type Adsr, type AutomationStep, envelopeSchedule, type GateEvent, levelAfter } from '../modulation/envelope';
import { createLfoClock, glideFrequency, glideFrom, glideTimeConstant, type LfoWaveform, lfoShape } from '../modulation/lfo';
import {
  effectiveCutoff, effectiveResonance, effectiveVolume,KEY_TRACK_CENTRE, LFO_CUTOFF_OCTAVES, LFO_DETUNE_CENTS, LFO_OSC2_CENTS,
  LFO_PITCH_CENTS, LFO_PULSE_WIDTH, LFO_RESONANCE, LFO_VOLUME, lfoSwings, MAX_PULSE, MIN_PULSE, soundingPitch, 
  VELOCITY_CUTOFF_OCTAVES,
} from '../modulation/modulationModel';
import { bandwidthOctaves } from '../modulation/passBand';
import type { Sounding } from '../modulation/reach';
import { harmonicSeries } from '../music/harmonics';
import { frequencyToNote, noteToFrequency } from '../music/pitch';
import { type FilterMode, GLIDE_OFF, type Lfo, type LfoDestination, type LfoNumber, lfos, PARAMS, type Patch, type Voices } from '../patch/patch';
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

/** What the Modulation model says at a moment: both Envelope levels, the Effective Cutoff and the Filter's shape. */
export interface Modulation {
  amp: number;
  filter: number;
  cutoff: number;
  /** Each LFO's value (−1 to 1), LFO 1 first. */
  lfo: [number, number];
  mode: FilterMode;
  /** The Resonance after the LFOs (0–1). */
  resonance: number;
  /** Band-pass and notch width in octaves. */
  bandwidth: number;
  /** What the Amp is multiplied by (0–1): the Volume knob, dipped by the LFOs on Volume (issue 62). */
  volume: number;
  /** The newest Note while its key is held (or Hold keeps it), with its Velocity; null once released. */
  sounding: Sounding | null;
  /** The pitch the newest Note sounds at, in semitones (fractional through a Glide or vibrato); A4 before any. */
  pitch: number;
  /** How far an LFO on Pitch moves it right now, in semitones: `pitch` less the Note where the Glide has taken it. */
  vibrato: number;
}

export interface SynthEngine {
  applyPatch(patch: Patch): void;
  /** A Note starts: on the one Voice (1 Voice), or on a free Voice (more). The Viewers follow it. */
  noteOn(note: number, velocity: number, at?: number): void;
  /** One Voice: the sounding Note changes pitch (last-note priority, Glide) without a new Gate. */
  pitchChange(note: number, at?: number): void;
  /** A keyboard's bend wheel: every Voice's pitch moves by `cents` from `at` on, until the next bend (issue 52). */
  setBend(cents: number, at?: number): void;
  /** The Gate closes: every Voice releases. */
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
  /** The Cutoff knob's own setting at `time` (before modulation). */
  baseCutoffAt(time: number): number;
  now(): number;
  /**
   * The Response Curve: gain (linear) at each frequency from the Oscillator Tap to the Filter Tap, at the
   * Effective Cutoff right now.
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

// Enough Harmonics to reach Nyquist from the lowest Notes; the browser band-limits per pitch.
const WAVE_HARMONICS = 1024;
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

function createAnalyser(ctx: BaseAudioContext): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 8192;
  analyser.smoothingTimeConstant = 0;
  return analyser;
}

/**
 * The LFO Waveforms with corners, from their series as Web Audio defines its own oscillators, but not normalised:
 * normalising scales the series to its overshoot at the corners, so a square's plateaus would sit near ±0.85 and a
 * saw's ramp would fall short, while the Modulation model (and every Viewer) has them at exactly ±1 (ADR-0003).
 */
const LFO_SERIES: Record<'square' | 'saw' | 'sawDown', (n: number) => number> = {
  square: (n) => (n % 2 ? 4 / (n * Math.PI) : 0),
  saw: (n) => (n % 2 ? 2 : -2) / (n * Math.PI),
  sawDown: (n) => (n % 2 ? -2 : 2) / (n * Math.PI),
};

function lfoWave(ctx: BaseAudioContext, waveform: keyof typeof LFO_SERIES): PeriodicWave {
  const real = new Float32Array(2048);
  const imag = real.map((_, n) => (n ? LFO_SERIES[waveform](n) : 0));
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

/** Set an LFO oscillator's Waveform: a sine or a triangle (whose series never overshoots) as Web Audio's own. */
function setLfoWaveform(lfo: OscillatorNode, waveform: LfoWaveform, wave: (w: keyof typeof LFO_SERIES) => PeriodicWave) {
  if (waveform === 'sine' || waveform === 'triangle') lfo.type = waveform;
  else lfo.setPeriodicWave(wave(waveform));
}

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
  const pwm = [ctx.createGain(), ctx.createGain()]; // each LFO → delay time
  node.connect(direct).connect(out);
  node.connect(delay).connect(inverted).connect(out);
  for (const g of pwm) {
    g.connect(delay.delayTime);
    g.gain.value = 0;
  }
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
    else param.setTargetAtTime(s.target * scale, s.time, s.timeConstant);
  }
}

const ampAdsr = (p: Patch): Adsr => ({ attack: p.ampAttack, decay: p.ampDecay, sustain: p.ampSustain, release: p.ampRelease });
const filterAdsr = (p: Patch): Adsr => ({ attack: p.filterAttack, decay: p.filterDecay, sustain: p.filterSustain, release: p.filterRelease });

// A released Voice counts as free again once its Release has run this many time constants.
const RELEASE_TAIL = 6;
const A4 = noteToFrequency(69);

/**
 * One LFO: a real oscillator, wired to each destination through a gain set from its Depth (zero unless it is aimed
 * there): the Cutoff and the pitch in cents (through `detune`), Osc 2's tuning in cents, each Filter stage's Q, the
 * tremolo's gain.
 * Pulse Width goes through each Voice's own gains, since its swing depends on the Note. The oscillator feeds a bus
 * the rest is wired to, so a retriggering Note can swap in a new oscillator that starts its cycle at that Note.
 */
interface LfoNodes {
  osc: OscillatorNode;
  bus: GainNode;
  /** The oscillator a restart is replacing, until it stops; and when the newest restart starts. */
  previous: OscillatorNode | null;
  restartAt: number;
  toCutoff: GainNode;
  toPitch: GainNode;
  toOsc2: GainNode;
  toQ: [GainNode, GainNode];
  toVolume: GainNode;
}

/** What every Voice shares: the LFOs, the pitch bend, the noise loop, and where the Voices' outputs go. */
interface Shared {
  lfos: [LfoNodes, LfoNodes];
  /** The pitch bend in cents, into every Oscillator's detune (the LFO on Pitch goes there too). */
  bend: ConstantSourceNode;
  /** The tremolo's resting gain, into every Voice's: 1 less the LFOs' total swing on Volume. */
  tremoloRest: ConstantSourceNode;
  noise: AudioBuffer;
  master: GainNode;
}

/**
 * One Voice: Oscillators → Mixer → Filter → Amp, built from native Web Audio nodes (ADR-0001), with its own
 * Envelopes, Velocity and Key Track sources. The engine builds MAX_VOICES of these; a Patch with 1 Voice only
 * ever plays the first, exactly as the monophonic instrument did.
 */
function createVoice(ctx: BaseAudioContext, shared: Shared, index: number) {
  // Sources → Mixer. Each source's Mixer level is scaled by the Nominal Level; the Mixer's output is the
  // Oscillator Tap.
  const oscillators = [createVoiceOscillator(ctx), createVoiceOscillator(ctx)];
  const [osc, osc2] = oscillators.map((v) => v.node);
  const noise = ctx.createBufferSource();
  noise.buffer = shared.noise;
  noise.loop = true;
  const [mix1, mix2, mixNoise] = [ctx.createGain(), ctx.createGain(), ctx.createGain()];
  mix1.gain.value = OSCILLATOR_LEVEL;
  mix2.gain.value = 0;
  mixNoise.gain.value = 0;
  const mixer = ctx.createGain();
  oscillators[0].out.connect(mix1).connect(mixer);
  oscillators[1].out.connect(mix2).connect(mixer);
  noise.connect(mixNoise).connect(mixer);
  // The Sub-oscillator: a square an octave below Osc 1, following its pitch, Glide and vibrato.
  const sub = ctx.createOscillator();
  const square = harmonicSeries('square', 0.5, WAVE_HARMONICS);
  sub.setPeriodicWave(ctx.createPeriodicWave(square.real, square.imag, { disableNormalization: true }));
  sub.frequency.value = A4 / 2;
  const mixSub = ctx.createGain();
  mixSub.gain.value = 0;
  sub.connect(mixSub).connect(mixer);
  sub.start();
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

  mixer.connect(filter).connect(filter2).connect(amp).connect(tremoloGain).connect(shared.master);
  // Every Voice's noise starts at a different point of the loop, so a chord's noise is not one noise, louder.
  noise.start(0, (index * NOISE_SECONDS) / MAX_VOICES);

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
      l.toPitch.connect(o.node.detune);
      l.bus.connect(o.pwm[i]);
    }
  });
  shared.bend.connect(sub.detune);
  for (const o of oscillators) shared.bend.connect(o.node.detune);

  const waveKeys = new Map<OscillatorNode, string>();
  const pulseWidths = [0.5, 0.5];
  const pitches: { time: number; frequency: number; note: number; glide: number }[] = [];
  osc.frequency.value = A4;
  osc2.frequency.value = A4;
  let patch: Patch | undefined;

  /** Point each pulse's delay at (width / frequency), and scale its LFO swing for that frequency. */
  const tunePulses = (frequency: number, t: number, timeConstant?: number) => {
    oscillators.forEach((o, i) => {
      const delay = pulseWidths[i] / frequency;
      if (timeConstant) o.delay.delayTime.setTargetAtTime(delay, t, timeConstant);
      else o.delay.delayTime.setValueAtTime(delay, t);
      const width = pulseWidths[i];
      const swings = patch ? lfoSwings(patch, 'pulseWidth', LFO_PULSE_WIDTH, Math.min(width - MIN_PULSE, MAX_PULSE - width)) : [0, 0];
      swings.forEach((swing, n) => o.pwm[n].gain.setValueAtTime(swing / frequency, t));
    });
  };

  // Play exactly the Fourier series the Ideal Reference draws (normalisation is already in it). A pulse plays a
  // saw here, and becomes a pulse through the delayed, inverted copy.
  const sawPeak = harmonicSeries('saw', 0.5, WAVE_HARMONICS).magnitudes[1];
  const setWave = (i: number, waveform: Patch['waveform'], width: number, t: number) => {
    const o = oscillators[i];
    const pulse = waveform === 'pulse';
    const key = pulse ? 'saw' : waveform;
    if (waveKeys.get(o.node) !== key) {
      waveKeys.set(o.node, key);
      const { real, imag } = harmonicSeries(pulse ? 'saw' : waveform, 0.5, WAVE_HARMONICS);
      o.node.setPeriodicWave(ctx.createPeriodicWave(real, imag, { disableNormalization: true }));
    }
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
        // Every Oscillator follows the Note: Osc 2's offsets ride on top, through its detune; the Sub an octave down.
        holdAt(node.frequency, t);
        if (glide) node.frequency.setTargetAtTime(f, t, glideTimeConstant(glide));
        else node.frequency.setValueAtTime(f, t);
      }
      tunePulses(frequency, t, glide ? glideTimeConstant(glide) : undefined);
      holdAt(trackedNote.offset, t);
      if (glide) trackedNote.offset.setTargetAtTime(note - KEY_TRACK_CENTRE, t, glideTimeConstant(glide));
      else trackedNote.offset.setValueAtTime(note - KEY_TRACK_CENTRE, t);
    },

    /** Play the model's Envelope schedules for a Gate change. */
    gate(ampEvent: GateEvent, filterEvent: GateEvent, velocity: number) {
      if (ampEvent.on) noteVelocity.offset.setValueAtTime(velocity, ampEvent.time);
      play(amp.gain, envelopeSchedule(ampEvent));
      play(filterEnvelope.offset, envelopeSchedule(filterEvent));
    },

    apply(next: Patch, t: number) {
      patch = next;
      setWave(0, next.waveform, next.pulseWidth, t);
      setWave(1, next.osc2Waveform, next.osc2PulseWidth, t);
      tunePulses(frequencyAt(t), t);
      osc2.detune.setValueAtTime(next.osc2Octave * 1200 + next.osc2Semitone * 100 + next.osc2Detune, t);
      mix1.gain.setValueAtTime(next.mixOsc1 * OSCILLATOR_LEVEL, t);
      mix2.gain.setValueAtTime(next.mixOsc2 * OSCILLATOR_LEVEL, t);
      mixNoise.gain.setValueAtTime(next.mixNoise * OSCILLATOR_LEVEL, t);
      mixSub.gain.setValueAtTime(next.mixSub * OSCILLATOR_LEVEL, t);
      // The base Cutoff; the Filter Envelope adds to it through detune.
      const stages = filterStages(next.filterMode, next.filterSlope, next.resonance);
      const cutoff = effectiveCutoff(next);
      [filter, filter2].forEach((node, i) => setStage(node, stages[i], cutoff, t));
      envelopeAmount.gain.setValueAtTime(next.filterEnvAmount * 1200, t);
      velocityAmount.gain.setValueAtTime(next.velocityCutoff * VELOCITY_CUTOFF_OCTAVES * 1200, t);
      keyTrackAmount.gain.setValueAtTime(next.keyTrack * 100, t); // cents per semitone
    },

    /** A Tap listens to this Voice's stage: a side branch, so observing never alters the sound. */
    attach(taps: Taps, tap: TapName) {
      ({ oscillator: mixer, filter: filter2, amp: tremoloGain } as const)[tap].connect(taps[tap]);
    },
    detach(taps: Taps, tap: TapName) {
      ({ oscillator: mixer, filter: filter2, amp: tremoloGain } as const)[tap].disconnect(taps[tap]);
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
    const bus = ctx.createGain();
    osc.connect(bus);
    const [toCutoff, toPitch, toOsc2, q1, q2, toVolume] = Array.from({ length: 6 }, () => {
      const g = ctx.createGain();
      g.gain.value = 0;
      bus.connect(g);
      return g;
    });
    return { osc, bus, previous: null, restartAt: -1, toCutoff, toPitch, toOsc2, toQ: [q1, q2], toVolume };
  };
  const bend = ctx.createConstantSource();
  bend.offset.value = 0;
  bend.start();
  const tremoloRest = ctx.createConstantSource();
  tremoloRest.offset.value = 1;
  tremoloRest.start();
  const shared: Shared = { lfos: [lfoNodes(), lfoNodes()], bend, tremoloRest, noise: noiseBuffer(ctx), master };
  const voices = Array.from({ length: MAX_VOICES }, (_, i) => createVoice(ctx, shared, i));
  const waves = new Map<keyof typeof LFO_SERIES, PeriodicWave>();
  const wave = (w: keyof typeof LFO_SERIES) => waves.get(w) ?? waves.set(w, lfoWave(ctx, w)).get(w)!;
  const lfoStart = ctx.currentTime;
  for (const l of shared.lfos) l.osc.start(lfoStart);
  // The model's copy of each LFO's phase, advanced with every Rate change exactly as its oscillator is (ADR-0003).
  const lfoClocks = [createLfoClock(lfoStart, PARAMS.lfoRate.default), createLfoClock(lfoStart, PARAMS.lfo2Rate.default)];
  /**
   * A retriggering LFO starts its cycle again at `t`: a new oscillator takes over from the running one there (an
   * oscillator cannot be reset), and the model's clock restarts with it. A chord's Notes restart it once.
   */
  const restartLfo = (i: number, l: Lfo, t: number) => {
    const nodes = shared.lfos[i];
    if (nodes.restartAt === t) return;
    const next = ctx.createOscillator();
    setLfoWaveform(next, l.waveform, wave);
    next.frequency.value = l.rate;
    next.connect(nodes.bus);
    next.start(t);
    const old = nodes.osc;
    old.stop(t);
    old.onended = () => {
      old.disconnect();
      if (nodes.previous === old) nodes.previous = null;
    };
    nodes.previous = old;
    nodes.osc = next;
    nodes.restartAt = t;
    lfoClocks[i].restart(t);
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
  };
  const levelAt = (events: readonly GateRecord[], t: number) => {
    const i = lastAt(events, t);
    return i < 0 ? 0 : levelAfter(events[i], events[i].start, t);
  };
  /** A Gate change on a Voice; recorded in the model's history when it is the newest Note's. */
  const gate = (voice: Voice, on: boolean, t: number, velocity: number) => {
    if (!patch) return;
    const ampEvent: GateEvent = { time: t, on, adsr: ampAdsr(patch), peak: velocity };
    const filterEvent: GateEvent = { time: t, on, adsr: filterAdsr(patch), peak: 1 };
    if (voice === lead) {
      record(ampEvents, ampEvent);
      record(filterEvents, filterEvent);
    }
    voice.gate(ampEvent, filterEvent, velocity);
    if (on) {
      voice.startedAt = t;
      voice.releasedAt = null;
      voice.freeAt = Infinity;
    } else {
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
    // During a Glide, the frequency the Oscillators have reached: Cycle Lock follows the slide.
    // With the Sub sounding, the sound repeats at the Sub's pitch, an octave lower: that is the fundamental.
    fundamental: () => {
      const frequency = (glidingAt(ctx.currentTime) || A4) * 2 ** (bendAt(ctx.currentTime) / 1200);
      return patchAt(ctx.currentTime)?.mixSub ? frequency / 2 : frequency;
    },
    modulationAt,
    lfoSwingAt: (time, n = 1) => {
      const then = patchAt(time);
      if (!then) return 0;
      const l = lfos(then)[n - 1];
      return l.amount * lfoShape(l.waveform, lfoClocks[n - 1].phaseAt(time));
    },
    baseCutoffAt: (time) => {
      const then = patchAt(time);
      return then ? effectiveCutoff(then) : 0;
    },
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
      const { cutoff, resonance } = modulationAt();
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
      const each = (destination: LfoDestination, perDepth: number) => lfoSwings(next, destination, perDepth);
      const cutoffCents = each('cutoff', LFO_CUTOFF_OCTAVES * 1200);
      const pitchCents = each('pitch', LFO_PITCH_CENTS);
      const osc2 = each('osc2Pitch', LFO_OSC2_CENTS).map((c, i) => c + each('detune', LFO_DETUNE_CENTS)[i]);
      // Resonance: each stage's Q moves from where the swing's low end puts it to where its high end does.
      const resonances = lfoSwings(next, 'resonance', LFO_RESONANCE, Math.min(next.resonance, 1 - next.resonance));
      // Volume: the knob's level (issue 62), the tremolo resting its total swing below it, so the wave's top is the
      // knob's own level; each LFO's swing scaled with it.
      const volumeSwings = lfoSwings(next, 'volume', LFO_VOLUME, LFO_VOLUME).map((s) => s * next.volume);
      tremoloRest.offset.setValueAtTime(next.volume - volumeSwings[0] - volumeSwings[1], t);
      lfos(next).forEach((l, i) => {
        const nodes = shared.lfos[i];
        // A restart scheduled ahead of now leaves the old oscillator running until then: it follows too.
        for (const osc of nodes.previous ? [nodes.osc, nodes.previous] : [nodes.osc]) {
          setLfoWaveform(osc, l.waveform, wave);
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
      const t = at(time);
      if (patch) lfos(patch).forEach((l, i) => l.retrigger === 'note' && restartLfo(i, l, t));
      const voice = allocate(note, t);
      voice.note = note;
      follow(voice);
      setLeadPitch(voice, note, t);
      gate(voice, true, t, velocity);
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
      // The newest Note first, so the model records its Gate off; the others just release.
      for (const v of [...voices].sort((a, b) => (a === lead ? -1 : b === lead ? 1 : 0))) {
        if (v.note !== null && v.releasedAt === null) gate(v, false, t, 0);
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
