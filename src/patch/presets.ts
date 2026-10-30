import type { Library } from './library';
import { defaultPatch, type Patch } from './patch';
import { readShareHash } from './serialize';

export const PRESET_GROUPS = [
  'Start',
  'Shapes',
  'Intervals',
  'Filter',
  'Envelope',
  'LFO',
  'Bass',
  'Leads',
  'Keys & Plucks',
  'Pianos',
  'Pads',
  'Chords',
  'Drums',
  'Movement & Effects',
] as const;
export type PresetGroup = (typeof PRESET_GROUPS)[number];

export interface Preset {
  name: string;
  group: PresetGroup;
  /** What this sound shows off, and what to look at. */
  about: string;
  patch: Patch;
}

/** Factory sounds, each built to show one idea; read-only. Grouped, in the order the arrows step through them. */
export const PRESETS: Preset[] = [];
const group = (name: PresetGroup, presets: [string, string, Partial<Patch>][]) => {
  for (const [title, about, changes] of presets) PRESETS.push({ name: title, group: name, about, patch: { ...defaultPatch(), ...changes } });
};

// A steady, open sound for looking at shapes.
const OPEN = { cutoff: 20000, resonance: 0, ampSustain: 1 } as const;

group('Start', [['Init', 'The plain starting point: one saw through an open low-pass Filter.', {}]]);

group('Shapes', [
  ['Pure Sine', 'One Harmonic and nothing else: a single spike in the Spectrum, and the smoothest curve the Scope can draw.', { waveform: 'sine', ...OPEN }],
  ['Soft Triangle', 'Odd Harmonics only, falling fast (1/n²): a triangle in the Scope, and a spectrum that thins out quickly.', { waveform: 'triangle', ...OPEN }],
  ['Hollow Square', 'Odd Harmonics only, falling as 1/n: every second rung of the ladder is missing. Turn the Cutoff down to round its corners.', { waveform: 'square', ...OPEN }],
  ['Thin Pulse', 'A 10 % pulse: a spike in the Scope, and in the Spectrum every tenth Harmonic vanishes. Turn Pulse Width to move the gaps.', { waveform: 'pulse', pulseWidth: 0.1, ...OPEN }],
  ['PWM Morph', 'The LFO sweeps the Pulse Width: the Scope breathes between square and needle, and the Spectrum’s gaps slide along the ladder.', {
    waveform: 'pulse', pulseWidth: 0.5, cutoff: 6000, resonance: 0.1, lfoDestination: 'pulseWidth', lfoRate: 0.4, lfoAmount: 0.9, ampSustain: 1, ampRelease: 0.6,
  }],
  ['Sub Ladder', 'A square an octave below a saw: the Sub fills the odd rungs of a ladder that now starts an octave lower, Osc 1 the even ones.', { mixSub: 0.7, ...OPEN }],
  ['Square on Square', 'Two squares an octave apart, through the Sub: a staircase in the Scope, every Harmonic of the lower one present.', { waveform: 'square', mixSub: 1, ...OPEN }],
  ['Sine Sub Two Down', 'A sine Sub two octaves under a saw: one clean spike far left in the Spectrum, the ladder counted from it, Osc 1 on every fourth rung.', {
    mixSub: 0.8, subOctave: -2, subWaveform: 'sine', ...OPEN,
  }],
]);

group('Intervals', [
  ['Octave Stack', 'A sine an octave above a saw: each ramp of the saw carries two bumps, and the second Harmonic stands out in the Spectrum.', {
    osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.8, ...OPEN,
  }],
  ['Perfect Fifth', 'Two sines a fifth apart (3:2): a pattern that repeats every two cycles. Set the Scope to 2 or 4 cycles to see it lock.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 7, mixOsc2: 1, ...OPEN,
  }],
  ['Major Third', 'Two sines a major third apart (nearly 5:4): a longer pattern than the fifth, and it slowly rolls, because equal temperament is not quite 5:4.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 4, mixOsc2: 1, ...OPEN,
  }],
  ['Tritone Knot', 'Two saws a tritone apart: a ratio that never quite repeats, so the Scope draws a tangled, restless knot.', { osc2Semitone: 6, mixOsc2: 0.9, cutoff: 5000, resonance: 0.1, ampSustain: 1 }],
  ['Slow Beats', 'Two sines 4 cents apart: they drift in and out of step, so the Scope’s height swells and fades a few times a second.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Detune: 4, mixOsc2: 1, ...OPEN,
  }],
  ['Fast Beats', 'Two saws 40 cents apart: the beating is so fast it becomes roughness. Compare with Slow Beats.', { osc2Detune: 40, mixOsc2: 1, cutoff: 6000, resonance: 0, ampSustain: 1 }],
  ['Twelfth Bell', 'A sine an octave and a fifth above another (3:1): a pure, bell-like interval, three peaks per cycle of the lower one.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 7, mixOsc2: 0.6, ...OPEN, ampSustain: 0.4, ampDecay: 1.5, ampRelease: 1.5,
  }],
  ['Ring Bell', 'Two sines through Ring alone, Osc 2 an octave and a minor third up: neither pitch sounds, only their sum and difference, an out-of-tune pair that rings like a bell.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 3, mixOsc1: 0, mixRing: 1, ...OPEN, ampSustain: 0, ampDecay: 1.8, ampRelease: 1.8,
  }],
  ['FM Sidebands', 'Osc 2, a sine an octave up and silent, swings Osc 1’s pitch: sidebands grow either side of the Harmonic, and the Ideal’s circles follow them. Turn FM to spread them.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, crossMod: 0.3, ...OPEN,
  }],
  ['Ring Octave', 'A square times a square an octave up, through Ring alone: the product is a square again, at the Note’s pitch. The Ideal’s diamonds sit on its odd Harmonics only.', {
    waveform: 'square', osc2Waveform: 'square', osc2Octave: 1, mixOsc1: 0, mixRing: 1, ...OPEN,
  }],
  ['FM Ladder', 'Two sines on the same Note, Osc 2 silent but swinging Osc 1 hard (FM): one Harmonic becomes a whole ladder of them, a buzz grown from pure tones. Turn FM down and watch the rungs fold away.', {
    waveform: 'sine', osc2Waveform: 'sine', crossMod: 0.5, ...OPEN,
  }],
]);

group('Filter', [
  ['Resonant Ring', 'High Resonance makes the Filter ring after every edge of the saw: see the ripples in the Scope, at the Cutoff’s frequency.', {
    cutoff: 1400, resonance: 0.9, filterSlope: 24, ampSustain: 1,
  }],
  ['Self-Oscillation', 'Resonance all the way up on a dark Filter: the Cutoff itself starts to sing, a near-sine riding on the saw.', {
    cutoff: 900, resonance: 1, filterSlope: 24, keyTrack: 1, ampSustain: 1,
  }],
  ['12 vs 24', 'The same Cutoff at 12 dB: turn Slope to 24 and watch the high Harmonics fall twice as steeply under the Response Curve.', {
    cutoff: 700, resonance: 0.1, filterSlope: 12, ampSustain: 1,
  }],
  ['Vowel', 'A narrow band-pass keeps a few Harmonics near the Cutoff, like the formant of a sung vowel; the LFO moves it slowly.', {
    filterMode: 'bandpass', cutoff: 800, resonance: 0.75, lfoRate: 0.4, lfoAmount: 0.25, ampSustain: 1, ampRelease: 0.5,
  }],
  ['High-pass Buzz', 'A high-pass takes away the fundamental and the low Harmonics: the saw’s ramp is gone and only its sharp edges remain.', {
    filterMode: 'highpass', cutoff: 1500, resonance: 0.3, filterSlope: 24, ampSustain: 1,
  }],
  ['Notch Sweep', 'A notch cuts a hole in the Harmonic ladder, and the LFO slides it up and down: watch the hole travel in the Spectrum.', {
    filterMode: 'notch', cutoff: 1500, resonance: 0.6, lfoRate: 0.25, lfoAmount: 0.6, ampSustain: 1,
  }],
  ['Key Track Demo', 'Full Key Track: play low then high, and the Response Curve moves with the Harmonic Markers, so every Note keeps the same brightness.', {
    cutoff: 500, resonance: 0.35, filterSlope: 24, keyTrack: 1, ampSustain: 1,
  }],
  ['Velocity Bite', 'Velocity opens the Filter: tap a MIDI pad softly then hard (or click low on a piano key) and watch the Timeline’s Cutoff jump.', {
    cutoff: 300, resonance: 0.4, filterSlope: 24, velocityCutoff: 1, filterEnvAmount: 2, filterDecay: 0.3, filterSustain: 0.2, ampSustain: 0.8,
  }],
]);

