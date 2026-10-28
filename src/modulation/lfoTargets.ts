import type { Modulation } from '../engine/synthEngine';
import { type LfoDestination, lfos, PARAMS, type ParamId, type Patch } from '../patch/patch';
import { valueToPosition } from '../patch/taper';
import { LFO_DETUNE_CENTS, LFO_OSC2_CENTS, LFO_PITCH_CENTS, LFO_PULSE_WIDTH, lfoOffset, MAX_PULSE, MIN_PULSE } from './modulationModel';

/**
 * What an LFO aimed at a Destination moves: its name, the knob it moves (Pitch has none: it moves the Note), and the
 * stage it belongs to, whose colour its line on the Timeline takes.
 */
export const TARGETS: Record<LfoDestination, { name: string; param: ParamId | null; stage: 'osc' | 'filter' | 'amp' }> = {
  pitch: { name: 'Pitch', param: null, stage: 'osc' },
  osc2Pitch: { name: 'Osc 2 Pitch', param: 'osc2Semitone', stage: 'osc' },
  detune: { name: 'Detune', param: 'osc2Detune', stage: 'osc' },
  pulseWidth: { name: 'Pulse Width', param: 'pulseWidth', stage: 'osc' },
  cutoff: { name: 'Cutoff', param: 'cutoff', stage: 'filter' },
  resonance: { name: 'Resonance', param: 'resonance', stage: 'filter' },
  volume: { name: 'Volume', param: 'volume', stage: 'amp' },
};

/** The Destinations an active LFO (Depth above zero) moves, LFO 1's first, each once (both LFOs on one: one). */
export const lfoTargets = (patch: Patch): LfoDestination[] => [
  ...new Set(
    lfos(patch)
      .filter((l) => l.amount > 0)
      .map((l) => l.destination),
  ),
];

/**
 * Where a Destination is at a moment, 0–1 on its knob's own scale (its taper), as the LFOs move it: the knob's value
 * plus their swing (both added together when both aim at it), as the sound does. Pitch, which has no knob, is the
 * Note's own pitch in the middle and the LFO's full swing (a semitone each way) at the edges. `still` gives the
 * knob's own setting instead, the place the LFOs swing around.
 */
export function targetLevel(destination: LfoDestination, patch: Patch, m: Modulation, still = false): number {
  const { param } = TARGETS[destination];
  if (!param) return still ? 0.5 : 0.5 + m.vibrato / (2 * (LFO_PITCH_CENTS / 100));
  const level = (v: number) => {
    const def = PARAMS[param];
    return valueToPosition(def, Math.min(def.max, Math.max(def.min, v)));
  };
  if (still) return level(patch[param]);
  if (destination === 'cutoff') return level(m.cutoff);
  if (destination === 'resonance') return level(m.resonance);
  if (destination === 'volume') return level(m.volume);
  if (destination === 'osc2Pitch') return level(patch.osc2Semitone + lfoOffset(patch, 'osc2Pitch', LFO_OSC2_CENTS / 100, m.lfo));
  if (destination === 'detune') return level(patch.osc2Detune + lfoOffset(patch, 'detune', LFO_DETUNE_CENTS, m.lfo));
  const room = Math.min(patch.pulseWidth - MIN_PULSE, MAX_PULSE - patch.pulseWidth);
  return level(patch.pulseWidth + lfoOffset(patch, 'pulseWidth', LFO_PULSE_WIDTH, m.lfo, room));
}
