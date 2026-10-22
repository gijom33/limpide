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