// The same open saw under different Envelopes: the Timeline draws each contour.
const SAW = { cutoff: 20000, resonance: 0 } as const;
group('Envelope', [
  ['Gate', 'No shape at all: on with the key and off with it, a rectangle on the Timeline.', {
    ...SAW, ampAttack: 0.001, ampDecay: 0.001, ampSustain: 1, ampRelease: 0.01,
  }],
  ['Pluck Shape', 'Attack at once, then Decay to nothing: a spike on the Timeline that fades whether or not the key stays down.', {
    ...SAW, ampAttack: 0.001, ampDecay: 0.25, ampSustain: 0, ampRelease: 0.2,
  }],
  ['Swell', 'A slow Attack: the sound takes a second and a half to arrive, and the Timeline shows the ramp (at 2 s or more: Display, Env Timeline).', {
    ...SAW, ampAttack: 1.5, ampDecay: 0.5, ampSustain: 0.9, ampRelease: 1.5,
  }],
  ['Long Tail', 'A Release that outlasts the key by four seconds: let go and watch the tail cross the Timeline (set it to 4 s in Display, Env Timeline, to see it whole).', {
    ...SAW, ampAttack: 0.005, ampDecay: 0.1, ampSustain: 0.8, ampRelease: 4,
  }],
  ['Two Speeds', 'The Filter Envelope snaps while the Amp Envelope rises slowly: two curves on the Timeline, two speeds.', {
    cutoff: 400, resonance: 0.2, filterEnvAmount: 3, filterAttack: 0.001, filterDecay: 0.15, filterSustain: 0,
    ampAttack: 0.3, ampDecay: 0.3, ampSustain: 0.9, ampRelease: 0.4,
  }],
  ['Reverse Filter', 'A negative Envelope Amount: the Cutoff starts three octaves down and rises to its knob as the Envelope falls.', {
    cutoff: 4000, resonance: 0.2, filterEnvAmount: -3, filterAttack: 0.001, filterDecay: 0.5, filterSustain: 0,
    ampAttack: 0.002, ampSustain: 0.8, ampRelease: 0.3,
  }],
]);

// The LFO aimed at each destination, at each speed; the Timeline and the Response Curve show it move.
group('LFO', [
  ['Slow Vibrato', 'A sine LFO on the pitch at 2 Hz: every Harmonic in the Spectrum sways together, and the Scope stays locked through it.', {
    cutoff: 6000, resonance: 0, ampSustain: 1, lfoDestination: 'pitch', lfoRate: 2, lfoAmount: 0.3,
  }],
  ['Fast Vibrato', 'The same depth at 8 Hz: a nervous shimmer rather than a sway. Compare with Slow Vibrato.', {
    cutoff: 6000, resonance: 0, ampSustain: 1, lfoDestination: 'pitch', lfoRate: 8, lfoAmount: 0.3,
  }],
  ['Deep Sweep', 'A full-depth sine LFO on a resonant Cutoff, once every five seconds: the Response Curve crosses the whole Spectrum.', {
    cutoff: 800, resonance: 0.5, ampSustain: 1, lfoDestination: 'cutoff', lfoRate: 0.2, lfoAmount: 1,
  }],
  ['Stepped', 'A square LFO on the Cutoff: no sweep, just two places, and the Response Curve hops between them.', {
    cutoff: 600, resonance: 0.4, ampSustain: 1, lfoWaveform: 'square', lfoDestination: 'cutoff', lfoRate: 1, lfoAmount: 0.6,
  }],
  ['Ramp', 'A saw LFO on the Cutoff: it climbs for a second, then drops at once. Watch the Timeline’s Cutoff draw the teeth.', {
    cutoff: 600, resonance: 0.4, ampSustain: 1, lfoWaveform: 'saw', lfoDestination: 'cutoff', lfoRate: 1, lfoAmount: 0.6,
  }],
  ['Sidebands', 'Vibrato at 20 Hz is too fast to hear as vibrato: each Harmonic grows sidebands either side of it in the Spectrum.', {
    cutoff: 8000, resonance: 0, ampSustain: 1, lfoDestination: 'pitch', lfoRate: 20, lfoAmount: 1,
  }],
  ['Resonance Swell', 'The LFO moves the Resonance, not the Cutoff: the peak at the Cutoff swells and fades where it stands. The ring on Resonance shows how far.', {
    cutoff: 1200, resonance: 0.5, ampSustain: 1, lfoWaveform: 'triangle', lfoDestination: 'resonance', lfoRate: 0.5, lfoAmount: 0.9,
  }],
  ['Rolling Fifth', 'The LFO on Osc 2 Pitch alone: Osc 2 rolls an octave either side of Osc 1, so intervals drift past, and the Scope’s pattern dissolves and locks again.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 7, mixOsc2: 0.8, ...OPEN, lfoDestination: 'osc2Pitch', lfoRate: 0.1, lfoAmount: 0.15,
  }],
  ['Chorus Drift', 'The LFO on Detune: Osc 2 drifts in and out of tune with Osc 1, and the beating speeds up and slows down with it.', {
    osc2Detune: 0, mixOsc2: 1, cutoff: 5000, resonance: 0, ampSustain: 1, lfoDestination: 'detune', lfoRate: 0.3, lfoAmount: 0.4,
  }],
  ['Breathing Bell', 'A slow LFO on FM: the bell’s sidebands grow and fold away every four seconds, from a pure sine to struck metal and back. The FM knob’s blue ring shows the swing, from 0 to 60 %; the Ideal’s circles stay where the knob is set.', {
    voices: 4, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 10, crossMod: 0.3, ...OPEN,
    lfoDestination: 'fm', lfoRate: 0.25, lfoAmount: 1, ampAttack: 0.01, ampRelease: 1.5,
  }],
  ['Double Motion', 'Two LFOs at once: LFO 1 sweeps the Cutoff slowly, LFO 2 adds a quick vibrato. The Cutoff’s blue ring is LFO 1’s; the Timeline draws the pitch as LFO 2 moves it.', {
    cutoff: 900, resonance: 0.4, ampSustain: 1, lfoDestination: 'cutoff', lfoRate: 0.25, lfoAmount: 0.7,
    lfo2Destination: 'pitch', lfo2Rate: 6, lfo2Amount: 0.25,
  }],
  ['Key Sync', 'A falling saw on the Cutoff, retriggered: every Note opens bright and closes the same way, however you time it. Turn Retrigger off to hear each Note catch it anywhere.', {
    cutoff: 500, resonance: 0.5, ampSustain: 1, lfoWaveform: 'sawDown', lfoDestination: 'cutoff', lfoRate: 1.5, lfoAmount: 0.8, lfoRetrigger: 'note',
  }],
]);

