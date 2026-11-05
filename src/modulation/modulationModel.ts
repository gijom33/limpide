import { type FilterMode, type LfoDestination, lfos, PARAMS, type ParamId, type Patch } from '../patch/patch';

/** The Note sounding, whose Velocity and key are fixed for as long as it sounds. */
export interface Sounding {
  note: number;
  velocity: number;
}

/**
 * What the Modulation model says at a moment: both Envelope levels, the Effective Cutoff and the Filter's shape. The
 * engine computes it and the Viewers and rings read it, so it lives with the model rather than in the engine.
 */
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
  /** When the newest Note started (its Gate opened), in the engine's seconds; null before any (issue 115). */
  struck: number | null;
  /**
   * The pitch the newest Note sounds at, in semitones (fractional through a Glide, vibrato, the bend or aftertouch); A4
   * before any.
   */
  pitch: number;
  /** How far an LFO on Pitch moves it right now, in semitones: `pitch` less the Note where the Glide has taken it. */
  vibrato: number;
  /** A keyboard's aftertouch at this moment, where its glide has reached (issue 219), and the Destination it moves (issue 132). */
  pressure: Pressure;
}

/**
 * A keyboard's aftertouch (issue 132), the channel's or the hardest-pressed Note's: how hard the keys are pressed, 0
 * to 1, and the one Destination it moves, chosen in the MIDI panel.
 */
export interface Pressure {
  destination: LfoDestination;
  amount: number;
}
/** No pressure, on the Destination it moves by default. */
export const NO_PRESSURE: Pressure = { destination: 'cutoff', amount: 0 };

/** The narrowest and widest pulse the Oscillators make, however far the LFO swings them. */
const MIN_PULSE = 0.05;
const MAX_PULSE = 0.95;

/** What an LFO does to one Destination: see `LFO_LAWS`. */
export interface LfoLaw {
  perDepth: number;
  room?(value: number): number;
  /** The knob's value in `patch` its room is measured from, as the engine measures it (issue 196: beside the room). */
  roomFrom?(patch: Patch): number;
  /** Its unit, its knob's: Pitch's semitones, the Cutoff's octaves, a share of a knob's travel in %; Volume's dip in dB. */
  unit: string;
  knobs: readonly ParamId[];
}

/**
 * What an LFO does to each Destination (issue 74), read by the model, the engine, the rings and the Timeline alike:
 * `perDepth`, how far one LFO at full Depth swings it each way, in its knobs' unit; `room`, how far it may go each way
 * from a knob's value before an end (both LFOs together kept within it); `knobs`, those whose ring shows it.
 */
export const LFO_LAWS = {
  /** A semitone each way; Pitch has no knob. */
  pitch: { perDepth: 1, unit: 'st', knobs: [] },
  /** An octave each way, on the Semitone knob. */
  osc2Pitch: { perDepth: 12, unit: 'st', knobs: ['osc2Semitone'] },
  /** 50 cents each way, the Detune knob's range. */
  detune: { perDepth: 50, unit: '¢', knobs: ['osc2Detune'] },
  /** 40 points each way, on both Oscillators' Pulse Width, never past the narrowest or widest pulse. */
  // Its room measured on Osc 1's width, or Osc 2's while it alone is a pulse; each Oscillator's swing is kept within
  // its own width's room in the engine.
  pulseWidth: {
    perDepth: 0.4,
    room: (width: number) => Math.min(width - MIN_PULSE, MAX_PULSE - width),
    roomFrom: (patch: Patch) => (patch.waveform !== 'pulse' && patch.osc2Waveform === 'pulse' ? patch.osc2PulseWidth : patch.pulseWidth),
    unit: '%',
    knobs: ['pulseWidth', 'osc2PulseWidth'],
  },
  /** Its whole range (0–1), as far as the FM knob leaves room each way: none at 0 (issue 97). */
  fm: { perDepth: 1, room: (fm: number) => Math.min(fm, 1 - fm), roomFrom: (patch: Patch) => patch.crossMod, unit: '%', knobs: ['crossMod'] },
  /** Two octaves each way. */
  cutoff: { perDepth: 2, unit: 'oct', knobs: ['cutoff'] },
  /** Its whole range (0–1), as far as the knob's value leaves room each way. */
  resonance: { perDepth: 1, room: (resonance: number) => Math.min(resonance, 1 - resonance), roomFrom: (patch: Patch) => patch.resonance, unit: '%', knobs: ['resonance'] },
  /**
   * Volume (tremolo) dips at most to silence: each LFO's swing is half its Depth, around a level that falls by the
   * total swing, so the wave's top is the Envelope's own level and its foot full Depth below it (issue 53).
   */
  volume: { perDepth: 0.5, room: () => 0.5, unit: 'dB', knobs: ['volume'] },
} as const satisfies Record<LfoDestination, LfoLaw>;
/** How far the hardest hit opens the Filter at full Velocity amount. */
export const VELOCITY_CUTOFF_OCTAVES = 2;

