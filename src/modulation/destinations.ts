import type { Modulation } from '../engine/synthEngine';
import { type LfoDestination, lfos, PARAMS, type ParamId, type Patch } from '../patch/patch';
import { valueToPosition } from '../patch/taper';
import { LFO_DETUNE_CENTS, LFO_OSC2_CENTS, LFO_PITCH_CENTS, LFO_PULSE_WIDTH, lfoOffset, MAX_PULSE, MIN_PULSE } from './modulationModel';

/**
 * Each LFO Destination: its name, its stage (whose colour it takes, in the menu and on the Timeline) and the knob it
 * moves (Pitch has none: it moves the Note).
 */
export const DESTINATIONS: Record<LfoDestination, { label: string; stage: 'osc' | 'filter' | 'amp'; param: ParamId | null }> = {
  pitch: { label: 'Pitch', stage: 'osc', param: null },
  osc2Pitch: { label: 'Osc 2 Pitch', stage: 'osc', param: 'osc2Semitone' },
  detune: { label: 'Detune', stage: 'osc', param: 'osc2Detune' },
  pulseWidth: { label: 'Pulse Width', stage: 'osc', param: 'pulseWidth' },
  cutoff: { label: 'Cutoff', stage: 'filter', param: 'cutoff' },
  resonance: { label: 'Resonance', stage: 'filter', param: 'resonance' },
  volume: { label: 'Volume', stage: 'amp', param: 'volume' },
};

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
 * Envelope and the LFOs move it (both LFOs added together when both aim at it), as the sound does. A knob nothing
 * moves is its own value.
 */
export function effectiveValue(param: ParamId, patch: Patch, m: Modulation): number {
  if (param === 'cutoff') return m.cutoff;
  if (param === 'resonance') return m.resonance;
  if (param === 'volume') return m.volume;
  if (param === 'osc2Semitone') return patch.osc2Semitone + lfoOffset(patch, 'osc2Pitch', LFO_OSC2_CENTS / 100, m.lfo);
  if (param === 'osc2Detune') return patch.osc2Detune + lfoOffset(patch, 'detune', LFO_DETUNE_CENTS, m.lfo);
  if (param === 'pulseWidth' || param === 'osc2PulseWidth') {
    const room = Math.min(patch[param] - MIN_PULSE, MAX_PULSE - patch[param]);
    return patch[param] + lfoOffset(patch, 'pulseWidth', LFO_PULSE_WIDTH, m.lfo, room);
  }
  return patch[param];
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
  return Math.min(1, Math.max(0, 0.5 + m.vibrato / (2 * (LFO_PITCH_CENTS / 100))));
}
