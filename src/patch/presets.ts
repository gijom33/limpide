import type { Library } from './library';
import { defaultPatch, type Patch } from './patch';
import { patchFromShare } from './serialize';

export const PRESET_GROUPS = [
  'Start',
  'Shapes',
  'Intervals',
  'Filter lessons',
  'Bass',
  'Leads',
  'Keys & Plucks',
  'Pads',
  'Chords',
  'Movement & Effects',
] as const;
export type PresetGroup = (typeof PRESET_GROUPS)[number];

export interface Preset {
  name: string;
  group: PresetGroup;
  /** What this sound shows off: the lesson in it. */
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
]);

group('Filter lessons', [
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
  ['Velocity Bite', 'Velocity opens the Filter: tap a MIDI pad softly then hard (or click low on a piano key) and watch the Effective Cutoff jump.', {
    cutoff: 300, resonance: 0.4, filterSlope: 24, velocityCutoff: 1, filterEnvAmount: 2, filterDecay: 0.3, filterSustain: 0.2, ampSustain: 0.8,
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
  ['Wobble', 'The LFO sweeping a resonant 24 dB low-pass: watch the Response Curve and the Timeline swing in time.', {
    osc2Waveform: 'square', osc2Octave: -1, mixOsc2: 0.6,
    filterSlope: 24, cutoff: 300, resonance: 0.65,
    lfoRate: 3, lfoAmount: 0.7, ampSustain: 1, ampRelease: 0.2,
  }],
  ['Growl', 'A square LFO jumping the Filter between two places over a Sub: a stepped, talking bass.', {
    mixOsc2: 0.6, osc2Detune: -8, mixSub: 0.7, filterSlope: 24, cutoff: 350, resonance: 0.6,
    lfoWaveform: 'square', lfoRate: 4, lfoAmount: 0.5, ampSustain: 1, ampRelease: 0.15,
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
]);

group('Keys & Plucks', [
  ['Pluck', 'A pulse into a resonant 24 dB Filter that the Envelope snaps open and shut: see the Harmonics flash and vanish.', {
    waveform: 'pulse', pulseWidth: 0.3,
    filterSlope: 24, cutoff: 220, resonance: 0.5,
    filterEnvAmount: 4, filterAttack: 0.001, filterDecay: 0.22, filterSustain: 0, filterRelease: 0.2,
    ampAttack: 0.001, ampDecay: 0.45, ampSustain: 0, ampRelease: 0.3,
  }],
  ['Harp', 'A triangle plucked through a short Filter Envelope, with Key Track so high strings ring as bright as low ones.', {
    waveform: 'triangle', cutoff: 800, resonance: 0.2, keyTrack: 1, filterEnvAmount: 2, filterDecay: 0.3, filterSustain: 0,
    ampAttack: 0.001, ampDecay: 1.2, ampSustain: 0, ampRelease: 1,
  }],
  ['Clav', 'A thin pulse through a high-pass, short and velocity-sensitive: a funky, percussive key.', {
    waveform: 'pulse', pulseWidth: 0.15, filterMode: 'highpass', cutoff: 300, resonance: 0.3, velocityCutoff: 0.6,
    ampAttack: 0.001, ampDecay: 0.25, ampSustain: 0.2, ampRelease: 0.08,
  }],
  ['Organ', 'Sine, octave and Sub, like drawbars: no Envelope shape at all, just on and off, and three clean rungs in the Spectrum.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.6, mixSub: 0.5, ...OPEN, ampAttack: 0.005, ampRelease: 0.03,
  }],
  ['Electric Piano', 'A triangle with a little octave sine: soft attack, long decay, and Velocity for a brighter strike.', {
    waveform: 'triangle', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.35, cutoff: 1800, velocityCutoff: 0.7, keyTrack: 0.5,
    ampAttack: 0.003, ampDecay: 2, ampSustain: 0.15, ampRelease: 0.5,
  }],
  ['Marimba', 'A sine and a square two octaves up, gone almost at once: the bright tick of the mallet, then the round tone.', {
    waveform: 'sine', osc2Waveform: 'square', osc2Octave: 2, mixOsc2: 0.25, cutoff: 3000, filterEnvAmount: -2, filterDecay: 0.05, filterSustain: 0,
    ampAttack: 0.001, ampDecay: 0.6, ampSustain: 0, ampRelease: 0.4,
  }],
  ['Glass Keys', 'Two sines a twelfth apart with a slow decay: bell-like, and the Scope shows the 3:1 pattern fading together.', {
    waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 7, osc2Detune: 3, mixOsc2: 0.7, ...OPEN,
    ampAttack: 0.002, ampDecay: 2.5, ampSustain: 0, ampRelease: 1.5,
  }],
]);

group('Pads', [
  ['Pad', 'Slow Envelopes swell the sound in and out, detuned saws and a breath of Noise thicken it, and the LFO keeps the Filter moving.', {
    osc2Detune: -14, mixOsc2: 0.8, mixNoise: 0.05,
    cutoff: 900, resonance: 0.2, filterEnvAmount: 1.2, filterAttack: 1.2, filterDecay: 1.5, filterSustain: 0.6, filterRelease: 1.5,
    ampAttack: 0.9, ampDecay: 1, ampSustain: 0.8, ampRelease: 1.8,
    lfoRate: 0.3, lfoAmount: 0.15,
  }],
  ['PWM Strings', 'Two slowly modulated pulses: the Pulse Width sweep gives the chorus-like shimmer of a string machine.', {
    waveform: 'pulse', pulseWidth: 0.4, osc2Waveform: 'pulse', osc2PulseWidth: 0.6, osc2Detune: 7, mixOsc2: 0.8, cutoff: 3000, resonance: 0.1,
    lfoDestination: 'pulseWidth', lfoRate: 0.6, lfoAmount: 0.6, keyTrack: 0.5, ampAttack: 0.4, ampSustain: 0.9, ampRelease: 1.2,
  }],
  ['Warm Pad', 'Detuned saws over a Sub, a low Cutoff that opens slowly: dark and wide.', {
    osc2Detune: 12, mixOsc2: 0.9, mixSub: 0.4, cutoff: 600, resonance: 0.15, filterEnvAmount: 1.5, filterAttack: 2, filterDecay: 2, filterSustain: 0.5,
    filterRelease: 2, ampAttack: 1.2, ampSustain: 0.9, ampRelease: 2.5, keyTrack: 0.4,
  }],
  ['Brass Swell', 'The Filter Envelope opens a little slower than the Amp: each Note starts dark and blooms bright, like a horn.', {
    osc2Detune: 6, mixOsc2: 0.6,
    cutoff: 500, resonance: 0.25, filterEnvAmount: 2.5, filterAttack: 0.12, filterDecay: 0.6, filterSustain: 0.55, filterRelease: 0.3,
    ampAttack: 0.04, ampDecay: 0.3, ampSustain: 0.85, ampRelease: 0.25, keyTrack: 0.5,
  }],
  ['Choir', 'Detuned saws through a band-pass, with a touch of Noise for breath: a vowel-like “aah”.', {
    osc2Detune: 10, mixOsc2: 1, mixNoise: 0.08, filterMode: 'bandpass', cutoff: 900, resonance: 0.55, keyTrack: 0.3,
    lfoRate: 0.2, lfoAmount: 0.1, ampAttack: 0.6, ampSustain: 0.9, ampRelease: 1.5,
  }],
  ['Sweep Pad', 'A Filter Envelope seconds long: hold a Note and watch the Effective Cutoff climb across the whole Timeline.', {
    osc2Detune: -9, mixOsc2: 0.8, filterSlope: 24, cutoff: 150, resonance: 0.5, filterEnvAmount: 5, filterAttack: 4, filterDecay: 4,
    filterSustain: 0.4, filterRelease: 3, ampAttack: 0.5, ampSustain: 1, ampRelease: 3,
  }],
  ['Dark Drone', 'Sub and a low saw under a slowly breathing Filter: a drone to watch the LFO draw on the Timeline.', {
    mixSub: 1, osc2Octave: -1, mixOsc2: 0.5, cutoff: 250, resonance: 0.5, filterSlope: 24, lfoWaveform: 'triangle', lfoRate: 0.1, lfoAmount: 0.6,
    ampAttack: 2, ampSustain: 1, ampRelease: 4,
  }],
]);

// Several Voices: chords for playing. The Viewers follow the newest Note (ADR-0007), so every one of these also
// shows one Note cleanly while the others sound.
group('Chords', [
  ['Chord Pad', 'Four Voices of detuned saws under a slow Filter: hold a chord, and the Viewers show only the Note you played last.', {
    voices: 4, osc2Detune: -12, mixOsc2: 0.8,
    cutoff: 1200, resonance: 0.15, filterEnvAmount: 1, filterAttack: 1.5, filterDecay: 2, filterSustain: 0.5, filterRelease: 2,
    ampAttack: 0.8, ampDecay: 1, ampSustain: 0.85, ampRelease: 2, lfoRate: 0.25, lfoAmount: 0.12,
  }],
  ['Poly Keys', 'An electric piano on four Voices: Velocity brightens each strike, and the Timeline draws the newest Note’s Envelope while the others ring on.', {
    voices: 4, waveform: 'triangle', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.3, cutoff: 2200, velocityCutoff: 0.7, keyTrack: 0.6,
    ampAttack: 0.003, ampDecay: 1.8, ampSustain: 0.2, ampRelease: 0.6,
  }],
  ['Chord Organ', 'Drawbar sines on four Voices: every held key sounds at once with no Envelope shape at all, so a chord is simply on and off.', {
    voices: 4, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.5, mixSub: 0.5, ...OPEN, ampAttack: 0.005, ampRelease: 0.03,
  }],
  ['Poly Pluck', 'A snapping Filter Envelope on four Voices: strum a chord and each Note gets its own flash of Harmonics; Key Track keeps the high strings bright.', {
    voices: 4, waveform: 'pulse', pulseWidth: 0.3, cutoff: 500, resonance: 0.4, filterSlope: 24, filterEnvAmount: 3, filterDecay: 0.18, filterSustain: 0, keyTrack: 0.8,
    ampAttack: 0.001, ampDecay: 0.5, ampSustain: 0, ampRelease: 0.3,
  }],
  ['Strings', 'A string section: four Voices of slowly modulated pulses with a soft attack. Hold a chord and watch the Pulse Width shimmer on the newest Note.', {
    voices: 4, waveform: 'pulse', pulseWidth: 0.5, osc2Waveform: 'pulse', osc2PulseWidth: 0.45, osc2Detune: 8, mixOsc2: 0.8, cutoff: 3500, resonance: 0.05,
    lfoDestination: 'pulseWidth', lfoRate: 0.7, lfoAmount: 0.5, ampAttack: 0.4, ampDecay: 0.5, ampSustain: 0.9, ampRelease: 1.2,
  }],
  ['Brass Section', 'Horns on four Voices: each Note blooms from dark to bright as its Filter Envelope opens, and further for a harder hit.', {
    voices: 4, osc2Detune: 6, mixOsc2: 0.7, cutoff: 700, resonance: 0.1, filterSlope: 24,
    filterEnvAmount: 2.5, filterAttack: 0.12, filterDecay: 0.5, filterSustain: 0.6, filterRelease: 0.3, velocityCutoff: 0.5,
    ampAttack: 0.06, ampDecay: 0.3, ampSustain: 0.85, ampRelease: 0.35,
  }],
  ['Vibes', 'A vibraphone: sine bars with a little vibrato and a long decay, on four Voices so chords ring together.', {
    voices: 4, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 2, mixOsc2: 0.2, cutoff: 6000, keyTrack: 0.5,
    ampAttack: 0.001, ampDecay: 1.6, ampSustain: 0, ampRelease: 1, lfoDestination: 'pitch', lfoRate: 5, lfoAmount: 0.06,
  }],
  ['Duo Lead', 'Two Voices only: fifths and octaves under one hand, and a third Note takes the oldest Voice. The Viewers follow the newest.', {
    voices: 2, osc2Detune: 7, mixOsc2: 0.9, cutoff: 2500, resonance: 0.2, keyTrack: 0.4, velocityCutoff: 0.3,
    ampAttack: 0.01, ampDecay: 0.2, ampSustain: 0.8, ampRelease: 0.3, lfoDestination: 'pitch', lfoRate: 5.5, lfoAmount: 0.08,
  }],
  ['Bell Chords', 'Twelfth-stacked sines on four Voices with a long decay: a chord of bells, each Note fading at its own pace while the Timeline shows the newest.', {
    voices: 4, waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 7, osc2Detune: 4, mixOsc2: 0.6, ...OPEN,
    ampAttack: 0.002, ampDecay: 3, ampSustain: 0, ampRelease: 2,
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
  ['Laser', 'A Filter Envelope that falls fast from far above: each Note zaps down. Look at the Effective Cutoff dive on the Timeline.', {
    waveform: 'square', filterSlope: 24, cutoff: 200, resonance: 0.85, filterEnvAmount: 5, filterAttack: 0.001, filterDecay: 0.15,
    filterSustain: 0, ampAttack: 0.001, ampDecay: 0.3, ampSustain: 0, ampRelease: 0.1,
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
export function initialPatch(hash: string, library: Library): { patch: Patch; name: string } {
  const shared = hash.startsWith('#p=') ? patchFromShare(hash.slice(3)) : undefined;
  if (shared) return { patch: shared, name: 'Shared Patch' };
  const last = library.loadCurrent();
  if (last) return { patch: last, name: 'Last session' };
  return { patch: PRESETS[0].patch, name: PRESETS[0].name };
}
