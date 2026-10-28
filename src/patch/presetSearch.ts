import { PRESET_GROUPS, PRESETS, type Preset, type PresetGroup } from './presets';

/** The Patch panel's categories (issue 69): All, the Tutorials, the Preset groups in the arrows' order, My Patches. */
export const CATEGORIES = ['All', 'Tutorials', ...PRESET_GROUPS, 'My Patches'] as const;
export type Category = 'All' | 'Tutorials' | PresetGroup | 'My Patches';

/** A text's words, lower case and without accents: "LFO's pitch" is lfo, s, pitch. */
const words = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** Every word typed starts a word of the text: "res" finds Resonance, "one" not phone; none typed finds all. */
const finds = (query: string, text: string) => {
  const within = words(text);
  return words(query).every((typed) => within.some((word) => word.startsWith(typed)));
};

/** Whether a name, a saved Patch's for one, matches what was typed. */
export const matchesName = (query: string, name: string) => finds(query, name);

/**
 * The Presets in a category that match what was typed, in the arrows' order: first those whose name or group
 * matches, then those that match only with their description too. Nothing typed matches all of the category.
 */
export function searchPresets(query: string, category: Category, presets: readonly Preset[] = PRESETS) {
  const inCategory = category === 'All' ? presets : presets.filter((p) => p.group === category);
  const byName = inCategory.filter((p) => finds(query, `${p.name} ${p.group}`));
  const byDescription = inCategory.filter((p) => !byName.includes(p) && finds(query, `${p.name} ${p.group} ${p.about}`));
  return { byName, byDescription };
}
