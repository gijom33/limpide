import { describe, expect, it } from 'vitest';
import { describePatch, MAX_WORDS } from './describe';
import { defaultPatch, type Patch } from './patch';
import { PRESETS } from './presets';

const preset = (name: string) => PRESETS.find((p) => p.name === name)!.patch;
const words = (phrase: string) => phrase.split(' ').length;

describe('A Patch in plain words (issue 123)', () => {
  it('says what Init is: one saw, its Harmonics above the 5th softened by the Filter at 2 kHz, held at its Sustain', () => {
    expect(describePatch(defaultPatch())).toBe('a saw, softly filtered, sustained');
  });

  // Each phrase beside what makes it true, in the Patch and the engine. The Note heard is the G in the middle of the
  // Patch's keys: G4 (392 Hz), or G2 (98 Hz) for a bass that opens on C2.
  it.each([
    // A sine alone, the Filter open: one Harmonic, nothing for a Filter to shape.
    ['Pure Sine', 'a pure sine, sustained'],
    // A square through a Filter at 20 kHz: every Harmonic to the 50th passes.
    ['Hollow Square', 'a bright square, sustained'],
    // Osc 2 the same saw 40 cents up, both faders up.
    ['Fast Beats', 'two detuned saws, sustained'],
    // Osc 1's fader down, Ring full: only the product sounds; Sustain 0 and a 1.8 s Decay.
    ['Ring Bell', 'two sines through Ring, ringing out'],
    // Resonance at 100 %: the Filter sings at the Cutoff.
    ['Self-Oscillation', 'a saw, through a singing Filter, sustained'],
    // A 24 dB high-pass at 800 Hz on a 392 Hz saw: its fundamental cut.
    ['High-pass Buzz', 'a saw, thinned by a high-pass, sustained'],
    // 220 Hz under a 392 Hz pulse at the Sustain (0), opened 4 octaves at the strike; the Amp's Sustain 0, Decay 0.45 s.
    ['Pluck', 'a pulse, muffled, opening on each Note, plucked'],
    // The Amp's Attack 1.5 s.
    ['Swell', 'a bright saw, a slow swell'],
    // LFO 1 on Pitch at 2 Hz, 30 %: 30 cents each way.
    ['Slow Vibrato', 'a saw, sustained, with vibrato'],
    // A saw over a square an octave down at G2 (98 Hz), the Cutoff 280 Hz (under the 3rd Harmonic), the Envelope 2.5
    // octaves above the Sustain.
    ['Bass', 'a saw with a square below, filtered low, opening on each Note'],
    // Resonance 65 % on a 24 dB low-pass at 300 Hz (G2's 3rd Harmonic), LFO 1 sweeping it ±1.4 octaves 3 times a
    // second; Osc 2's square gives way so the wobble fits.
    ['Wobble', 'a saw, through a low resonant Filter, sustained, with a wobble'],
    // 14 cents apart, 900 Hz on 392 Hz, Attack 0.9 s, LFO 1 on the Cutoff at 0.3 Hz, 15 %: ±0.3 octave.
    ['Pad', 'two detuned saws, filtered low, swelling in, with a slow Filter sweep'],
    // A square LFO on Volume at 8 Hz, full Depth: on, off.
    ['Trance Gate', 'two detuned saws, softly filtered, sustained, with a rhythmic chop'],
    // FM 35 % (sidebands), a 200 Hz Cutoff under the 392 Hz Note, Velocity full, Sustain 10 % after a 2.5 s Decay.
    ['Tine Piano', 'a sine with FM, muffled, brighter played harder, fading slowly'],
    // No Oscillator, Noise into a Filter at full Resonance whose Envelope throws it 3 octaves up at the strike.
    ['Kick', 'Noise, through a singing Filter, opening on each Note, plucked'],
  ])('%s: “%s”', (name, phrase) => {
    expect(describePatch(preset(name))).toBe(phrase);
  });

  it('is at most twelve words for every Preset, and names something for each', () => {
    for (const p of PRESETS) {
      const phrase = describePatch(p.patch);
      expect(words(phrase), `${p.name}: ${phrase}`).toBeLessThanOrEqual(MAX_WORDS);
      expect(phrase.length, p.name).toBeGreaterThan(0);
    }
  });

  it('names no Filter where the source has no Harmonics for it to shape', () => {
    const sine: Patch = { ...defaultPatch(), waveform: 'sine', cutoff: 300, filterEnvAmount: 3, filterSustain: 0 };
    expect(describePatch(sine)).toBe('a pure sine, sustained');
    // A saw's Harmonics all pass a Cutoff twenty times above the Note: nothing to say of the Filter but that it is open.
    expect(describePatch({ ...defaultPatch(), cutoff: 20000 })).toBe('a bright saw, sustained');
    expect(describePatch({ ...defaultPatch(), cutoff: 300 })).toBe('a saw, muffled, sustained');
  });

  it('names an LFO only where its Depth is heard', () => {
    const vibrato = (amount: number) => describePatch({ ...defaultPatch(), lfoDestination: 'pitch', lfoAmount: amount });
    expect(vibrato(0)).toBe('a saw, softly filtered, sustained');
    expect(vibrato(0.02)).toBe('a saw, softly filtered, sustained'); // 2 cents each way
    expect(vibrato(0.2)).toBe('a saw, softly filtered, sustained, with vibrato');
    // The Pulse Width moved on a saw changes nothing heard; on a pulse it does.
    const pwm: Patch = { ...defaultPatch(), lfoDestination: 'pulseWidth', lfoAmount: 0.8 };
    expect(describePatch(pwm)).toBe('a saw, softly filtered, sustained');
    expect(describePatch({ ...pwm, waveform: 'pulse', pulseWidth: 0.5 })).toBe('a pulse, softly filtered, sustained, with a moving Pulse Width');
    // An LFO on FM with FM at 0 has no room to swing it.
    expect(describePatch({ ...defaultPatch(), lfoDestination: 'fm', lfoAmount: 1 })).toBe('a saw, softly filtered, sustained');
    // A high-pass swung an octave each way from 20 Hz stays under a 392 Hz fundamental: it shapes nothing.
    const swung: Patch = { ...defaultPatch(), lfoDestination: 'cutoff', lfoAmount: 0.5 };
    expect(describePatch({ ...swung, filterMode: 'highpass', cutoff: 20 })).toBe('a saw, sustained');
    expect(describePatch({ ...swung, filterMode: 'highpass', cutoff: 800 })).toBe('a saw, thinned by a high-pass, sustained, with a wobble');
    // Detune moved on an Osc 2 heard only through FM beats against nothing.
    const fm: Patch = { ...defaultPatch(), waveform: 'sine', osc2Waveform: 'sine', crossMod: 0.5, cutoff: 20000 };
    expect(describePatch({ ...fm, lfoDestination: 'detune', lfoAmount: 0.5 })).toBe('a sine with FM, sustained');
  });

  it('names FM only on the Oscillator it moves, Osc 1, when that is named', () => {
    // Osc 1 below a level heard beside Osc 2: the saw heard is Osc 2's, which FM leaves alone.
    const quietOne: Patch = { ...defaultPatch(), mixOsc1: 0.05, mixOsc2: 1, crossMod: 0.5 };
    expect(describePatch(quietOne)).toBe('a saw, softly filtered, sustained');
    expect(describePatch({ ...defaultPatch(), crossMod: 0.01 })).toBe('a saw, softly filtered, sustained');
  });

  it('names a square Sub’s Harmonics: no pure sine above it, and a Filter that shapes it', () => {
    expect(describePatch(preset('Rubber'))).toBe('a sine with a Sub, softly filtered, opening on each Note, accented');
  });

  it('names what sounds when every source is quiet, not a Noise that is down', () => {
    expect(describePatch({ ...defaultPatch(), mixOsc1: 0.08 })).toBe('a saw, softly filtered, sustained');
    // The Sub an octave under G4: about ten of its Harmonics under 2 kHz, the Filter not named.
    expect(describePatch({ ...defaultPatch(), mixOsc1: 0, mixSub: 0.05 })).toBe('a square Sub, sustained');
  });

  it('says so when nothing sounds', () => {
    expect(describePatch({ ...defaultPatch(), mixOsc1: 0 })).toBe('silent: every Mixer fader is down');
    expect(describePatch({ ...defaultPatch(), volume: 0 })).toBe('silent: the Volume is down');
  });
});