group('Bass', [
  ['Bass', 'A saw with a square an octave below, through a 24 dB Filter whose Envelope gives each Note a thump.', {
    osc2Waveform: 'square', osc2Octave: -1, mixOsc2: 0.5,
    filterSlope: 24, cutoff: 280, resonance: 0.35,
    filterEnvAmount: 2.5, filterAttack: 0.002, filterDecay: 0.18, filterSustain: 0.15, filterRelease: 0.15,
    ampAttack: 0.002, ampDecay: 0.3, ampSustain: 0.8, ampRelease: 0.12,
  }],
  ['Sub Bass', 'Almost all Sub: a deep, round square an octave down, with just enough saw on top to be heard on small speakers.', {
    mixOsc1: 0.25, mixSub: 1, cutoff: 400, resonance: 0, filterSlope: 24, keyTrack: 0.5, ampAttack: 0.004, ampSustain: 1, ampRelease: 0.1,
  }],
  ['Reese', 'Two saws 18 cents apart over a Sub: the slow phasing of a drum-and-bass Reese, the Scope never quite settling.', {
    osc2Detune: 18, mixOsc2: 1, mixSub: 0.6, cutoff: 900, resonance: 0.2, filterSlope: 24, keyTrack: 0.5,
    lfoRate: 0.15, lfoAmount: 0.15, ampSustain: 1, ampRelease: 0.2,
  }],
  ['Acid', 'A saw through a squelchy resonant Filter with a sharp Envelope and Glide: slide between Notes for the classic acid line.', {
    filterSlope: 24, cutoff: 250, resonance: 0.8, filterEnvAmount: 3.5, filterAttack: 0.001, filterDecay: 0.15, filterSustain: 0.05, filterRelease: 0.1,
    velocityCutoff: 0.5, glide: 0.06, ampAttack: 0.001, ampSustain: 0.9, ampRelease: 0.08,
  }],
  ['Rubber', 'A sine and its Sub with a quick Filter blip: a rounded, bouncy bass.', {
    waveform: 'sine', mixSub: 0.8, cutoff: 600, filterEnvAmount: 1.5, filterDecay: 0.12, filterSustain: 0,
    ampAttack: 0.002, ampDecay: 0.35, ampSustain: 0.3, ampRelease: 0.1,
  }],
  ['Pluck Bass', 'Velocity-sensitive and short: soft Notes are dull, hard ones bite. The Sub keeps the low end steady.', {
    waveform: 'square', mixSub: 0.6, filterSlope: 24, cutoff: 220, resonance: 0.3, velocityCutoff: 0.8,
    filterEnvAmount: 3, filterDecay: 0.2, filterSustain: 0, ampAttack: 0.001, ampDecay: 0.4, ampSustain: 0, ampRelease: 0.15, keyTrack: 0.5,
  }],
  ['Wobble', 'The LFO sweeping a resonant 24 dB low-pass, retriggered: every Note starts its wobble from the top, so it lands on the beat. Watch the Timeline restart.', {
    osc2Waveform: 'square', osc2Octave: -1, mixOsc2: 0.6,
    filterSlope: 24, cutoff: 300, resonance: 0.65,
    lfoRate: 3, lfoAmount: 0.7, lfoRetrigger: 'note', ampSustain: 1, ampRelease: 0.2,
  }],
  ['Double Wobble', 'Both LFOs on the Cutoff, both retriggered: LFO 1 a slow wobble, LFO 2 a quick square flutter riding it. The Cutoff’s blue ring spans the two together; the Timeline draws their sum.', {
    osc2Waveform: 'square', osc2Octave: -1, mixOsc2: 0.6,
    filterSlope: 24, cutoff: 300, resonance: 0.6,
    lfoRate: 2, lfoAmount: 0.6, lfoRetrigger: 'note',
    lfo2Waveform: 'square', lfo2Destination: 'cutoff', lfo2Rate: 8, lfo2Amount: 0.25, lfo2Retrigger: 'note',
    ampSustain: 1, ampRelease: 0.2,
  }],
  ['Growl', 'A square LFO jumping the Filter between two places over a Sub: a stepped, talking bass.', {
    mixOsc2: 0.6, osc2Detune: -8, mixSub: 0.7, filterSlope: 24, cutoff: 350, resonance: 0.6,
    lfoWaveform: 'square', lfoRate: 4, lfoAmount: 0.5, ampSustain: 1, ampRelease: 0.15,
  }],
  ['Split Octave Bass', 'Osc 1 dropped an octave by its own Octave, Osc 2 left on the Note and a few cents off: a wide bass, the Scope repeating at Osc 1’s slower cycle.', {
    osc1Octave: -1, osc2Waveform: 'square', osc2Detune: 7, mixOsc2: 0.5,
    filterSlope: 24, cutoff: 500, resonance: 0.3, filterEnvAmount: 2, filterAttack: 0.002, filterDecay: 0.2, filterSustain: 0.1, ampSustain: 1, ampRelease: 0.15,
  }],
  ['FM Bass', 'A sine swung by a sine on the same Note (FM), over a sine Sub. The Filter Envelope throws Osc 2 an octave up at each strike (Env Amount), so the sidebands jump wide and settle back: a rubbery, punchy attack.', {
    waveform: 'sine', osc2Waveform: 'sine', crossMod: 0.35, osc2EnvAmount: 12, mixSub: 0.6, subWaveform: 'sine',
    filterSlope: 24, cutoff: 1800, resonance: 0.15, filterEnvAmount: 1.5, filterAttack: 0.001, filterDecay: 0.18, filterSustain: 0,
    ampAttack: 0.002, ampDecay: 0.6, ampSustain: 0.6, ampRelease: 0.15,
  }],
  ['808 Boom', 'Osc 2 alone, a sine the Filter Envelope throws two octaves up and drops in a flash (Env Amount), over a long sine Sub: the click and dive of an 808 kick, then its boom. Watch the spike fall in the Spectrum.', {
    waveform: 'sine', mixOsc1: 0, osc2Waveform: 'sine', mixOsc2: 0.8, osc2EnvAmount: 24, mixSub: 1, subWaveform: 'sine',
    cutoff: 20000, resonance: 0, filterAttack: 0.001, filterDecay: 0.06, filterSustain: 0, ampAttack: 0.001, ampDecay: 1.2, ampSustain: 0, ampRelease: 0.3,
  }],
  ['FM Growl', 'A triangle LFO on FM, three times a second and restarted with each Note: two sines in tune with a sine Sub below them, swinging from a pure tone to a buzzing growl and back. The Spectrum’s sidebands pump in and out with it.', {
    waveform: 'sine', osc2Waveform: 'sine', crossMod: 0.5, mixSub: 0.5, subWaveform: 'sine', cutoff: 4000, resonance: 0.2, ampSustain: 1,
    lfoWaveform: 'triangle', lfoDestination: 'fm', lfoRate: 3, lfoAmount: 1, lfoRetrigger: 'note',
  }],
]);

