import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { createLibrary } from './library';
import { defaultPatch, setParam } from './patch';
import { initialPatch, PRESETS, stepPreset } from './presets';
import { patchToShare, sanitizePatch } from './serialize';

describe('Presets', () => {
  it('include a clean starting point and one sound per lesson', () => {
    expect(PRESETS.map((p) => p.name)).toEqual(['Init', 'Bass', 'Lead', 'Pluck', 'Pad', 'Wobble']);
    expect(PRESETS[0].patch).toEqual(defaultPatch());
  });

  it('are all valid Patches, with nothing clamped or replaced', () => {
    for (const preset of PRESETS) expect(sanitizePatch(preset.patch), preset.name).toEqual(preset.patch);
  });

  it('each explain what they show off', () => {
    for (const preset of PRESETS) expect(preset.about.length, preset.name).toBeGreaterThan(20);
  });

  it('step forward and back, wrapping at the ends', () => {
    expect(stepPreset(0, 1)).toBe(1);
    expect(stepPreset(PRESETS.length - 1, 1)).toBe(0);
    expect(stepPreset(0, -1)).toBe(PRESETS.length - 1);
  });
});

describe('initialPatch: what plays when the page opens', () => {
  const mine = setParam(defaultPatch(), 'cutoff', 700);

  it('prefers a share link', () => {
    const library = createLibrary(memoryStorage());
    library.saveCurrent(defaultPatch());
    expect(initialPatch(`#p=${patchToShare(mine)}`, library)).toEqual({ patch: mine, name: 'Shared Patch' });
  });

  it('then the autosaved Patch from last time', () => {
    const library = createLibrary(memoryStorage());
    library.saveCurrent(mine);
    expect(initialPatch('', library)).toEqual({ patch: mine, name: 'Last session' });
  });

  it('then the Init Preset', () => {
    expect(initialPatch('#p=%%%', createLibrary(memoryStorage()))).toEqual({ patch: defaultPatch(), name: 'Init' });
  });
});
