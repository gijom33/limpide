import { describe, expect, it } from 'vitest';
import { defaultPatch, type Patch } from '../patch/patch';
import { cutoffReach, pulseWidthReach } from './reach';

const patch = (changes: Partial<Patch>): Patch => ({ ...defaultPatch(), cutoff: 1000, ...changes });

describe('how far modulation reaches the Cutoff (the modulation ring)', () => {
  it('reaches nowhere while nothing modulates it: no ring', () => {
    expect(cutoffReach(patch({}), null)).toBeNull();
  });

  it('an LFO on the Cutoff swings it two octaves each way at full Depth, so half Depth reaches one octave', () => {
    const reach = cutoffReach(patch({ lfoDestination: 'cutoff', lfoAmount: 0.5 }), null)!;
    expect(reach.lo).toBeCloseTo(500);
    expect(reach.hi).toBeCloseTo(2000);
    expect(reach.shares).toEqual({ lfo: [expect.closeTo(500), expect.closeTo(2000)] });
  });

  it('an LFO aimed elsewhere does not reach the Cutoff', () => {
    expect(cutoffReach(patch({ lfoDestination: 'pitch', lfoAmount: 1 }), null)).toBeNull();
  });

  it('the Filter Envelope reaches Amount octaves one way: up when positive, down when negative', () => {
    expect(cutoffReach(patch({ filterEnvAmount: 2 }), null)).toMatchObject({ lo: 1000, hi: 4000 });
    expect(cutoffReach(patch({ filterEnvAmount: -1 }), null)).toMatchObject({ lo: 500, hi: 1000 });
  });

  it('sources add up: Envelope +1 octave and LFO ±1 octave reach from one octave down to two up', () => {
    const reach = cutoffReach(patch({ filterEnvAmount: 1, lfoDestination: 'cutoff', lfoAmount: 0.5 }), null)!;
    expect(reach.lo).toBeCloseTo(500);
    expect(reach.hi).toBeCloseTo(4000);
    expect(reach.shares.filterEnvelope).toEqual([1000, 2000]);
  });

  it('with no Note sounding, Velocity reaches as far as the hardest strike could open it', () => {
    expect(cutoffReach(patch({ velocityCutoff: 0.5 }), null)).toMatchObject({ lo: 1000, hi: 2000 });
  });

  it('while a Note sounds, its Velocity and Key Track move the whole range: they are fixed for that Note', () => {
    // Velocity 0.5 at Velocity amount 1: one octave up. Key Track 100 % on C5: one octave up.
    const reach = cutoffReach(patch({ velocityCutoff: 1, keyTrack: 1, filterEnvAmount: 1 }), { note: 72, velocity: 0.5 })!;
    expect(reach.lo).toBeCloseTo(4000);
    expect(reach.hi).toBeCloseTo(8000);
    expect(reach.shares.velocity).toEqual([1000, 2000]);
    expect(reach.shares.keyTrack).toEqual([1000, 2000]);
  });

  it('never leaves the range the Filter can reach', () => {
    expect(cutoffReach(patch({ cutoff: 15000, filterEnvAmount: 5 }), null)).toMatchObject({ lo: 15000, hi: 20000 });
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
    expect(reach.shares.lfo).toEqual([expect.closeTo(0.3), expect.closeTo(0.7)]);
  });

  it('as the sound does, swings no further than the narrowest pulse allows, each way alike', () => {
    const reach = pulseWidthReach(patch({ lfoDestination: 'pulseWidth', lfoAmount: 1 }), 0.15)!;
    expect(reach.lo).toBeCloseTo(0.05);
    expect(reach.hi).toBeCloseTo(0.25);
  });
});