group('Leads', [
  ['Lead', 'Two saws a few cents apart (watch them beat in a 4-cycle Scope), with vibrato from the LFO and a little Glide.', {
    osc2Detune: 9, mixOsc2: 0.7,
    cutoff: 1800, resonance: 0.45, filterEnvAmount: 1, filterAttack: 0.01, filterDecay: 0.4, filterSustain: 0.5,
    lfoDestination: 'pitch', lfoRate: 5.5, lfoAmount: 0.15, glide: 0.08, ampSustain: 0.9,
  }],
  ['Square Lead', 'A hollow square with delayed-feeling vibrato and Key Track, so high Notes stay as bright as low ones.', {
    waveform: 'square', cutoff: 2500, resonance: 0.3, keyTrack: 0.8, lfoDestination: 'pitch', lfoRate: 5, lfoAmount: 0.12, ampSustain: 0.9, ampRelease: 0.2,
  }],
  ['Chip Lead', 'A 12 % pulse with fast vibrato: the thin, buzzy voice of old game consoles.', {
    waveform: 'pulse', pulseWidth: 0.12, ...OPEN, lfoDestination: 'pitch', lfoRate: 7, lfoAmount: 0.2, ampRelease: 0.05,
  }],
  ['Screamer', 'Resonance high and Velocity opening the Filter: play harder and the Response Curve peak climbs into the Harmonics.', {
    osc2Detune: -6, mixOsc2: 0.6, filterSlope: 24, cutoff: 1200, resonance: 0.85, velocityCutoff: 1, keyTrack: 0.6,
    filterEnvAmount: 1.5, filterDecay: 0.5, filterSustain: 0.4, ampSustain: 0.9, glide: 0.04,
  }],
  ['Portamento', 'A long Glide on a fifth-stacked lead: the pitch slides between Notes and Key Track drags the Filter along with it.', {
    osc2Semitone: 7, mixOsc2: 0.5, cutoff: 1500, resonance: 0.4, keyTrack: 1, glide: 0.25, ampSustain: 1, ampRelease: 0.3,
  }],
  ['Whistle', 'A pure sine with gentle vibrato: watch the single Harmonic wobble left and right in the Spectrum.', {
    waveform: 'sine', ...OPEN, lfoDestination: 'pitch', lfoRate: 5.5, lfoAmount: 0.18, ampAttack: 0.05, ampRelease: 0.2,
  }],
  ['Sync-ish Lead', 'Osc 2 a twelfth up and slightly detuned, through a band-pass: a cutting, nasal lead that hints at hard sync.', {
    osc2Octave: 1, osc2Semitone: 7, osc2Detune: 5, mixOsc2: 0.8, filterMode: 'bandpass', cutoff: 1800, resonance: 0.5, keyTrack: 1,
    ampSustain: 0.9, ampRelease: 0.2,
  }],
  ['Singing Lead', 'A saw lead with a vibrato that starts the same way on every Note (LFO 2, retriggered), and LFO 1 breathing the Cutoff slowly underneath.', {
    filterSlope: 24, cutoff: 2200, resonance: 0.3, keyTrack: 0.5, glide: 0.06, ampSustain: 0.9, ampRelease: 0.3,
    lfoDestination: 'cutoff', lfoRate: 0.2, lfoAmount: 0.3, lfo2Destination: 'pitch', lfo2Rate: 5.5, lfo2Amount: 0.3, lfo2Retrigger: 'note',
  }],
  ['Poly Mod Zap', 'The Filter Envelope throws Osc 2 two octaves up and lets it fall as it opens the Filter, while Osc 2 swings Osc 1 (FM): each Note starts with a laser zap.', {
    osc2EnvAmount: 24, mixOsc2: 0.5, crossMod: 0.15,
    cutoff: 1200, resonance: 0.35, filterEnvAmount: 2, filterAttack: 0.002, filterDecay: 0.25, filterSustain: 0, ampSustain: 0.8,
  }],
  ['Ring Lead', 'A saw with Ring on top, Osc 2 a sine an octave and a tritone up: the Note stays clear while metallic partials ring around it, and LFO 2’s vibrato makes them shimmer. Diamonds mark them beside the circles.', {
    mixOsc1: 0.6, osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 6, osc2Detune: 3, mixRing: 0.6,
    cutoff: 4000, resonance: 0.2, keyTrack: 0.5, glide: 0.05, lfo2Destination: 'pitch', lfo2Rate: 5.5, lfo2Amount: 0.12, ampSustain: 0.9, ampRelease: 0.3,
  }],
  ['Ring Sweep', 'A saw times a saw that the Filter Envelope throws an octave and a fifth up and slides back over half a second (Env Amount): Ring’s partials sweep down into place on every Note, a tearing, sync-like scream.', {
    mixOsc1: 0.4, osc2EnvAmount: 19, mixRing: 0.8, cutoff: 3500, resonance: 0.3,
    filterAttack: 0.001, filterDecay: 0.5, filterSustain: 0, ampSustain: 0.9, ampRelease: 0.25,
  }],
]);

group('Keys & Plucks', [
  ['Pluck', 'A pulse into a resonant 24 dB Filter that the Envelope snaps open and shut: see the Harmonics flash and vanish.', {
    waveform: 'pulse', pulseWidth: 0.3,
    filterSlope: 24, cutoff: 220, resonance: 0.5,
    filterEnvAmount: 4, filterAttack: 0.001, filterDecay: 0.22, filterSustain: 0, filterRelease: 0.2,
    ampAttack: 0.001, ampDecay: 0.45, ampSustain: 0, ampRelease: 0.3,
  }],
  ['Harp', 'A triangle plucked through a short Filter Envelope, with Key Track so high strings ring as bright as low ones.', {
    voices: 8, waveform: 'triangle', cutoff: 800, resonance: 0.2, keyTrack: 1, filterEnvAmount: 2, filterDecay: 0.3, filterSustain: 0,
    ampAttack: 0.001, ampDecay: 1.2, ampSustain: 0, ampRelease: 1,
  }],
  ['Clav', 'A thin pulse through a high-pass, short and velocity-sensitive: a funky, percussive key.', {
    voices: 8, waveform: 'pulse', pulseWidth: 0.15, filterMode: 'highpass', cutoff: 300, resonance: 0.3, velocityCutoff: 0.6,
    ampAttack: 0.001, ampDecay: 0.25, ampSustain: 0.2, ampRelease: 0.08,
  }],
  ['Organ', 'Sine, octave and Sub, like drawbars: no Envelope shape at all, just on and off, and three clean rungs in the Spectrum.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.6, mixSub: 0.5, ...OPEN, ampAttack: 0.005, ampRelease: 0.03,
  }],
  ['Electric Piano', 'A triangle with a little octave sine: soft attack, long decay, and Velocity for a brighter strike.', {
    voices: 8, waveform: 'triangle', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.35, cutoff: 1800, velocityCutoff: 0.7, keyTrack: 0.5,
    ampAttack: 0.003, ampDecay: 2, ampSustain: 0.15, ampRelease: 0.5,
  }],
  ['Tremolo Keys', 'The Electric Piano with LFO 1 on Volume: its chords pulse gently, and the Amp Scope swells and shrinks with them.', {
    voices: 6, waveform: 'triangle', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.35, cutoff: 1800, velocityCutoff: 0.7, keyTrack: 0.5,
    ampAttack: 0.003, ampDecay: 2, ampSustain: 0.35, ampRelease: 0.5, lfoDestination: 'volume', lfoRate: 5, lfoAmount: 0.5,
  }],
  ['Marimba', 'A sine and a square two octaves up, gone almost at once: the bright tick of the mallet, then the round tone.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'square', osc2Octave: 2, mixOsc2: 0.25, cutoff: 3000, filterEnvAmount: -2, filterDecay: 0.05, filterSustain: 0,
    ampAttack: 0.001, ampDecay: 0.6, ampSustain: 0, ampRelease: 0.4,
  }],
  ['Glass Keys', 'Two sines a twelfth apart with a slow decay: bell-like, and the Scope shows the 3:1 pattern fading together.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 7, osc2Detune: 3, mixOsc2: 0.7, ...OPEN,
    ampAttack: 0.002, ampDecay: 2.5, ampSustain: 0, ampRelease: 1.5,
  }],
  ['Chorus Pluck', 'A pluck with LFO 2 slowly detuning Osc 2: a wide, gently moving shimmer on every Note.', {
    waveform: 'square', osc2Detune: 6, mixOsc2: 0.8, cutoff: 900, resonance: 0.2, filterEnvAmount: 3, filterAttack: 0.001, filterDecay: 0.25, filterSustain: 0,
    ampAttack: 0.001, ampDecay: 0.6, ampSustain: 0, ampRelease: 0.4, lfo2Destination: 'detune', lfo2Rate: 0.4, lfo2Amount: 0.35,
  }],
  ['FM Bell', 'A sine swung by another 3.56 times higher (FM): partials that are not Harmonics, so it rings like struck metal, on eight Voices. The Filter Envelope makes each strike bright, then mellow; the Ideal’s circles follow every sideband.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 10, crossMod: 0.3, cutoff: 2500, keyTrack: 0.6, velocityCutoff: 0.4,
    filterEnvAmount: 2, filterAttack: 0.001, filterDecay: 0.5, filterSustain: 0.2, ampAttack: 0.002, ampDecay: 3, ampSustain: 0, ampRelease: 1.5,
  }],
  ['Kalimba', 'A short sine with a little FM from a sine two octaves up: a quick metallic tine, then a round tone, on eight Voices. The sidebands sit far apart, every fourth Harmonic.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 2, crossMod: 0.12, cutoff: 3000, keyTrack: 0.5,
    filterEnvAmount: 1.5, filterAttack: 0.001, filterDecay: 0.12, filterSustain: 0, ampAttack: 0.001, ampDecay: 0.7, ampSustain: 0, ampRelease: 0.4,
  }],
  ['Zap Pluck', 'A falling saw LFO on FM, restarted with each Note: every strike starts at full FM, a bright metallic zap, and melts to a pure sine as it decays, on eight Voices.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, crossMod: 0.5, cutoff: 8000, resonance: 0,
    lfoWaveform: 'sawDown', lfoDestination: 'fm', lfoRate: 3, lfoAmount: 1, lfoRetrigger: 'note',
    ampAttack: 0.001, ampDecay: 0.35, ampSustain: 0, ampRelease: 0.3,
  }],
]);

