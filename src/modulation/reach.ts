import type { ParamId, Patch } from '../patch/patch';
import { destinationOf } from './destinations';
import { destinationSwings, KEY_TRACK_CENTRE, VELOCITY_CUTOFF_OCTAVES } from './modulationModel';

/** How far modulation can take a Parameter with the Patch as it is (a modulation ring): its lowest and highest values. */
export interface Reach {
  lo: number;
  hi: number;
}

const MIN_HZ = 20;
const MAX_HZ = 20000;
/** Less spread than this is no ring. */
const NO_SPREAD = 1.001;

/** A Cutoff `octaves` from the knob's, within what the Filter can reach. */
const cutoffAt = (patch: Patch, octaves: number) => Math.min(MAX_HZ, Math.max(MIN_HZ, patch.cutoff * 2 ** octaves));

/** The reach of ranges in octaves from the Cutoff knob, added up; none when it spreads no further than the knob. */
function cutoffSpread(patch: Patch, ranges: [number, number][]): Reach | null {
  const lo = cutoffAt(patch, ranges.reduce((sum, [a]) => sum + a, 0));
  const hi = cutoffAt(patch, ranges.reduce((sum, [, b]) => sum + b, 0));
  return hi / lo < NO_SPREAD ? null : { lo, hi };
}

/**
 * The Effective Cutoff's reach from the Filter Envelope and Velocity (the Cutoff knob's white and grey rings,
 * ADR-0003's model at its extremes), with `envelope`, the Filter Envelope's sweep alone: from the Cutoff to Envelope
 * Amount octaves away. Velocity reaches as far as the hardest strike would open it.
 */
export function cutoffReach(patch: Patch): (Reach & { envelope?: [number, number] }) | null {
  const envelope: [number, number] = [Math.min(0, patch.filterEnvAmount), Math.max(0, patch.filterEnvAmount)];
  const reach = cutoffSpread(patch, [envelope, [0, VELOCITY_CUTOFF_OCTAVES * patch.velocityCutoff]]);
  if (!reach) return null;
  return patch.filterEnvAmount ? { ...reach, envelope: [cutoffAt(patch, envelope[0]), cutoffAt(patch, envelope[1])] } : reach;
}

/**
 * The LFOs' reach on the Cutoff (both together when both aim at it), up to two octaves each way each at full Depth:
 * the knob's blue ring (issue 63).
 */
export function lfoCutoffReach(patch: Patch): Reach | null {
  const total = destinationSwings(patch, 'cutoff').reduce((sum, swing) => sum + swing, 0);
  return cutoffSpread(patch, [[-total, total]]);
}

/**
 * How far Key Track can take the Cutoff, in octaves, over Notes from `low` to `high`: down for those below C4, up for
 * those above, nothing where it is off (the Cutoff knob's grey Key Track rings, the owner, 2026-10-28).
 */
export function keyTrackOctaves(patch: Patch, low: number, high: number): [number, number] {
  const [a, b] = [low, high].map((note) => (patch.keyTrack * (note - KEY_TRACK_CENTRE)) / 12);
  return [Math.min(0, a, b) || 0, Math.max(0, a, b) || 0]; // || 0: no −0 from Key Track off below C4
}

/**
 * The LFOs' reach on a knob they swing evenly around its value (Osc 2 Pitch's Semitone, Detune, Pulse Width, Resonance):
 * its law's amount each way at full Depth, both together kept within its room (as the sound is). None for a knob no
 * active LFO aims at.
 */
export function evenReach(patch: Patch, knob: ParamId): Reach | null {
  const destination = destinationOf(knob);
  if (!destination) return null;
  const value = patch[knob] as number;
  const [a, b] = destinationSwings(patch, destination, value);
  return a + b > 0 ? { lo: value - a - b, hi: value + a + b } : null;
}

/**
 * The Volume's reach (issue 62): the LFOs on Volume dip it from the knob's value, by twice their swing at the wave's
 * foot (to silence at full Depth), never above it.
 */
export function volumeReach(patch: Patch): Reach | null {
  const [a, b] = destinationSwings(patch, 'volume');
  return a + b > 0 ? { lo: patch.volume * (1 - 2 * (a + b)), hi: patch.volume } : null;
}
