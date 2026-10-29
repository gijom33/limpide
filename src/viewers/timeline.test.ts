import { describe, expect, it } from 'vitest';
import { defaultPatch, type Patch } from '../patch/patch';
import { timelineKey } from './timeline';

const patch = (change: Partial<Patch>): Patch => ({ ...defaultPatch(), lfoAmount: 0, lfo2Amount: 0, filterEnvAmount: 0, ...change });

describe("the Timeline's key, in the owner's order (issue 76)", () => {
  it('names the Amp Envelope alone with no Filter Envelope and no active LFO', () => {
    expect(timelineKey(patch({}))).toEqual([{ mark: 'amp', name: 'Amp Envelope' }]);
  });

  it('adds the Cutoff, then the Filter Envelope, once its Amount is set', () => {
    expect(timelineKey(patch({ filterEnvAmount: 2 })).map((e) => e.mark)).toEqual(['cutoff', 'filterEnvelope', 'amp']);
  });

  it('names an LFO on the Cutoff as the Cutoff, dotted in the Filter’s colour', () => {
    expect(timelineKey(patch({ lfoDestination: 'cutoff', lfoAmount: 0.5 }))).toEqual([
      { mark: 'cutoff', name: 'Cutoff', stage: 'filter', pattern: 'dots' },
      { mark: 'amp', name: 'Amp Envelope' },
    ]);
  });

  it("puts what LFO 1 moves first, then what LFO 2 moves, each in its stage's colour and its LFO's pattern", () => {
    const key = timelineKey(patch({ lfoDestination: 'volume', lfoAmount: 1, lfo2Destination: 'pulseWidth', lfo2Amount: 1, filterEnvAmount: -1 }));
    expect(key).toEqual([
      { mark: 'lfo-volume', name: 'Volume', destination: 'volume', stage: 'amp', pattern: 'dashes' },
      { mark: 'lfo-pulseWidth', name: 'Pulse Width', destination: 'pulseWidth', stage: 'osc', pattern: 'dashDot' },
      { mark: 'cutoff', name: 'Cutoff', stage: 'filter', pattern: 'dots' },
      { mark: 'filterEnvelope', name: 'Filter Envelope' },
      { mark: 'amp', name: 'Amp Envelope' },
    ]);
  });

  it('names nothing but the Amp Envelope before any Patch is known', () => {
    expect(timelineKey(undefined)).toEqual([{ mark: 'amp', name: 'Amp Envelope' }]);
  });
});