// Pianos: a strike that darkens as it decays, harder for a harder hit, on eight Voices so held Notes ring on.
group('Pianos', [
  ['Piano', 'A pulse and a saw a few cents apart, a Filter Envelope that opens on the strike and closes as the Note decays, and eight Voices.', {
    voices: 8, waveform: 'pulse', pulseWidth: 0.35, osc2Waveform: 'saw', osc2Detune: 4, mixOsc2: 0.5,
    cutoff: 1500, resonance: 0.1, filterEnvAmount: 2, filterDecay: 0.6, filterSustain: 0.1, filterRelease: 0.3, keyTrack: 0.7, velocityCutoff: 0.6,
    ampAttack: 0.002, ampDecay: 2.5, ampSustain: 0.1, ampRelease: 0.4,
  }],
  ['Felt Piano', 'Soft and dark, as if a felt strip lay over the strings: a triangle through a low Cutoff with a slow, long decay.', {
    voices: 8, waveform: 'triangle', osc2Waveform: 'triangle', osc2Detune: 3, mixOsc2: 0.4,
    cutoff: 900, resonance: 0, filterEnvAmount: 1, filterDecay: 0.8, filterSustain: 0.2, keyTrack: 0.5, velocityCutoff: 0.4,
    ampAttack: 0.01, ampDecay: 3, ampSustain: 0.2, ampRelease: 0.8,
  }],
  ['Honky-Tonk', 'A second saw 14 cents off: the two strings of a neglected upright beat against each other, and the Scope never settles.', {
    voices: 8, waveform: 'pulse', pulseWidth: 0.35, osc2Waveform: 'saw', osc2Detune: 14, mixOsc2: 0.9,
    cutoff: 1800, resonance: 0.1, filterEnvAmount: 2, filterDecay: 0.6, filterSustain: 0.1, filterRelease: 0.3, keyTrack: 0.7, velocityCutoff: 0.6,
    ampAttack: 0.002, ampDecay: 2.2, ampSustain: 0.1, ampRelease: 0.4,
  }],
  ['Toy Piano', 'A sine with a square two octaves up, short and tinny: the metal tines of a toy, on eight Voices.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'square', osc2Octave: 2, mixOsc2: 0.3, cutoff: 5000, resonance: 0, keyTrack: 0.8,
    ampAttack: 0.001, ampDecay: 0.8, ampSustain: 0, ampRelease: 0.3,
  }],
  ['Tine Piano', 'An FM electric piano: a sine swung by a sine on the same Note. Velocity opens the Filter, so a soft Note is a mellow tine and a hard one barks.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', crossMod: 0.22, cutoff: 1200, velocityCutoff: 0.8, keyTrack: 0.5,
    filterEnvAmount: 2.5, filterAttack: 0.001, filterDecay: 0.35, filterSustain: 0.15, ampAttack: 0.002, ampDecay: 2.5, ampSustain: 0.1, ampRelease: 0.6,
  }],
]);

