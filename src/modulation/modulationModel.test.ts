import { describe, expect, it } from 'vitest';
import { defaultPatch, setParam } from '../patch/patch';
import { destinationSwings, effectiveCutoff, effectiveResonance, effectiveVolume, osc2Cents, soundingPitch, tremolo } from './modulationModel';

describe('Modulation model: Effective Cutoff', () => {
  it('is the Cutoff itself while nothing modulates the Filter', () => {
    expect(effectiveCutoff(setParam(defaultPatch(), 'cutoff', 873))).toBe(873);
  });

  it('never leaves the audible range the Filter can reach', () => {
    expect(effectiveCutoff({ ...defaultPatch(), cutoff: 5 })).toBe(20);
    expect(effectiveCutoff({ ...defaultPatch(), cutoff: 30000 })).toBe(20000);
  });
});

describe('Effective Cutoff with the Filter Envelope', () => {
  const patch = { ...defaultPatch(), cutoff: 500, filterEnvAmount: 2 };

  it('moves up by the Envelope Amount, in octaves, when the Filter Envelope is fully open', () => {
    expect(effectiveCutoff(patch, 1)).toBeCloseTo(2000);
  });

  it('moves proportionally in octaves for partial Envelope levels', () => {
    expect(effectiveCutoff(patch, 0.5)).toBeCloseTo(1000);
    expect(effectiveCutoff(patch, 0)).toBe(500);
  });

  it('moves down for a negative Envelope Amount', () => {
    expect(effectiveCutoff({ ...patch, filterEnvAmount: -1 }, 1)).toBeCloseTo(250);
  });

  it('still stays within the audible range', () => {
    expect(effectiveCutoff({ ...patch, cutoff: 8000, filterEnvAmount: 5 }, 1)).toBe(20000);
  });
});

describe('Effective Cutoff with the LFO', () => {
  const patch = { ...defaultPatch(), cutoff: 1000, lfoAmount: 0.5, lfoDestination: 'cutoff' as const };

  it('swings up to two octaves either way at full Amount (one octave at half)', () => {
    expect(effectiveCutoff(patch, 0, [1])).toBeCloseTo(2000);
    expect(effectiveCutoff(patch, 0, [-1])).toBeCloseTo(500);
  });

  it('adds to the Filter Envelope, in octaves', () => {
    expect(effectiveCutoff({ ...patch, filterEnvAmount: 1 }, 1, [1])).toBeCloseTo(4000);
  });

  it('leaves the Cutoff alone when the LFO is aimed elsewhere', () => {
    expect(effectiveCutoff({ ...patch, lfoDestination: 'pitch' }, 0, [1])).toBe(1000);
  });
});

describe('Effective Cutoff with Velocity', () => {
  const patch = { ...defaultPatch(), cutoff: 500, velocityCutoff: 0.5 };

  it('opens the Filter by up to two octaves for the hardest hit (one octave at half amount)', () => {
    expect(effectiveCutoff(patch, 0, [], 1)).toBeCloseTo(1000);
    expect(effectiveCutoff({ ...patch, velocityCutoff: 1 }, 0, [], 1)).toBeCloseTo(2000);
  });

  it('opens it less for softer hits', () => {
    expect(effectiveCutoff({ ...patch, velocityCutoff: 1 }, 0, [], 0.5)).toBeCloseTo(1000);
  });

  it('changes nothing while the amount is zero (the default)', () => {
    expect(effectiveCutoff(defaultPatch(), 0, [], 1)).toBe(defaultPatch().cutoff);
  });
});

describe('Effective Cutoff with Key Track', () => {
  const patch = { ...defaultPatch(), cutoff: 1000, keyTrack: 1 };

  it('follows the Note an octave per octave at full Key Track, from C4', () => {
    expect(effectiveCutoff(patch, 0, [], 0, 60)).toBeCloseTo(1000); // C4: no change
    expect(effectiveCutoff(patch, 0, [], 0, 72)).toBeCloseTo(2000); // C5
    expect(effectiveCutoff(patch, 0, [], 0, 48)).toBeCloseTo(500); // C3
  });

  it('follows half as far at 50 %, and through fractions of a semitone during a Glide', () => {
    expect(effectiveCutoff({ ...patch, keyTrack: 0.5 }, 0, [], 0, 84)).toBeCloseTo(2000);
    expect(effectiveCutoff(patch, 0, [], 0, 66)).toBeCloseTo(1000 * 2 ** 0.5); // half an octave up
  });

  it('changes nothing at 0 %, whatever the Note', () => {
    expect(effectiveCutoff({ ...patch, keyTrack: 0 }, 0, [], 0, 96)).toBe(1000);
  });

  it('adds to the Envelope, in octaves', () => {
    expect(effectiveCutoff({ ...patch, filterEnvAmount: 1 }, 1, [], 0, 72)).toBeCloseTo(4000);
  });
});

