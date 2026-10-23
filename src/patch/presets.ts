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

  // Shapes to look at in the Scope.
  preset('Pure Sine', 'One Harmonic and nothing else: a single spike in the Spectrum, and the smoothest curve the Scope can draw.', {
    waveform: 'sine', cutoff: 20000, resonance: 0, ampSustain: 1,
  }),
  preset('Soft Triangle', 'Odd Harmonics only, falling fast (1/n²): a triangle in the Scope, and a spectrum that thins out quickly.', {
    waveform: 'triangle', cutoff: 20000, resonance: 0, ampSustain: 1,
  }),
  preset('Hollow Square', 'Odd Harmonics only, falling as 1/n: every second rung of the ladder is missing. Turn the Cutoff down to round its corners.', {
    waveform: 'square', cutoff: 20000, resonance: 0, ampSustain: 1,
  }),
  preset('Thin Pulse', 'A 10 % pulse: a spike in the Scope, and in the Spectrum every tenth Harmonic vanishes. Turn Pulse Width to move the gaps.', {
    waveform: 'pulse', pulseWidth: 0.1, cutoff: 20000, resonance: 0, ampSustain: 1,
  }),
  preset('PWM Morph', 'The LFO sweeps the Pulse Width: the Scope breathes between square and needle, and the Spectrum’s gaps slide along the ladder.', {
    waveform: 'pulse', pulseWidth: 0.5, cutoff: 6000, resonance: 0.1,
    lfoDestination: 'pulseWidth', lfoRate: 0.4, lfoAmount: 0.9, ampSustain: 1, ampRelease: 0.6,
  }),

  // Two Oscillators drawing patterns together.
  preset('Octave Stack', 'A sine an octave above a saw: each ramp of the saw carries two bumps, and the second Harmonic stands out in the Spectrum.', {
    osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.8, cutoff: 20000, resonance: 0, ampSustain: 1,
  }),
  preset('Perfect Fifth', 'Two sines a fifth apart (3:2): a pattern that repeats every two cycles. Set the Scope to 2 or 4 cycles to see it lock.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 7, mixOsc2: 1, cutoff: 20000, resonance: 0, ampSustain: 1,
  }),
  preset('Tritone Knot', 'Two saws a tritone apart: a ratio that never quite repeats, so the Scope draws a tangled, restless knot.', {
    osc2Semitone: 6, mixOsc2: 0.9, cutoff: 5000, resonance: 0.1, ampSustain: 1,
  }),
  preset('Slow Beats', 'Two sines 4 cents apart: they drift in and out of step, so the Scope’s height swells and fades a few times a second.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Detune: 4, mixOsc2: 1, cutoff: 20000, resonance: 0, ampSustain: 1,
  }),

  // The Filter shaping the wave.
  preset('Resonant Ring', 'High Resonance makes the Filter ring after every edge of the saw: see the ripples in the Scope, at the Cutoff’s frequency.', {
    cutoff: 1400, resonance: 0.9, filterSlope: 24, ampSustain: 1,
  }),
  preset('Vowel', 'A narrow band-pass keeps a few Harmonics near the Cutoff, like the formant of a sung vowel; the LFO moves it slowly.', {
    filterMode: 'bandpass', cutoff: 800, resonance: 0.75, lfoRate: 0.4, lfoAmount: 0.25, ampSustain: 1, ampRelease: 0.5,
  }),
  preset('High-pass Buzz', 'A high-pass takes away the fundamental and the low Harmonics: the saw’s ramp is gone and only its sharp edges remain.', {
    filterMode: 'highpass', cutoff: 1500, resonance: 0.3, filterSlope: 24, ampSustain: 1,
  }),
  preset('Notch Sweep', 'A notch cuts a hole in the Harmonic ladder, and the LFO slides it up and down: watch the hole travel in the Spectrum.', {
    filterMode: 'notch', cutoff: 1500, resonance: 0.6, lfoRate: 0.25, lfoAmount: 0.6, ampSustain: 1,
  }),
  preset('Brass Swell', 'The Filter Envelope opens a little slower than the Amp: each Note starts dark and blooms bright, like a horn.', {
    osc2Detune: 6, mixOsc2: 0.6,
    cutoff: 500, resonance: 0.25, filterEnvAmount: 2.5, filterAttack: 0.12, filterDecay: 0.6, filterSustain: 0.55, filterRelease: 0.3,
    ampAttack: 0.04, ampDecay: 0.3, ampSustain: 0.85, ampRelease: 0.25, keyTrack: 0.5,
  }),
  preset('Wind', 'Noise only, through a resonant band-pass that the LFO sweeps: no Harmonics at all, just a band of energy moving like a gust.', {
    mixOsc1: 0, mixNoise: 1, filterMode: 'bandpass', cutoff: 1200, resonance: 0.7,
    lfoRate: 0.2, lfoAmount: 0.5, ampAttack: 0.6, ampSustain: 1, ampRelease: 1.5,
  }),

  // Movement.
  preset('Glide Slide', 'A long Glide: play two Notes and watch the pitch slide between them, while Cycle Lock keeps the Scope steady all the way.', {
    waveform: 'square', cutoff: 3000, resonance: 0.2, glide: 0.5, ampSustain: 1, keyTrack: 1,
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