group('Pads', [
  ['Pad', 'Slow Envelopes swell the sound in and out, detuned saws and a breath of Noise thicken it, and the LFO keeps the Filter moving.', {
    voices: 8, osc2Detune: -14, mixOsc2: 0.8, mixNoise: 0.05,
    cutoff: 900, resonance: 0.2, filterEnvAmount: 1.2, filterAttack: 1.2, filterDecay: 1.5, filterSustain: 0.6, filterRelease: 1.5,
    ampAttack: 0.9, ampDecay: 1, ampSustain: 0.8, ampRelease: 1.8,
    lfoRate: 0.3, lfoAmount: 0.15,
  }],
  ['PWM Strings', 'Two slowly modulated pulses: the Pulse Width sweep gives the chorus-like shimmer of a string machine.', {
    voices: 8, waveform: 'pulse', pulseWidth: 0.4, osc2Waveform: 'pulse', osc2PulseWidth: 0.6, osc2Detune: 7, mixOsc2: 0.8, cutoff: 3000, resonance: 0.1,
    lfoDestination: 'pulseWidth', lfoRate: 0.6, lfoAmount: 0.6, keyTrack: 0.5, ampAttack: 0.4, ampSustain: 0.9, ampRelease: 1.2,
  }],
  ['Warm Pad', 'Detuned saws over a Sub, a low Cutoff that opens slowly: dark and wide.', {
    voices: 8, osc2Detune: 12, mixOsc2: 0.9, mixSub: 0.4, cutoff: 600, resonance: 0.15, filterEnvAmount: 1.5, filterAttack: 2, filterDecay: 2, filterSustain: 0.5,
    filterRelease: 2, ampAttack: 1.2, ampSustain: 0.9, ampRelease: 2.5, keyTrack: 0.4,
  }],
  ['Brass Swell', 'The Filter Envelope opens a little slower than the Amp: each Note starts dark and blooms bright, like a horn.', {
    voices: 8, osc2Detune: 6, mixOsc2: 0.6,
    cutoff: 500, resonance: 0.25, filterEnvAmount: 2.5, filterAttack: 0.12, filterDecay: 0.6, filterSustain: 0.55, filterRelease: 0.3,
    ampAttack: 0.04, ampDecay: 0.3, ampSustain: 0.85, ampRelease: 0.25, keyTrack: 0.5,
  }],
  ['Choir', 'Detuned saws through a band-pass, with a touch of Noise for breath: a vowel-like “aah”, and LFO 2 adding a singer’s slow vibrato.', {
    voices: 8, osc2Detune: 10, mixOsc2: 1, mixNoise: 0.08, filterMode: 'bandpass', cutoff: 900, resonance: 0.55, keyTrack: 0.3,
    lfoRate: 0.2, lfoAmount: 0.1, lfo2Destination: 'pitch', lfo2Rate: 5, lfo2Amount: 0.15,
    ampAttack: 0.6, ampSustain: 0.9, ampRelease: 1.5,
  }],
  ['Sweep Pad', 'A Filter Envelope seconds long: hold a Note and watch the Cutoff climb across the whole Timeline.', {
    voices: 8, osc2Detune: -9, mixOsc2: 0.8, filterSlope: 24, cutoff: 150, resonance: 0.5, filterEnvAmount: 5, filterAttack: 4, filterDecay: 4,
    filterSustain: 0.4, filterRelease: 3, ampAttack: 0.5, ampSustain: 1, ampRelease: 3,
  }],
  ['Dark Drone', 'Sub and a low saw under a slowly breathing Filter: a drone to watch the LFO draw on the Timeline.', {
    mixSub: 1, osc2Octave: -1, mixOsc2: 0.5, cutoff: 250, resonance: 0.5, filterSlope: 24, lfoWaveform: 'triangle', lfoRate: 0.1, lfoAmount: 0.6,
    ampAttack: 2, ampSustain: 1, ampRelease: 4,
  }],
  ['Shimmer Pad', 'Four Voices of pulses, LFO 1 morphing their width and LFO 2 detuning Osc 2: two slow movements weaving through a held chord.', {
    voices: 4, waveform: 'pulse', osc2Waveform: 'pulse', osc2Detune: 5, mixOsc2: 0.8, cutoff: 2500, resonance: 0.15,
    lfoDestination: 'pulseWidth', lfoRate: 0.3, lfoAmount: 0.6, lfo2Destination: 'detune', lfo2Rate: 0.13, lfo2Amount: 0.4,
    ampAttack: 0.8, ampSustain: 1, ampRelease: 2,
  }],
  ['Breathing Pad', 'LFO 1 on Resonance and LFO 2 on the Cutoff, at different slow speeds: the pad seems to breathe, never quite the same twice.', {
    voices: 4, osc2Detune: -7, mixOsc2: 0.8, filterSlope: 24, cutoff: 700, resonance: 0.45,
    lfoWaveform: 'triangle', lfoDestination: 'resonance', lfoRate: 0.17, lfoAmount: 0.7, lfo2Waveform: 'triangle', lfo2Destination: 'cutoff', lfo2Rate: 0.11, lfo2Amount: 0.5,
    ampAttack: 1.2, ampSustain: 1, ampRelease: 2.5,
  }],
  ['Trance Gate', 'A held chord chopped by a Square LFO on Volume at full Depth: on, off, on, off, sixteen times a bar, the gated pad of trance.', {
    voices: 8, osc2Detune: 9, mixOsc2: 0.9, cutoff: 1800, resonance: 0.2, ampAttack: 0.01, ampSustain: 1, ampRelease: 0.3,
    lfoWaveform: 'square', lfoDestination: 'volume', lfoRate: 8, lfoAmount: 1, lfoRetrigger: 'note',
  }],
  ['Cathedral', 'Three octaves at once: Osc 1 a square an octave up, Osc 2 a sine on the Note, the Sub a sine two octaves under Osc 1. A slow organ on eight Voices, its Harmonics in three clean families.', {
    voices: 8, waveform: 'square', osc1Octave: 1, mixOsc1: 0.35, osc2Waveform: 'sine', mixOsc2: 0.8, mixSub: 0.8, subOctave: -2, subWaveform: 'sine',
    cutoff: 3500, resonance: 0.1, ampAttack: 0.4, ampSustain: 1, ampRelease: 2,
  }],
  ['Glass Pad', 'A triangle with Ring against a sine an octave and a major third above, swelling slowly: glassy partials between the Harmonics, and LFO 2 drifting Osc 2 so they shimmer. Watch the diamonds between the circles.', {
    voices: 6, waveform: 'triangle', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 4, osc2Detune: 7, mixOsc1: 0.6, mixRing: 0.7, cutoff: 6000, resonance: 0.1,
    ampAttack: 1.2, ampSustain: 0.9, ampRelease: 2.5, lfo2Destination: 'detune', lfo2Rate: 0.3, lfo2Amount: 0.5,
  }],
  ['Deep Space', 'Pink Noise, a sine Sub two octaves down and Ring between two sines a tritone apart, under a Filter that breathes: a dark, slowly turning drone for chords.', {
    voices: 4, waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 6, osc2Detune: 11, mixOsc1: 0.3, mixRing: 0.5, mixSub: 0.7, subOctave: -2, subWaveform: 'sine',
    mixNoise: 0.25, noiseColour: 'pink', cutoff: 1500, resonance: 0.4, lfoDestination: 'cutoff', lfoRate: 0.07, lfoAmount: 0.5,
    lfo2Destination: 'osc2Pitch', lfo2Rate: 0.05, lfo2Amount: 0.1, ampAttack: 2, ampSustain: 1, ampRelease: 4,
  }],
  ['Glass Shimmer', 'A slow LFO 1 on FM swings a sine two octaves up through Osc 1, while LFO 2 drifts that sine’s Detune: the partials glint and shift like light through glass, on eight Voices.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 2, crossMod: 0.25, cutoff: 6000, resonance: 0,
    lfoWaveform: 'triangle', lfoDestination: 'fm', lfoRate: 0.15, lfoAmount: 1, lfo2Destination: 'detune', lfo2Rate: 0.3, lfo2Amount: 0.3,
    ampAttack: 1.5, ampSustain: 1, ampRelease: 3,
  }],
]);

