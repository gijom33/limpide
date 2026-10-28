import { describe, expect, it } from 'vitest';
import { defaultPatch, type Patch } from '../patch/patch';
import { cutoffReach, detuneReach, keyTrackOctaves, lfoCutoffReach, pulseWidthReach, resonanceReach, semitoneReach, volumeReach } from './reach';

const patch = (changes: Partial<Patch>): Patch => ({ ...defaultPatch(), cutoff: 1000, ...changes });

describe('how far the Filter Envelope and Velocity reach the Cutoff (its white and grey rings)', () => {
  it('reaches nowhere while neither moves it: no ring, whatever the LFOs do (they have their own ring)', () => {
    expect(cutoffReach(patch({}))).toBeNull();
    expect(cutoffReach(patch({ lfoDestination: 'cutoff', lfoAmount: 1, keyTrack: 1 }))).toBeNull();
  });

  it('the Filter Envelope reaches Amount octaves one way: up when positive, down when negative', () => {
    expect(cutoffReach(patch({ filterEnvAmount: 2 }))).toEqual({ lo: 1000, hi: 4000, envelope: [1000, 4000] });
    expect(cutoffReach(patch({ filterEnvAmount: -1 }))).toEqual({ lo: 500, hi: 1000, envelope: [500, 1000] });
  });

  it('Velocity reaches as far as the hardest strike could open it, past the Envelope’s sweep', () => {
    expect(cutoffReach(patch({ velocityCutoff: 0.5 }))).toEqual({ lo: 1000, hi: 2000 });
    expect(cutoffReach(patch({ filterEnvAmount: 1, velocityCutoff: 0.5 }))).toEqual({ lo: 1000, hi: 4000, envelope: [1000, 2000] });
  });

  it('never leaves the range the Filter can reach', () => {
    expect(cutoffReach(patch({ cutoff: 15000, filterEnvAmount: 5 }))).toMatchObject({ lo: 15000, hi: 20000 });
  });
});

describe('how far the LFOs reach the Cutoff (its blue ring)', () => {
  it('an LFO on the Cutoff swings it two octaves each way at full Depth, so half Depth reaches one octave', () => {
    const reach = lfoCutoffReach(patch({ lfoDestination: 'cutoff', lfoAmount: 0.5, filterEnvAmount: 2 }))!;
    expect(reach.lo).toBeCloseTo(500);
    expect(reach.hi).toBeCloseTo(2000);
  });

  it('an LFO aimed elsewhere does not reach the Cutoff', () => {
    expect(lfoCutoffReach(patch({ lfoDestination: 'pitch', lfoAmount: 1 }))).toBeNull();
  });

  it('two LFOs on the Cutoff add their reach', () => {
    const reach = lfoCutoffReach(patch({ lfoDestination: 'cutoff', lfoAmount: 0.5, lfo2Destination: 'cutoff', lfo2Amount: 0.25 }))!;
    expect(reach.lo).toBeCloseTo(1000 / 2 ** 1.5);
    expect(reach.hi).toBeCloseTo(1000 * 2 ** 1.5);
  });
});

describe('how far the LFO reaches a Pulse Width (the modulation ring)', () => {
  it('reaches nowhere unless the LFO is aimed at Pulse Width with some Depth', () => {
    expect(pulseWidthReach(patch({ lfoDestination: 'cutoff', lfoAmount: 1 }), 0.5)).toBeNull();
    expect(pulseWidthReach(patch({ lfoDestination: 'pulseWidth', lfoAmount: 0 }), 0.5)).toBeNull();
  });

  it('swings it 40 points each way at full Depth', () => {
    const reach = pulseWidthReach(patch({ lfoDestination: 'pulseWidth', lfoAmount: 0.5 }), 0.5)!;
    expect(reach.lo).toBeCloseTo(0.3);
    expect(reach.hi).toBeCloseTo(0.7);
  });

  it('as the sound does, swings no further than the narrowest pulse allows, each way alike', () => {
    const reach = pulseWidthReach(patch({ lfoDestination: 'pulseWidth', lfoAmount: 1 }), 0.15)!;
    expect(reach.lo).toBeCloseTo(0.05);
    expect(reach.hi).toBeCloseTo(0.25);
  });
});

describe('how far the LFOs reach the new destinations', () => {
  it('Resonance: around the knob, as far as it can go each way alike', () => {
    expect(resonanceReach(patch({ resonance: 0.5 }))).toBeNull();
    const reach = resonanceReach(patch({ resonance: 0.3, lfo2Destination: 'resonance', lfo2Amount: 1 }))!;
    expect([reach.lo, reach.hi]).toEqual([expect.closeTo(0), expect.closeTo(0.6)]);
  });

  it('Osc 2 Pitch on the Semitone knob: twelve semitones each way at full Depth', () => {
    const reach = semitoneReach(patch({ osc2Semitone: 2, lfoDestination: 'osc2Pitch', lfoAmount: 0.5 }))!;
    expect([reach.lo, reach.hi]).toEqual([-4, 8]);
  });

  it('Detune: 50 cents each way at full Depth', () => {
    const reach = detuneReach(patch({ osc2Detune: 10, lfoDestination: 'detune', lfoAmount: 0.2 }))!;
    expect([reach.lo, reach.hi]).toEqual([0, 20]);
    expect(detuneReach(patch({ lfoDestination: 'osc2Pitch', lfoAmount: 1 }))).toBeNull();
  });
});

describe('how far the LFOs reach the Volume knob (issue 62)', () => {
  it('dips from the knob’s value by twice the swing: to silence at full Depth, halfway down at half', () => {
    const patch = { ...defaultPatch(), volume: 0.8, lfoDestination: 'volume', lfoAmount: 1 } as const;
    expect(volumeReach(patch)).toMatchObject({ lo: expect.closeTo(0), hi: 0.8 });
    expect(volumeReach({ ...patch, lfoAmount: 0.5 })).toMatchObject({ lo: expect.closeTo(0.4), hi: 0.8 });
    expect(volumeReach({ ...patch, lfoDestination: 'cutoff' })).toBeNull();
  });
});

describe('how far Key Track can take the Cutoff over a span of Notes (the grey Key Track rings)', () => {
  it('down for Notes below C4, up for Notes above, in proportion to Key Track', () => {
    expect(keyTrackOctaves(patch({ keyTrack: 1 }), 48, 84)).toEqual([-1, 2]);
    expect(keyTrackOctaves(patch({ keyTrack: 0.5 }), 48, 84)).toEqual([-0.5, 1]);
  });

  it('one way only when every Note is on one side of C4, and nowhere with Key Track off', () => {
    expect(keyTrackOctaves(patch({ keyTrack: 1 }), 60, 72)).toEqual([0, 1]);
    expect(keyTrackOctaves(patch({ keyTrack: 1 }), 36, 48)).toEqual([-2, 0]);
    expect(keyTrackOctaves(patch({ keyTrack: 0 }), 36, 84)).toEqual([0, 0]);
  });
});
