import type { ParamId } from '../patch/patch';

/** The four sections, top to bottom on a phone: the strip's short word, and the section's own name. */
export const SECTIONS = [
  { short: 'Osc', name: 'Oscillators' },
  { short: 'Filter', name: 'Filter' },
  { short: 'Amp', name: 'Amp' },
  { short: 'LFO & Env', name: 'LFO & Envelopes' },
] as const;

export type SectionName = (typeof SECTIONS)[number]['name'];

/** The section each Parameter's control sits in. */
export const SECTION_OF: Record<ParamId, SectionName> = {
  pulseWidth: 'Oscillators',
  osc1Octave: 'Oscillators',
  osc2Octave: 'Oscillators',
  osc2Semitone: 'Oscillators',
  osc2Detune: 'Oscillators',
  osc2PulseWidth: 'Oscillators',
  crossMod: 'Oscillators',
  mixOsc1: 'Oscillators',
  mixOsc2: 'Oscillators',
  mixRing: 'Oscillators',
  mixNoise: 'Oscillators',
  mixSub: 'Oscillators',
  velocityCutoff: 'Filter',
  keyTrack: 'Filter',
  cutoff: 'Filter',
  resonance: 'Filter',
  filterEnvAmount: 'Filter',
  filterAttack: 'Filter',
  filterDecay: 'Filter',
  filterSustain: 'Filter',
  filterRelease: 'Filter',
  glide: 'Amp',
  ampAttack: 'Amp',
  ampDecay: 'Amp',
  ampSustain: 'Amp',
  ampRelease: 'Amp',
  volume: 'Amp',
  lfoRate: 'LFO & Envelopes',
  lfoAmount: 'LFO & Envelopes',
  lfo2Rate: 'LFO & Envelopes',
  lfo2Amount: 'LFO & Envelopes',
};