// Several Voices: chords for playing. Eight where Notes ring on or chords are held, six for shorter sounds.
// The Oscillator and Filter Viewers follow the newest Note (ADR-0007), so each also shows one Note cleanly.
group('Chords', [
  ['Chord Pad', 'Eight Voices of detuned saws under a slow Filter: hold a chord, and the Viewers show only the Note you played last.', {
    voices: 8, osc2Detune: -12, mixOsc2: 0.8,
    cutoff: 1200, resonance: 0.15, filterEnvAmount: 1, filterAttack: 1.5, filterDecay: 2, filterSustain: 0.5, filterRelease: 2,
    ampAttack: 0.8, ampDecay: 1, ampSustain: 0.85, ampRelease: 2, lfoRate: 0.25, lfoAmount: 0.12,
  }],
  ['Poly Keys', 'An electric piano on eight Voices: Velocity brightens each strike, and the Timeline draws the newest Note’s Envelope while the others ring on.', {
    voices: 8, waveform: 'triangle', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.3, cutoff: 2200, velocityCutoff: 0.7, keyTrack: 0.6,
    ampAttack: 0.003, ampDecay: 1.8, ampSustain: 0.2, ampRelease: 0.6,
  }],
  ['Chord Organ', 'Drawbar sines on eight Voices: every held key sounds at once with no Envelope shape at all, so a chord is simply on and off.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.5, mixSub: 0.5, ...OPEN, ampAttack: 0.005, ampRelease: 0.03,
  }],
  ['Poly Pluck', 'A snapping Filter Envelope on six Voices: strum a chord and each Note gets its own flash of Harmonics; Key Track keeps the high strings bright.', {
    voices: 6, waveform: 'pulse', pulseWidth: 0.3, cutoff: 500, resonance: 0.4, filterSlope: 24, filterEnvAmount: 3, filterDecay: 0.18, filterSustain: 0, keyTrack: 0.8,
    ampAttack: 0.001, ampDecay: 0.5, ampSustain: 0, ampRelease: 0.3,
  }],
  ['Strings', 'A string section: eight Voices of slowly modulated pulses with a soft attack. Hold a chord and watch the Pulse Width shimmer on the newest Note.', {
    voices: 8, waveform: 'pulse', pulseWidth: 0.5, osc2Waveform: 'pulse', osc2PulseWidth: 0.45, osc2Detune: 8, mixOsc2: 0.8, cutoff: 3500, resonance: 0.05,
    lfoDestination: 'pulseWidth', lfoRate: 0.7, lfoAmount: 0.5, lfo2Destination: 'detune', lfo2Rate: 0.25, lfo2Amount: 0.3,
    ampAttack: 0.4, ampDecay: 0.5, ampSustain: 0.9, ampRelease: 1.2,
  }],
  ['Brass Section', 'Horns on six Voices: each Note blooms from dark to bright as its Filter Envelope opens, and further for a harder hit.', {
    voices: 6, osc2Detune: 6, mixOsc2: 0.7, cutoff: 700, resonance: 0.1, filterSlope: 24,
    filterEnvAmount: 2.5, filterAttack: 0.12, filterDecay: 0.5, filterSustain: 0.6, filterRelease: 0.3, velocityCutoff: 0.5,
    ampAttack: 0.06, ampDecay: 0.3, ampSustain: 0.85, ampRelease: 0.35,
  }],
  ['Vibes', 'A vibraphone: sine bars with a little vibrato and a long decay, on eight Voices so chords ring together.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 2, mixOsc2: 0.2, cutoff: 6000, keyTrack: 0.5,
    ampAttack: 0.001, ampDecay: 1.6, ampSustain: 0, ampRelease: 1, lfoDestination: 'pitch', lfoRate: 5, lfoAmount: 0.06,
  }],
  ['Duo Lead', 'Two Voices only: fifths and octaves under one hand, and a third Note takes the oldest Voice. The Viewers follow the newest.', {
    voices: 2, osc2Detune: 7, mixOsc2: 0.9, cutoff: 2500, resonance: 0.2, keyTrack: 0.4, velocityCutoff: 0.3,
    ampAttack: 0.01, ampDecay: 0.2, ampSustain: 0.8, ampRelease: 0.3, lfoDestination: 'pitch', lfoRate: 5.5, lfoAmount: 0.08,
  }],
  ['Bell Chords', 'Twelfth-stacked sines on eight Voices with a long decay: a chord of bells, each Note fading at its own pace while the Timeline shows the newest.', {
    voices: 8, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 7, osc2Detune: 4, mixOsc2: 0.6, ...OPEN,
    ampAttack: 0.002, ampDecay: 3, ampSustain: 0, ampRelease: 2,
  }],
  ['Chorus Chords', 'Four Voices of saws with LFO 2 detuning Osc 2: a chord that widens and narrows slowly, like an old chorus pedal.', {
    voices: 4, osc2Detune: 4, mixOsc2: 0.9, cutoff: 3000, resonance: 0.1, ampAttack: 0.05, ampSustain: 0.8, ampRelease: 0.8,
    lfo2Destination: 'detune', lfo2Rate: 0.5, lfo2Amount: 0.3,
  }],
]);

// Drums: short Envelopes on Noise and a self-oscillating Filter; each hit is one Preset.
group('Drums', [
  ['Kick', 'No Oscillator: a Filter at full Resonance sings on a little Noise, and the Filter Envelope drops its pitch three octaves in a flash.', {
    mixOsc1: 0, mixNoise: 0.4, cutoff: 55, resonance: 1, filterSlope: 24, filterEnvAmount: 3, filterAttack: 0.001, filterDecay: 0.08, filterSustain: 0,
    ampAttack: 0.001, ampDecay: 0.45, ampSustain: 0, ampRelease: 0.2,
  }],
  ['Snare', 'Noise and a short triangle through a low-pass whose Envelope snaps shut: the crack, then the rattle.', {
    waveform: 'triangle', mixOsc1: 0.5, mixNoise: 1, cutoff: 1500, resonance: 0.3, filterEnvAmount: 2.5, filterDecay: 0.12, filterSustain: 0, velocityCutoff: 0.5,
    ampAttack: 0.001, ampDecay: 0.22, ampSustain: 0, ampRelease: 0.15,
  }],
  ['Hi-hat', 'Noise alone through a high-pass, gone in a tenth of a second: nothing but the top of the Spectrum.', {
    mixOsc1: 0, mixNoise: 1, filterMode: 'highpass', cutoff: 7000, resonance: 0.3, ampAttack: 0.001, ampDecay: 0.08, ampSustain: 0, ampRelease: 0.05,
  }],
  ['Open Hat', 'The same Noise, let ring for half a second: compare the Amp Envelope with Hi-hat on the Timeline.', {
    mixOsc1: 0, mixNoise: 1, filterMode: 'highpass', cutoff: 6000, resonance: 0.3, ampAttack: 0.001, ampDecay: 0.5, ampSustain: 0, ampRelease: 0.3,
  }],
  ['Tom', 'A singing Filter an octave above the Kick with a gentler drop, and a touch of Noise for the skin.', {
    mixOsc1: 0, mixNoise: 0.3, cutoff: 120, resonance: 1, filterSlope: 24, filterEnvAmount: 1.5, filterAttack: 0.001, filterDecay: 0.15, filterSustain: 0,
    ampAttack: 0.001, ampDecay: 0.4, ampSustain: 0, ampRelease: 0.2,
  }],
  ['Cowbell', 'Two squares a fifth apart through a band-pass: the clank of two tones that do not quite agree, cut short.', {
    waveform: 'square', osc2Waveform: 'square', osc2Semitone: 7, mixOsc2: 0.8, filterMode: 'bandpass', cutoff: 800, resonance: 0.6,
    ampAttack: 0.001, ampDecay: 0.3, ampSustain: 0, ampRelease: 0.15,
  }],
  ['Clang', 'Two squares a tritone apart through Ring and a high-pass, cut short: the clank of struck metal, its partials nowhere near a ladder.', {
    waveform: 'square', osc2Waveform: 'square', osc2Semitone: 6, osc2Detune: 9, mixOsc1: 0, mixRing: 1, filterMode: 'highpass', cutoff: 600, resonance: 0.2,
    ampAttack: 0.001, ampDecay: 0.35, ampSustain: 0, ampRelease: 0.15,
  }],
  ['Zap Tom', 'Osc 2, a sine the Filter Envelope throws an octave up and drops at once (Env Amount), with a breath of Pink Noise: a tom that falls in pitch as it sounds.', {
    mixOsc1: 0, osc2Waveform: 'sine', mixOsc2: 1, osc2EnvAmount: 12, mixNoise: 0.2, noiseColour: 'pink', cutoff: 4000, resonance: 0,
    filterAttack: 0.001, filterDecay: 0.15, filterSustain: 0, ampAttack: 0.001, ampDecay: 0.4, ampSustain: 0, ampRelease: 0.2,
  }],
  ['Gong', 'Two sines an octave and a tritone apart through Ring, a wash of Pink Noise and a six-second fade: a gong, its partials shimmering as LFO 2 drifts Osc 2.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 6, osc2Detune: 13, mixOsc1: 0.25, mixRing: 0.8, mixNoise: 0.12, noiseColour: 'pink',
    cutoff: 5000, resonance: 0.1, filterEnvAmount: 1.5, filterAttack: 0.002, filterDecay: 1.5, filterSustain: 0.3,
    ampAttack: 0.002, ampDecay: 6, ampSustain: 0, ampRelease: 4, lfo2Destination: 'osc2Pitch', lfo2Rate: 0.4, lfo2Amount: 0.02,
  }],
]);

