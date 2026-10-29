import { LFO_DESTINATIONS, type LfoDestination, lfos, PARAMS, type ParamId, type Patch } from '../patch/patch';
import { valueToPosition } from '../patch/taper';
import { LFO_LAWS, lfoOffset, type Modulation } from './modulationModel';

type Destination = (typeof LFO_DESTINATIONS)[number] & (typeof LFO_LAWS)[LfoDestination];

/**
 * Each LFO Destination by its id: from `LFO_DESTINATIONS` its name, its stage and the knob the Timeline draws it on;
 * from its law how far it swings, its room and the knobs whose ring shows it.
 */
export const DESTINATIONS = Object.fromEntries(LFO_DESTINATIONS.map((d) => [d.id, { ...d, ...LFO_LAWS[d.id] }])) as Record<LfoDestination, Destination>;

/** The Destination an LFO moves a knob by, if any. */
const DESTINATION_OF = new Map<ParamId, LfoDestination>(
  LFO_DESTINATIONS.flatMap((d) => LFO_LAWS[d.id].knobs.map((knob): [ParamId, LfoDestination] => [knob, d.id])),
);
export const destinationOf = (knob: ParamId): LfoDestination | undefined => DESTINATION_OF.get(knob);

/** The Parameters modulation can move, and so the knobs that carry a ring: every knob a law names. */
export const MODULATED: ReadonlySet<ParamId> = new Set(DESTINATION_OF.keys());

/** The Destinations an active LFO (Depth above zero) moves, LFO 1's first, each once (both LFOs on one: one). */
export const lfoDestinations = (patch: Patch): LfoDestination[] => [
  ...new Set(
    lfos(patch)
      .filter((l) => l.amount > 0)
      .map((l) => l.destination),
  ),
];

/**
 * A modulated Parameter's Effective value at a moment, from the Modulation model: the knob's value as the Filter
 * Envelope and the LFOs move it (both LFOs added together when both aim at it), as the sound does. The Cutoff and the
 * Volume are the model's own; an LFO swings the others evenly around the knob, by their law. A knob nothing moves is
 * its own value.
 */
export function effectiveValue(param: ParamId, patch: Patch, m: Modulation): number {
  if (param === 'cutoff') return m.cutoff;
  if (param === 'volume') return m.volume;
  const destination = destinationOf(param);
  return destination ? patch[param] + lfoOffset(patch, destination, m.lfo, patch[param]) : patch[param];
}

/** A value's place on its knob, 0–1 along the knob's own scale (its taper), kept within it. */
const onKnob = (param: ParamId, value: number) => {
  const def = PARAMS[param];
  return valueToPosition(def, Math.min(def.max, Math.max(def.min, value)));
};

/** A Destination's knob setting, 0–1 on its scale: where the LFOs swing it from. Pitch, which has none, the middle. */
export const knobLevel = (destination: LfoDestination, patch: Patch): number => {
  const { param } = DESTINATIONS[destination];
  return param ? onKnob(param, patch[param]) : 0.5;
};

/**
 * Where a Destination is at a moment, 0–1 on its knob's scale: its Effective value. Pitch is the Note's own pitch in
 * the middle and one LFO's full swing (a semitone each way) at the edges, both LFOs together kept within them.
 */
export function destinationLevel(destination: LfoDestination, patch: Patch, m: Modulation): number {
  const { param } = DESTINATIONS[destination];
  if (param) return onKnob(param, effectiveValue(param, patch, m));
  return Math.min(1, Math.max(0, 0.5 + m.vibrato / (2 * LFO_LAWS.pitch.perDepth)));
}
