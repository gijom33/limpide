import { describe, expect, it } from 'vitest';
import { defaultPatch, setFilter, setParam, setWaveform } from './patch';
import { patchFromJSON, patchFromShare, patchToJSON, patchToShare, sanitizePatch } from './serialize';

const custom = () => setFilter(setWaveform(setParam(setParam(defaultPatch(), 'cutoff', 640), 'resonance', 0.7), 'square', 'osc2'), { mode: 'highpass', slope: 24 });

describe('sanitizePatch: anything from outside becomes a valid Patch', () => {
  it('fills in whatever is missing with defaults (Patches from older versions)', () => {
    const patch = sanitizePatch({ cutoff: 500 });
    expect(patch).toEqual({ ...defaultPatch(), cutoff: 500 });
  });

  it('drops fields it does not know (Patches from newer versions)', () => {
    expect(sanitizePatch({ ...defaultPatch(), reverb: 0.5 })).toEqual(defaultPatch());
  });

  it('clamps numbers to their range and snaps stepped ones', () => {
    const patch = sanitizePatch({ cutoff: 1e9, osc2Octave: 1.6, ampSustain: -3 });
    expect([patch.cutoff, patch.osc2Octave, patch.ampSustain]).toEqual([20000, 2, 0]);
  });

  it('replaces anything malformed with the default', () => {
    const patch = sanitizePatch({ cutoff: 'loud', waveform: 'kazoo', filterSlope: 18, lfoDestination: null, resonance: NaN });
    const d = defaultPatch();
    expect([patch.cutoff, patch.waveform, patch.filterSlope, patch.lfoDestination, patch.resonance]).toEqual([d.cutoff, d.waveform, d.filterSlope, d.lfoDestination, d.resonance]);
  });

  it('copes with something that is not an object at all', () => {
    expect(sanitizePatch(null)).toEqual(defaultPatch());
    expect(sanitizePatch('hello')).toEqual(defaultPatch());
  });
});

describe('JSON files', () => {
  it('round-trips a Patch', () => {
    expect(patchFromJSON(patchToJSON(custom()))).toEqual(custom());
  });

  it('marks the file as SynthView’s, with a format version', () => {
    expect(JSON.parse(patchToJSON(custom()))).toMatchObject({ app: 'synthview', version: 1 });
  });

  it('rejects files that are not SynthView Patches, with a clear reason', () => {
    expect(() => patchFromJSON('{not json')).toThrow(/not a valid file/i);
    expect(() => patchFromJSON('{"tempo":120}')).toThrow(/not a SynthView Patch/i);
  });

  it('sanitises what it reads', () => {
    const text = JSON.stringify({ app: 'synthview', version: 1, patch: { cutoff: 1e9, extra: 1 } });
    expect(patchFromJSON(text)).toEqual({ ...defaultPatch(), cutoff: 20000 });
  });
});

describe('share links', () => {
  it('round-trips a Patch', () => {
    expect(patchFromShare(patchToShare(custom()))).toEqual(custom());
  });

  it('only carries what differs from the defaults, so links stay short', () => {
    expect(patchToShare(defaultPatch()).length).toBeLessThan(20);
    expect(patchToShare(custom()).length).toBeLessThan(160);
  });

  it('is safe to put in a URL', () => {
    expect(patchToShare(custom())).toMatch(/^[A-Za-z0-9_-]*$/);
  });

  it('reports a damaged link as nothing (so the app falls back) instead of failing', () => {
    expect(patchFromShare('%%%')).toBeUndefined();
  });
});