group('Movement & Effects', [
  ['Glide Slide', 'A long Glide: play two Notes and watch the pitch slide between them, while Cycle Lock keeps the Scope steady all the way.', {
    waveform: 'square', cutoff: 3000, resonance: 0.2, glide: 0.5, ampSustain: 1, keyTrack: 1,
  }],
  ['Wind', 'Noise only, through a resonant band-pass that the LFO sweeps: no Harmonics at all, just a band of energy moving like a gust.', {
    mixOsc1: 0, mixNoise: 1, filterMode: 'bandpass', cutoff: 1200, resonance: 0.7,
    lfoRate: 0.2, lfoAmount: 0.5, ampAttack: 0.6, ampSustain: 1, ampRelease: 1.5,
  }],
  ['Ocean', 'Noise through a low-pass that rises and falls slowly, like waves on a beach.', {
    mixOsc1: 0, mixNoise: 1, cutoff: 600, resonance: 0.1, lfoWaveform: 'triangle', lfoRate: 0.12, lfoAmount: 0.8,
    ampAttack: 1.5, ampSustain: 1, ampRelease: 3,
  }],
  ['Trill', 'A square LFO on the pitch: the Note jumps a semitone up and down, and Cycle Lock follows each jump.', {
    waveform: 'triangle', cutoff: 4000, lfoDestination: 'pitch', lfoWaveform: 'square', lfoRate: 6, lfoAmount: 1, ampSustain: 1,
  }],
  ['Wah', 'An LFO rocking a resonant band-pass, like a wah pedal: the hump in the Response Curve swings across the Harmonics.', {
    filterMode: 'bandpass', cutoff: 900, resonance: 0.7, lfoWaveform: 'triangle', lfoRate: 2, lfoAmount: 0.6, ampSustain: 1,
  }],
  ['Helicopter', 'A fast square LFO chopping the Filter on Noise and a Sub: rotor blades.', {
    mixOsc1: 0, mixNoise: 0.8, mixSub: 0.5, cutoff: 500, resonance: 0.3, lfoWaveform: 'square', lfoRate: 11, lfoAmount: 0.9, ampSustain: 1,
  }],
  ['Laser', 'A Filter Envelope that falls fast from far above: each Note zaps down. Look at the Cutoff dive on the Timeline.', {
    waveform: 'square', filterSlope: 24, cutoff: 200, resonance: 0.85, filterEnvAmount: 5, filterAttack: 0.001, filterDecay: 0.15,
    filterSustain: 0, ampAttack: 0.001, ampDecay: 0.3, ampSustain: 0, ampRelease: 0.1,
  }],
  ['Siren', 'Osc 2 alone, the LFO on its pitch at full Depth: a whole octave up and down, a siren’s wail.', {
    mixOsc1: 0, mixOsc2: 1, osc2Waveform: 'triangle', cutoff: 6000, resonance: 0.1, ampSustain: 1, lfoWaveform: 'triangle', lfoDestination: 'osc2Pitch', lfoRate: 0.4, lfoAmount: 1,
  }],
  ['Talking Filter', 'A band-pass with LFO 1 on its Cutoff and LFO 2 on its Resonance at another speed: vowels that never settle, like a robot mumbling.', {
    filterMode: 'bandpass', cutoff: 800, resonance: 0.6, ampSustain: 1, lfoWaveform: 'triangle', lfoDestination: 'cutoff', lfoRate: 2.5, lfoAmount: 0.5,
    lfo2Waveform: 'square', lfo2Destination: 'resonance', lfo2Rate: 0.7, lfo2Amount: 0.6,
  }],
  ['Stutter', 'A square LFO chopping the Filter, retriggered: every Note starts its stutter open, on the beat.', {
    waveform: 'square', mixSub: 0.4, cutoff: 300, resonance: 0.3, ampSustain: 1, lfoWaveform: 'square', lfoDestination: 'cutoff', lfoRate: 8, lfoAmount: 0.8, lfoRetrigger: 'note',
  }],
  ['Pink Surf', 'Pink Noise alone, a slow LFO sweeping the Filter: waves rolling in. Switch the Noise to White and hear the hiss come back, and the Spectrum’s floor level out.', {
    mixOsc1: 0, mixNoise: 1, noiseColour: 'pink', cutoff: 1200, resonance: 0.2,
    lfoDestination: 'cutoff', lfoRate: 0.12, lfoAmount: 0.6, ampAttack: 1.5, ampSustain: 1, ampRelease: 2.5,
  }],
  ['FM Sweep', 'LFO 1 slides Osc 2’s pitch slowly up and down while it swings Osc 1 (FM): the sidebands fan out, fold back and pass through each other. The Ideal’s circles mark where they sit with the LFO at rest.', {
    waveform: 'sine', osc2Waveform: 'sine', crossMod: 0.4, ...OPEN, lfoDestination: 'osc2Pitch', lfoRate: 0.15, lfoAmount: 0.5, ampRelease: 1,
  }],
  ['Robot', 'A saw times a low sine (Ring), Osc 2 an octave and a minor third below the Note, through a band-pass the LFO rocks: a buzzing, metallic voice, like a robot talking.', {
    osc2Waveform: 'sine', osc2Octave: -1, osc2Semitone: -3, mixOsc1: 0, mixRing: 1, filterMode: 'bandpass', cutoff: 1500, resonance: 0.25,
    lfoDestination: 'cutoff', lfoRate: 3, lfoAmount: 0.3, ampSustain: 1,
  }],
  ['Clang Alarm', 'A square LFO on FM: the sound hops between a pure sine and a full metal clang two and a half times a second, the Spectrum’s sidebands switching on and off with it.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 10, crossMod: 0.5, ...OPEN,
    lfoWaveform: 'square', lfoDestination: 'fm', lfoRate: 2.5, lfoAmount: 1,
  }],
  ['Machine Chatter', 'Both LFOs on FM: LFO 1 a slow sine, LFO 2 a fast square, together swinging FM between 0 and 100 %. The sidebands of a fifth stutter and surge like a machine talking to itself.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 7, crossMod: 0.5, ...OPEN,
    lfoDestination: 'fm', lfoRate: 0.2, lfoAmount: 0.25, lfo2Waveform: 'square', lfo2Destination: 'fm', lfo2Rate: 8, lfo2Amount: 0.25,
  }],
  ['Out of Tune', 'Osc 2 a full 50 cents off: a sour quarter-tone, beating so fast it sounds like two different Notes.', {
    osc2Detune: 50, mixOsc2: 1, cutoff: 5000, resonance: 0, ampSustain: 1,
  }],
]);

/** The next (+1) or previous (−1) Preset, wrapping around at the ends. */
export const stepPreset = (index: number, delta: number) => (index + delta + PRESETS.length) % PRESETS.length;

/** The Preset an arrow leads to from the sound named: the next or previous one, or the first or last from a Patch. */
export function presetAfter(name: string, delta: number): Preset {
  const index = PRESETS.findIndex((p) => p.name === name);
  return PRESETS[index === -1 ? (delta > 0 ? 0 : PRESETS.length - 1) : stepPreset(index, delta)];
}

/** What plays when the page opens: a share link, else last session's Patch, else Init. */
/** What a shared sound is called when its link carries no name. */
export const SHARED_NAME = 'Shared Patch';

export function initialPatch(hash: string, library: Library): { patch: Patch; name: string; shared: boolean } {
  const shared = hash.startsWith('#p=') ? readShareHash(hash) : undefined;
  if (shared) return { patch: shared.patch, name: shared.name ?? SHARED_NAME, shared: true };
  const last = library.loadCurrent();
  if (last) return { patch: last, name: 'Last session', shared: false };
  return { patch: PRESETS[0].patch, name: PRESETS[0].name, shared: false };
}
