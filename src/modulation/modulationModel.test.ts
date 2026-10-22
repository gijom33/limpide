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
