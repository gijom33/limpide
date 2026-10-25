import type { Patch } from '../patch/patch';
import { KEY_TRACK_CENTRE, LFO_CUTOFF_OCTAVES, LFO_PULSE_WIDTH, MAX_PULSE, MIN_PULSE, VELOCITY_CUTOFF_OCTAVES } from './modulationModel';

/** What moves a Parameter away from its knob's own value. */
export type Source = 'filterEnvelope' | 'lfo' | 'velocity' | 'keyTrack';

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
 * Envelope Amount octaves away; the LFO aimed at the Cutoff swings it up to two octaves each way. Velocity and Key
 * Track are fixed for a Note: while one sounds they move the whole range; with none, Velocity reaches as far as the
 * hardest strike would open it, and Key Track stays at C4, where it is the knob's own value.
 */
export function cutoffReach(patch: Patch, sounding: Sounding | null): Reach | null {
  const octaves: Partial<Record<Source, [number, number]>> = {};
  if (patch.filterEnvAmount) octaves.filterEnvelope = [Math.min(0, patch.filterEnvAmount), Math.max(0, patch.filterEnvAmount)];
  if (patch.lfoDestination === 'cutoff' && patch.lfoAmount) {
    const swing = LFO_CUTOFF_OCTAVES * patch.lfoAmount;
    octaves.lfo = [-swing, swing];
  }
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

/** A Pulse Width's reach: the LFO aimed at Pulse Width swings it 40 points each way at full Depth, as the sound does. */
export function pulseWidthReach(patch: Patch, pulseWidth: number): Reach | null {
  if (patch.lfoDestination !== 'pulseWidth' || !patch.lfoAmount) return null;
  const swing = Math.min(LFO_PULSE_WIDTH * patch.lfoAmount, pulseWidth - MIN_PULSE, MAX_PULSE - pulseWidth);
  if (swing <= 0) return null;
  const range: [number, number] = [pulseWidth - swing, pulseWidth + swing];
  return { lo: range[0], hi: range[1], shares: { lfo: range } };
}
