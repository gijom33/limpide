import { describe, expect, it } from 'vitest';
import { CHOICES, PARAMS } from '../patch/patch';
import { patchFromShare, patchToShare } from '../patch/serialize';
import { EDGE_FACTORS, edgeCases } from './edgePatches';

describe('the Patches at the edges (issue 116)', () => {
  it('tries each Parameter at its ends and the middle of its travel, each choice at every value, and the Tempo at its ends', () => {
    const factor = (key: string) => EDGE_FACTORS.find((f) => f.key === key)!.values;
    const [low, middle, high] = factor('cutoff') as number[];
    expect([low, high]).toEqual([20, 20000]);
    expect(middle).toBeCloseTo(Math.sqrt(20 * 20000), 9); // half way in octaves
    expect(factor('osc1Octave')).toEqual([-2, 0, 2]);
    expect(factor('glide')).toEqual([0.001, 0.50075, 2]);
    expect(factor('lfoNote')).toEqual([0, 12, 23]);
    expect(factor('voices')).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(factor('lfo2Sync')).toEqual(['off', 'on']);
    expect(factor('legato')).toEqual(['off', 'on']);
    expect(factor('bpm')).toEqual([40, 120, 240]);
    expect(EDGE_FACTORS.map((f) => f.key).sort()).toEqual([...Object.keys(PARAMS), ...Object.keys(CHOICES), 'bpm'].sort());
  });

  it('meets every pair of factors at every pair of their values at least once', () => {
    const cases = edgeCases(116);
    const missing: string[] = [];
    EDGE_FACTORS.forEach((a, i) =>
      EDGE_FACTORS.slice(i + 1).forEach((b) => {
        for (const va of a.values)
          for (const vb of b.values)
            if (!cases.some((c) => valueIn(c, a.key) === va && valueIn(c, b.key) === vb)) missing.push(`${a.key} ${va} × ${b.key} ${vb}`);
      }),
    );
    expect(missing.slice(0, 5)).toEqual([]);
  });

  it('holds the hard cases: both LFOs on each Destination, FM and Ring at full, the Sub two octaves down, a legato line, every Voice count', () => {
    const names = edgeCases(116).map((c) => c.name);
    for (const d of ['pitch', 'osc2Pitch', 'detune', 'pulseWidth', 'fm', 'cutoff', 'resonance', 'volume'])
      for (const sync of ['off', 'on']) expect(names, d).toContain(`both LFOs on ${d}, Sync ${sync}`);
    expect(names).toContain('FM and Ring at full, Osc 2 on the Note');
    expect(names).toContain('the Sub two octaves under Osc 1 two octaves down');
    for (let voices = 1; voices <= 8; voices++) expect(names).toContain(`${voices} Voices, a chord on all of them`);
    expect(names).toContain('a legato line, the Glide at its longest, both LFOs retriggered');
    const both = edgeCases(116).find((c) => c.name === 'both LFOs on fm, Sync on')!.patch;
    expect([both.lfoDestination, both.lfo2Destination, both.lfoAmount, both.lfo2Amount, both.lfoSync, both.lfo2Sync]).toEqual(['fm', 'fm', 1, 1, 'on', 'on']);
  });

  it('is the same set for the same seed, and another for another', () => {
    expect(edgeCases(116)).toEqual(edgeCases(116));
    expect(edgeCases(117)).not.toEqual(edgeCases(116));
  });

  it('has thousands of Patches, each one a Share link gives back whole', () => {
    const cases = edgeCases(116);
    expect(cases.length).toBeGreaterThanOrEqual(1000);
    for (const { patch } of cases) expect(patchFromShare(patchToShare(patch))).toEqual(patch);
  });
});

const valueIn = (c: ReturnType<typeof edgeCases>[number], key: string) => (key === 'bpm' ? c.bpm : (c.patch as Record<string, unknown>)[key]);
