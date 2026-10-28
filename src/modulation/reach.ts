import type { LfoDestination, Patch } from '../patch/patch';
import {
  KEY_TRACK_CENTRE, LFO_CUTOFF_OCTAVES, LFO_DETUNE_CENTS, LFO_OSC2_CENTS, LFO_PULSE_WIDTH, LFO_RESONANCE, LFO_VOLUME, lfoSwings, MAX_PULSE, MIN_PULSE,
  VELOCITY_CUTOFF_OCTAVES,
} from './modulationModel';

/** What moves a Parameter away from its knob's own value. */
export type Source = 'filterEnvelope' | 'lfo1' | 'lfo2' | 'velocity' | 'keyTrack';
const LFO_SOURCES = ['lfo1', 'lfo2'] as const;

/**
 * How far modulation can take a Parameter with the Patch as it is (the modulation ring): the lowest and highest
 * values, and each source's own share, as the range it would give alone, from the knob's own value.
 */
export interface Reach {
  lo: number;
  hi: number;
  shares: Partial<Record<Source, [number, number]>>;
}

/** The Note sounding, whose Velocity and key are fixed for as long as it sounds. */
export interface Sounding {
  note: number;
  velocity: number;
}

const MIN_HZ = 20;
const MAX_HZ = 20000;
/** Less spread than this is no ring. */
const NO_SPREAD = 1.001;

/**
 * The Effective Cutoff's reach (ADR-0003's model, at its extremes). The Filter Envelope sweeps from the Cutoff to
 * Envelope Amount octaves away; each LFO aimed at the Cutoff swings it up to two octaves each way. Velocity and Key
 * Track are fixed for a Note: while one sounds they move the whole range; with none, Velocity reaches as far as the
 * hardest strike would open it, and Key Track stays at C4, where it is the knob's own value.
 */
export function cutoffReach(patch: Patch, sounding: Sounding | null): Reach | null {
  const octaves: Partial<Record<Source, [number, number]>> = {};
  if (patch.filterEnvAmount) octaves.filterEnvelope = [Math.min(0, patch.filterEnvAmount), Math.max(0, patch.filterEnvAmount)];
  lfoSwings(patch, 'cutoff', LFO_CUTOFF_OCTAVES).forEach((swing, i) => {
    if (swing) octaves[LFO_SOURCES[i]] = [-swing, swing];
  });
  if (patch.velocityCutoff) {
    const full = VELOCITY_CUTOFF_OCTAVES * patch.velocityCutoff;
    octaves.velocity = sounding ? [0, full * sounding.velocity] : [0, full];
  }
  if (patch.keyTrack && sounding && sounding.note !== KEY_TRACK_CENTRE) {
    const shift = (patch.keyTrack * (sounding.note - KEY_TRACK_CENTRE)) / 12;
    octaves.keyTrack = [Math.min(0, shift), Math.max(0, shift)];
  }
  // Velocity and Key Track at the Note sounding are one value each: they shift the range rather than widen it.
  const fixed = (source: Source) => sounding && (source === 'velocity' || source === 'keyTrack');
  let lo = 0;
  let hi = 0;
  for (const [source, [a, b]] of Object.entries(octaves) as [Source, [number, number]][]) {
    const shift = fixed(source) ? (a || b) : 0;
    lo += fixed(source) ? shift : a;
    hi += fixed(source) ? shift : b;
  }
  const hz = (o: number) => Math.min(MAX_HZ, Math.max(MIN_HZ, patch.cutoff * 2 ** o));
  if (hz(hi) / hz(lo) < NO_SPREAD) return null;
  const shares = Object.fromEntries(Object.entries(octaves).map(([source, [a, b]]) => [source, [hz(a), hz(b)]]));
  return { lo: hz(lo), hi: hz(hi), shares };
}

/**
 * How far Key Track can take the Cutoff, in octaves, over Notes from `low` to `high`: down for those below C4, up for
 * those above, nothing where it is off (the Cutoff knob's grey Key Track rings, the owner, 2026-10-28).
 */
export function keyTrackOctaves(patch: Patch, low: number, high: number): [number, number] {
  const [a, b] = [low, high].map((note) => (patch.keyTrack * (note - KEY_TRACK_CENTRE)) / 12);
  return [Math.min(0, a, b) || 0, Math.max(0, a, b) || 0]; // || 0: no −0 from Key Track off below C4
}

/** The LFOs' reach alone on the Cutoff (both together when both aim at it): the knob's blue ring (issue 63). */
export const lfoCutoffReach = (patch: Patch) => cutoffReach({ ...patch, filterEnvAmount: 0, velocityCutoff: 0, keyTrack: 0 }, null);

/**
 * The LFOs' reach on a Parameter they swing evenly around its knob's value: `perDepth` each way at full Depth, both
 * together kept within `room` (as the sound is), each LFO's share its own swing.
 */
function lfoReach(patch: Patch, destination: LfoDestination, value: number, perDepth: number, room = Infinity): Reach | null {
  const swings = lfoSwings(patch, destination, perDepth, room);
  const total = swings[0] + swings[1];
  if (total <= 0) return null;
  const shares: Reach['shares'] = {};
  swings.forEach((swing, i) => {
    if (swing) shares[LFO_SOURCES[i]] = [value - swing, value + swing];
  });
  return { lo: value - total, hi: value + total, shares };
}

/** A Pulse Width's reach: each LFO aimed at Pulse Width swings it 40 points each way at full Depth, as the sound does. */
export const pulseWidthReach = (patch: Patch, pulseWidth: number) =>
  lfoReach(patch, 'pulseWidth', pulseWidth, LFO_PULSE_WIDTH, Math.min(pulseWidth - MIN_PULSE, MAX_PULSE - pulseWidth));

/** The Resonance's reach: across its whole range at full Depth, as far as the knob's value leaves room each way. */
export const resonanceReach = (patch: Patch) =>
  lfoReach(patch, 'resonance', patch.resonance, LFO_RESONANCE, Math.min(patch.resonance, 1 - patch.resonance));

/** Osc 2 Pitch's reach, on the Semitone knob: an octave (twelve semitones) each way at full Depth. */
export const semitoneReach = (patch: Patch) => lfoReach(patch, 'osc2Pitch', patch.osc2Semitone, LFO_OSC2_CENTS / 100);

/** The Detune's reach: 50 cents each way at full Depth. */
export const detuneReach = (patch: Patch) => lfoReach(patch, 'detune', patch.osc2Detune, LFO_DETUNE_CENTS);

/**
 * The Volume's reach (issue 62): the LFOs on Volume dip it from the knob's value, by twice their swing at the wave's
 * foot (to silence at full Depth), never above it.
 */
export function volumeReach(patch: Patch): Reach | null {
  const swings = lfoSwings(patch, 'volume', LFO_VOLUME, LFO_VOLUME);
  const total = swings[0] + swings[1];
  if (total <= 0) return null;
  const shares: Reach['shares'] = {};
  swings.forEach((swing, i) => {
    if (swing) shares[LFO_SOURCES[i]] = [patch.volume * (1 - 2 * swing), patch.volume];
  });
  return { lo: patch.volume * (1 - 2 * total), hi: patch.volume, shares };
}