/** Key Track is measured from C4: there the Cutoff is the knob's own value. */
export const KEY_TRACK_CENTRE = 60;

/** The Effective Cutoff's range: the model holds it here, and so does the engine's Filter (issue 166). */
export const LOWEST_CUTOFF = 20;
export const HIGHEST_CUTOFF = 20000;

/**
 * The Cutoff after all modulation, computed here rather than read from the audio graph (ADR-0003).
 * The Filter Envelope moves it by Envelope Amount octaves at full level, each LFO aimed at the Cutoff by
 * up to ±2 octaves (`lfo`: each LFO's value, −1 to 1), the Note's Velocity by up to 2 octaves (at full Velocity amount), and Key Track by an
 * octave per octave of the Note from C4 at 100 %. `note` is fractional during a Glide.
 */
export function effectiveCutoff(patch: Patch, filterEnvelope = 0, lfo: readonly number[] = [], velocity = 0, note = KEY_TRACK_CENTRE): number {
  const lfoOctaves = lfoOffset(patch, 'cutoff', lfo);
  const velocityOctaves = VELOCITY_CUTOFF_OCTAVES * patch.velocityCutoff * velocity;
  const keyOctaves = (patch.keyTrack * (note - KEY_TRACK_CENTRE)) / 12;
  const hz = patch.cutoff * 2 ** (patch.filterEnvAmount * filterEnvelope + lfoOctaves + velocityOctaves + keyOctaves);
  return Math.min(HIGHEST_CUTOFF, Math.max(LOWEST_CUTOFF, hz));
}

/**
 * The pitch sounding, in semitones (MIDI numbering, fractional): the Note as far as the Glide has taken it, moved
 * by up to a semitone each way by the LFO aimed at Pitch.
 */
export function soundingPitch(patch: Patch, gliding: number, lfo: readonly number[] = []): number {
  return gliding + lfoOffset(patch, 'pitch', lfo);
}

/**
 * How far each LFO swings a destination at the top of its wave, in the destination's units: `perDepth` at full Depth,
 * both kept together within `room` each way (a Pulse Width or the Resonance cannot pass its ends), shared by Depth.
 */
function lfoSwings(patch: Patch, destination: LfoDestination, perDepth: number, room = Infinity): [number, number] {
  const wanted = lfos(patch).map((l) => (l.destination === destination ? perDepth * l.amount : 0)) as [number, number];
  const total = wanted[0] + wanted[1];
  const scale = total > room ? Math.max(0, room) / total : 1;
  return [wanted[0] * scale, wanted[1] * scale];
}

/** Each LFO's swing on a Destination by its law, in its knobs' unit, from a knob's `value` (where its room is measured). */
export function destinationSwings(patch: Patch, destination: LfoDestination, value = 0): [number, number] {
  const law: LfoLaw = LFO_LAWS[destination];
  return lfoSwings(patch, destination, law.perDepth, law.room?.(value));
}

/**
 * Where both LFOs take a Destination right now, in its knobs' unit, from a knob's `value`: each one's swing times its
 * value (`lfo`, −1 to 1 each).
 */
export function lfoOffset(patch: Patch, destination: LfoDestination, lfo: readonly number[], value = 0) {
  const [one, two] = destinationSwings(patch, destination, value);
  return one * (lfo[0] ?? 0) + two * (lfo[1] ?? 0);
}

/** The Resonance after the LFOs: they swing it around the knob's value, never past 0 or 1. */
export function effectiveResonance(patch: Patch, lfo: readonly number[] = []): number {
  return patch.resonance + lfoOffset(patch, 'resonance', lfo, patch.resonance);
}

/**
 * The tremolo: what the LFOs aimed at Volume multiply the Amp by right now, 0 to 1. Never above 1, so the Amp
 * Envelope sets the loudest the Note gets and the LFOs pull it down from there.
 */
