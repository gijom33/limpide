import { describe, expect, it } from 'vitest';
import { defaultPatch } from './patch';
import { CATEGORIES, isSearch, matchesName, searchPresets } from './presetSearch';
import { PRESET_GROUPS, PRESETS, type Preset, type PresetGroup } from './presets';

const preset = (name: string, group: PresetGroup, about: string): Preset => ({ name, group, about, patch: defaultPatch() });
const LIST = [
  preset('Warm Pad', 'Pads', 'Detuned saws over a Sub.'),
  preset('Slow Vibrato', 'LFO', "The LFO's pitch wobble, slow."),
  preset('Resonant Ring', 'Filter', 'A high Resonance rings at the Cutoff.'),
  preset('Hi-hat', 'Drums', 'Noise through a high-pass Filter.'),
  preset('Pad', 'Pads', 'A slow, warm swell.'),
];
const names = (found: Preset[]) => found.map((p) => p.name);

describe('searchPresets', () => {
  it('matches a typed word at the start of a word, whatever its case or accents', () => {
    expect(names(searchPresets('res', 'All', LIST).byName)).toEqual(['Resonant Ring']);
    expect(names(searchPresets('RÉSO', 'All', LIST).byName)).toEqual(['Resonant Ring']);
    expect(names(searchPresets('ing', 'All', LIST).byName)).toEqual([]); // inside a word, not its start
    expect(names(searchPresets('hi-hat', 'All', LIST).byName)).toEqual(['Hi-hat']);
  });

  it('wants every word typed, in any order', () => {
    expect(names(searchPresets('pad warm', 'All', LIST).byName)).toEqual(['Warm Pad']);
    expect(names(searchPresets('warm ring', 'All', LIST).byName)).toEqual([]);
  });

  it('puts a name or group match first, a match in the description only after it', () => {
    // "warm" is Warm Pad's name, and only Pad's description.
    expect(searchPresets('warm', 'All', LIST)).toEqual({ byName: [LIST[0]], byDescription: [LIST[4]] });
    // A group's name matches its Presets by name; a description's word counts with the name's.
    expect(names(searchPresets('lfo', 'All', LIST).byName)).toEqual(['Slow Vibrato']);
    expect(names(searchPresets('high', 'All', LIST).byDescription)).toEqual(['Resonant Ring', 'Hi-hat']);
    expect(names(searchPresets('ring cutoff', 'All', LIST).byDescription)).toEqual(['Resonant Ring']);
  });

  it('looks inside the category; the Presets keep the arrows’ order', () => {
    expect(names(searchPresets('', 'Pads', LIST).byName)).toEqual(['Warm Pad', 'Pad']);
    expect(names(searchPresets('high', 'Drums', LIST).byDescription)).toEqual(['Hi-hat']);
    // The Tutorials and My Patches hold no Presets of their own: the panel lists them itself.
    expect(searchPresets('', 'My Patches', LIST)).toEqual({ byName: [], byDescription: [] });
    expect(searchPresets('pad', 'Tutorials', LIST)).toEqual({ byName: [], byDescription: [] });
    expect(searchPresets('', 'All', PRESETS).byName).toEqual(PRESETS);
  });
});

describe('isSearch', () => {
  it('is a search only with a word typed: spaces or punctuation alone are not one', () => {
    for (const typed of ['', '   ', '?', ' - ']) expect(isSearch(typed), JSON.stringify(typed)).toBe(false);
    for (const typed of ['a', ' res ', 'hi-hat']) expect(isSearch(typed), typed).toBe(true);
  });
});

describe('the categories', () => {
  it('are All, the Tutorials, every Preset group in order, and My Patches', () => {
    expect(CATEGORIES).toEqual(['All', 'Tutorials', ...PRESET_GROUPS, 'My Patches']);
  });

  it('a saved Patch matches by its name', () => {
    expect(matchesName('bass my', 'My bass')).toBe(true);
    expect(matchesName('bass', 'Mybass')).toBe(false);
    expect(matchesName('', 'Anything')).toBe(true);
  });
});