describe('two LFOs', () => {
  const both = { ...defaultPatch(), cutoff: 1000, lfoDestination: 'cutoff', lfoAmount: 0.5, lfo2Destination: 'cutoff', lfo2Amount: 0.5 } as const;

  it('aimed at the same destination, add their swings: one octave each', () => {
    expect(effectiveCutoff(both, 0, [1, 1])).toBeCloseTo(4000);
    expect(effectiveCutoff(both, 0, [1, -1])).toBeCloseTo(1000);
    expect(effectiveCutoff({ ...both, lfo2Destination: 'pitch' }, 0, [1, 1])).toBeCloseTo(2000);
  });

  it('together swing no further than the destination allows, sharing what room there is by their Depths', () => {
    const pulse = { ...defaultPatch(), lfoDestination: 'pulseWidth', lfoAmount: 1, lfo2Destination: 'pulseWidth', lfo2Amount: 0.5 } as const;
    // 40 + 20 points wanted around 50 %, 45 allowed each way: three quarters of each.
    const [one, two] = destinationSwings(pulse, 'pulseWidth', 0.5);
    expect(one).toBeCloseTo(0.3);
    expect(two).toBeCloseTo(0.15);
    expect(destinationSwings(pulse, 'cutoff')).toEqual([0, 0]);
  });

  it('LFO 2 on Pitch makes vibrato as LFO 1 does', () => {
    expect(soundingPitch({ ...defaultPatch(), lfo2Destination: 'pitch', lfo2Amount: 1 }, 60, [0, -1])).toBeCloseTo(59);
  });
});

describe('the new LFO destinations', () => {
  it('Resonance: swings around the knob, at full Depth across the whole range, as far as it can go each way alike', () => {
    const patch = { ...defaultPatch(), resonance: 0.5, lfoDestination: 'resonance', lfoAmount: 0.5 } as const;
    expect(effectiveResonance(patch, [1])).toBeCloseTo(1);
    expect(effectiveResonance(patch, [-1])).toBeCloseTo(0);
    expect(effectiveResonance({ ...patch, resonance: 0.2, lfoAmount: 1 }, [1])).toBeCloseTo(0.4);
    expect(effectiveResonance({ ...patch, lfoDestination: 'cutoff' }, [1])).toBe(0.5);
  });

  it('Osc 2 Pitch: an octave each way at full Depth, on top of Octave, Semitone and Detune; Detune: 50 cents', () => {
    const patch = { ...defaultPatch(), osc2Semitone: 7, osc2Detune: 10, lfoDestination: 'osc2Pitch', lfoAmount: 1 } as const;
    expect(osc2Cents(patch, [0])).toBe(710);
    expect(osc2Cents(patch, [1])).toBeCloseTo(1910);
    expect(osc2Cents({ ...patch, lfoDestination: 'detune', lfoAmount: 0.5 }, [-1])).toBeCloseTo(685);
  });
});

describe('Volume: tremolo (issue 53)', () => {
  const patch = { ...defaultPatch(), lfoDestination: 'volume', lfoAmount: 1 } as const;
  it('is full volume while no LFO is aimed at it', () => {
    expect(tremolo(defaultPatch(), [-1, -1])).toBe(1);
  });
  it('pulls the volume down from where the Envelope has it, never above: to silence at the wave’s foot at full Depth', () => {
    expect(tremolo(patch, [1])).toBeCloseTo(1);
    expect(tremolo(patch, [0])).toBeCloseTo(0.5);
    expect(tremolo(patch, [-1])).toBeCloseTo(0);
    expect(tremolo({ ...patch, lfoAmount: 0.5 }, [-1])).toBeCloseTo(0.5);
  });
  it('two LFOs on Volume share the dip, never below silence', () => {
    const both = { ...patch, lfo2Destination: 'volume', lfo2Amount: 1 } as const;
    expect(tremolo(both, [-1, -1])).toBeCloseTo(0);
    expect(tremolo(both, [1, 1])).toBeCloseTo(1);
    expect(tremolo({ ...both, lfoAmount: 0.4, lfo2Amount: 0.2 }, [-1, -1])).toBeCloseTo(0.4);
  });
});

describe('the Volume knob (issue 62)', () => {
  it('scales the Amp, the tremolo dipping from its value', () => {
    expect(effectiveVolume({ ...defaultPatch(), volume: 0.5 })).toBe(0.5);
    const tremoloed = { ...defaultPatch(), volume: 0.5, lfoDestination: 'volume', lfoAmount: 1 } as const;
    expect(effectiveVolume(tremoloed, [1])).toBeCloseTo(0.5);
    expect(effectiveVolume(tremoloed, [-1])).toBeCloseTo(0);
  });
  it('is at full by default, so no Preset changes', () => {
    expect(defaultPatch().volume).toBe(1);
  });
});

