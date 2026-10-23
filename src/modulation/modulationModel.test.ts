import { describe, expect, it } from 'vitest';
import { defaultPatch, setParam } from '../patch/patch';
import { effectiveCutoff } from './modulationModel';

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
    expect(effectiveCutoff(patch, 0, 1)).toBeCloseTo(2000);
    expect(effectiveCutoff(patch, 0, -1)).toBeCloseTo(500);
  });

  it('adds to the Filter Envelope, in octaves', () => {
    expect(effectiveCutoff({ ...patch, filterEnvAmount: 1 }, 1, 1)).toBeCloseTo(4000);
  });

  it('leaves the Cutoff alone when the LFO is aimed elsewhere', () => {
    expect(effectiveCutoff({ ...patch, lfoDestination: 'pitch' }, 0, 1)).toBe(1000);
  });
});

describe('Effective Cutoff with Velocity', () => {
  const patch = { ...defaultPatch(), cutoff: 500, velocityCutoff: 0.5 };

  it('opens the Filter by up to two octaves for the hardest hit (one octave at half amount)', () => {
    expect(effectiveCutoff(patch, 0, 0, 1)).toBeCloseTo(1000);
    expect(effectiveCutoff({ ...patch, velocityCutoff: 1 }, 0, 0, 1)).toBeCloseTo(2000);
  });

  it('opens it less for softer hits', () => {
    expect(effectiveCutoff({ ...patch, velocityCutoff: 1 }, 0, 0, 0.5)).toBeCloseTo(1000);
  });

  it('changes nothing while the amount is zero (the default)', () => {
    expect(effectiveCutoff(defaultPatch(), 0, 0, 1)).toBe(defaultPatch().cutoff);
  });
});

describe('Effective Cutoff with Key Track', () => {
  const patch = { ...defaultPatch(), cutoff: 1000, keyTrack: 1 };

  it('follows the Note an octave per octave at full Key Track, from C4', () => {
    expect(effectiveCutoff(patch, 0, 0, 0, 60)).toBeCloseTo(1000); // C4: no change
    expect(effectiveCutoff(patch, 0, 0, 0, 72)).toBeCloseTo(2000); // C5
    expect(effectiveCutoff(patch, 0, 0, 0, 48)).toBeCloseTo(500); // C3
  });

  it('follows half as far at 50 %, and through fractions of a semitone during a Glide', () => {
    expect(effectiveCutoff({ ...patch, keyTrack: 0.5 }, 0, 0, 0, 84)).toBeCloseTo(2000);
    expect(effectiveCutoff(patch, 0, 0, 0, 66)).toBeCloseTo(1000 * 2 ** 0.5); // half an octave up
  });

  it('changes nothing at 0 %, whatever the Note', () => {
    expect(effectiveCutoff({ ...patch, keyTrack: 0 }, 0, 0, 0, 96)).toBe(1000);
  });

  it('adds to the Envelope, in octaves', () => {
    expect(effectiveCutoff({ ...patch, filterEnvAmount: 1 }, 1, 0, 0, 72)).toBeCloseTo(4000);
  });
});