export function tremolo(patch: Patch, lfo: readonly number[] = []): number {
  // Each LFO's value less one: at its top (+1) the gain is 1, at its foot (−1) twice its swing below.
  return 1 + lfoOffset(patch, 'volume', [(lfo[0] ?? 0) - 1, (lfo[1] ?? 0) - 1]);
}

/** What the Amp's Envelope is multiplied by: the Volume knob, and the tremolo dipping from it (issue 62). */
export function effectiveVolume(patch: Patch, lfo: readonly number[] = []): number {
  return patch.volume * tremolo(patch, lfo);
}

/**
 * How far the Filter Envelope moves Osc 2 off its knobs, in cents, at the Envelope's level `filterEnvelope` (0 to 1): its
 * Env Amount's semitones times the level (issue 93). The term's one home: osc2Cents adds it, the Ideal rests Osc 2 on
 * it at the Sustain (issue 98), and the engine's gain on the Envelope is it at full.
 */
export const osc2EnvelopeCents = (patch: Patch, filterEnvelope: number) => patch.osc2EnvAmount * filterEnvelope * 100;

/**
 * Osc 2's tuning against the Note played, in cents: Octave, Semitone and Detune, then the LFOs on Osc 2 Pitch and on
 * Detune, and the Filter Envelope's (osc2EnvelopeCents).
 */
export function osc2Cents(patch: Patch, lfo: readonly number[] = [], filterEnvelope = 0): number {
  const knobs = patch.osc2Octave * 1200 + patch.osc2Semitone * 100 + patch.osc2Detune;
  return knobs + lfoOffset(patch, 'osc2Pitch', lfo) * 100 + lfoOffset(patch, 'detune', lfo) + osc2EnvelopeCents(patch, filterEnvelope);
}

/**
 * The Patch as aftertouch moves its Destination (issue 132): up from the knob's value by its law's `perDepth` times the
 * pressure, as far as one LFO at full Depth swings it, so nothing at no pressure and the whole reach at full. The
 * Cutoff opens by up to two octaves, within what the Filter reaches; a knob whose law has a room is kept within the
 * knob's top (Volume, louder up to full); Osc 2 Pitch and Detune go as far as an LFO takes them. The Resonance goes
 * half the way from the knob to its top (issue 219, decision 4), so a resonant Patch pressed hard (Wobble) does not
 * ring past the limiter's knee: from no Resonance, half its range. The LFOs then swing around the pressed value, so
 * the pressure adds to the knob's value and to theirs. Pitch has no knob: `pressurePitch`.
 */
export function pressed(patch: Patch, { destination, amount }: Pressure): Patch {
  if (!amount) return patch;
  const law: LfoLaw = LFO_LAWS[destination];
  const next = { ...patch };
  if (destination === 'cutoff') next.cutoff = Math.min(HIGHEST_CUTOFF, patch.cutoff * 2 ** (law.perDepth * amount));
  else if (destination === 'resonance') next.resonance = patch.resonance + (PARAMS.resonance.max - patch.resonance) * RESONANCE_REACH * amount;
  else for (const knob of law.knobs) next[knob] = Math.min(law.room ? PARAMS[knob].max : Infinity, patch[knob] + law.perDepth * amount);
  return next;
}

/** How far full pressure takes the Resonance: this share of the way from the knob to its top (issue 219, decision 4). */
const RESONANCE_REACH = 0.5;

/**
 * Aftertouch's glide (issue 219, decision 5): its Destination moves to each new pressure over this time constant, in
 * seconds, the sound and the model alike. Longer than the bend wheel's 4 ms, so a keyboard's 127 steps blur into one
 * sweep; a stab of pressure still arrives in about 50 ms.
 */
export const PRESSURE_GLIDE = 0.016;
/** After this long a glide counts as arrived: within 5 parts in 100,000 of its step (10 time constants). */
const GLIDE_ARRIVED = 10 * PRESSURE_GLIDE;

/** Where aftertouch's glide has reached `elapsed` seconds after `to` came, from an amount of `from` then. */
export function glidedPressure(from: number, to: Pressure, elapsed: number): Pressure {
  if (elapsed >= GLIDE_ARRIVED) return to;
  return { destination: to.destination, amount: to.amount + (from - to.amount) * Math.exp(-elapsed / PRESSURE_GLIDE) };
}

/** How far aftertouch on Pitch raises it, in semitones: a semitone at full pressure; none on any other Destination. */
export const pressurePitch = ({ destination, amount }: Pressure) => (destination === 'pitch' ? LFO_LAWS.pitch.perDepth * amount : 0);
