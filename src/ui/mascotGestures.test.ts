import { describe, expect, it } from 'vitest';
import { defaultPatch, type Patch } from '../patch/patch';
import { gesturesOf, looksOf } from './mascotGestures';

const init = defaultPatch();
const turned = (change: Partial<Patch>, by: Parameters<typeof gesturesOf>[2] = 'hand') => gesturesOf(init, { ...init, ...change }, by);

describe("the mascot's answer to a control turned (issue 115)", () => {
  it('walks right as the Cutoff opens and left as it closes', () => {
    expect(turned({ cutoff: init.cutoff * 2 })).toEqual(['brighter']);
    expect(turned({ cutoff: init.cutoff / 2 })).toEqual(['darker']);
  });

  it('hops for a higher pitch, crouches for a lower one', () => {
    expect(turned({ osc1Octave: 1 })).toEqual(['higher']);
    expect(turned({ osc2Semitone: -5 })).toEqual(['lower']);
  });

  it('stretches with an Envelope fader, shivers with Resonance, splashes with Volume up, winces with it down', () => {
    expect(turned({ ampSustain: 0.2 })).toEqual(['shorter']);
    expect(turned({ filterAttack: 2 })).toEqual(['taller']);
    expect(turned({ resonance: 0.8 })).toEqual(['rougher']);
    expect(turned({ volume: 0.2 })).toEqual(['quieter']);
    expect(turned({ mixOsc2: 0.7 })).toEqual(['louder']);
  });

  it('wiggles with an LFO, slides with Glide, glances at a choice, hops at a Preset', () => {
    expect(turned({ lfo2Rate: 9 })).toEqual(['twirl']);
    expect(turned({ glide: 0.4 })).toEqual(['slide']);
    expect(turned({ waveform: 'square', filterMode: 'highpass' })).toEqual(['look']);
    expect(turned({ filterSlope: 24 })).toEqual(['perform']);
    expect(turned({ cutoff: 300, resonance: 0.9 }, 'load')).toEqual(['new']);
  });

  it('answers the Demo as it does a hand, and does nothing for the keyboard octave', () => {
    expect(turned({ cutoff: init.cutoff * 2 }, 'demo')).toEqual(['brighter']);
    expect(turned({ keyboardOctave: 2 })).toEqual([]);
  });
});

describe("what some controls make of the mascot's look (issue 127)", () => {
  it('Detune splits it only while both Oscillators are in the Mixer', () => {
    expect(looksOf({ ...init, mixOsc1: 1, mixOsc2: 1, osc2Detune: 12 }, 0).detune).toBe(12);
    expect(looksOf({ ...init, mixOsc1: 1, mixOsc2: 0, osc2Detune: 12 }, 0).detune).toBe(0);
  });

  it('the Filter fully closed, and the Noise only while something is heard', () => {
    expect(looksOf({ ...init, cutoff: 20 }, 0).closed).toBe(true);
    expect(looksOf({ ...init, cutoff: 40 }, 0).closed).toBe(false);
    expect(looksOf({ ...init, mixNoise: 0.6 }, 0.5).noise).toBe(0.6);
    expect(looksOf({ ...init, mixNoise: 0.6 }, 0).noise).toBe(0);
  });
});

