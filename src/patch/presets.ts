import type { Library } from './library';
import { defaultPatch, type Patch } from './patch';
import { patchFromShare } from './serialize';

export interface Preset {
  name: string;
  /** What this sound shows off: the lesson in it. */
  about: string;
  patch: Patch;
}

const preset = (name: string, about: string, changes: Partial<Patch>): Preset => ({ name, about, patch: { ...defaultPatch(), ...changes } });

/** Factory sounds, each built to show one idea; read-only. */
export const PRESETS: Preset[] = [
  preset('Init', 'The plain starting point: one saw through an open low-pass Filter.', {}),
  preset('Bass', 'A saw with a square an octave below, through a 24 dB Filter whose Envelope gives each Note a thump.', {
    osc2Waveform: 'square', osc2Octave: -1, mixOsc2: 0.5,
    filterSlope: 24, cutoff: 280, resonance: 0.35,
    filterEnvAmount: 2.5, filterAttack: 0.002, filterDecay: 0.18, filterSustain: 0.15, filterRelease: 0.15,
    ampAttack: 0.002, ampDecay: 0.3, ampSustain: 0.8, ampRelease: 0.12,
  }),
  preset('Lead', 'Two saws a few cents apart (watch them beat in a 4-cycle Scope), with vibrato from the LFO and a little Glide.', {
    osc2Detune: 9, mixOsc2: 0.7,
    cutoff: 1800, resonance: 0.45, filterEnvAmount: 1, filterAttack: 0.01, filterDecay: 0.4, filterSustain: 0.5,
    lfoDestination: 'pitch', lfoRate: 5.5, lfoAmount: 0.15, glide: 0.08, ampSustain: 0.9,
  }),
  preset('Pluck', 'A pulse into a resonant 24 dB Filter that the Envelope snaps open and shut: see the Harmonics flash and vanish.', {
    waveform: 'pulse', pulseWidth: 0.3,
    filterSlope: 24, cutoff: 220, resonance: 0.5,
    filterEnvAmount: 4, filterAttack: 0.001, filterDecay: 0.22, filterSustain: 0, filterRelease: 0.2,
    ampAttack: 0.001, ampDecay: 0.45, ampSustain: 0, ampRelease: 0.3,
  }),
  preset('Pad', 'Slow Envelopes swell the sound in and out, detuned saws and a breath of Noise thicken it, and the LFO keeps the Filter moving.', {
    osc2Detune: -14, mixOsc2: 0.8, mixNoise: 0.05,
    cutoff: 900, resonance: 0.2, filterEnvAmount: 1.2, filterAttack: 1.2, filterDecay: 1.5, filterSustain: 0.6, filterRelease: 1.5,
    ampAttack: 0.9, ampDecay: 1, ampSustain: 0.8, ampRelease: 1.8,
    lfoRate: 0.3, lfoAmount: 0.15,
  }),
  preset('Wobble', 'The LFO sweeping a resonant 24 dB low-pass: watch the Response Curve and the Timeline swing in time.', {
    osc2Waveform: 'square', osc2Octave: -1, mixOsc2: 0.6,
    filterSlope: 24, cutoff: 300, resonance: 0.65,
    lfoRate: 3, lfoAmount: 0.7, ampSustain: 1, ampRelease: 0.2,
  }),
];

/** The next (+1) or previous (−1) Preset, wrapping around at the ends. */
export const stepPreset = (index: number, delta: number) => (index + delta + PRESETS.length) % PRESETS.length;

/** The Preset an arrow leads to from the sound named: the next or previous one, or the first or last from a Patch. */
export function presetAfter(name: string, delta: number): Preset {
  const index = PRESETS.findIndex((p) => p.name === name);
  return PRESETS[index === -1 ? (delta > 0 ? 0 : PRESETS.length - 1) : stepPreset(index, delta)];
}

/** What plays when the page opens: a share link, else last session's Patch, else Init. */
export function initialPatch(hash: string, library: Library): { patch: Patch; name: string } {
  const shared = hash.startsWith('#p=') ? patchFromShare(hash.slice(3)) : undefined;
  if (shared) return { patch: shared, name: 'Shared Patch' };
  const last = library.loadCurrent();
  if (last) return { patch: last, name: 'Last session' };
  return { patch: PRESETS[0].patch, name: PRESETS[0].name };
}
