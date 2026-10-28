import { PRESET_GROUPS, PRESETS, type Preset } from './presets';

/** The Patch panel's categories (issue 69): All, the Tutorials, the Preset groups in the arrows' order, My Patches. */
export const CATEGORIES = ['All', 'Tutorials', ...PRESET_GROUPS, 'My Patches'] as const;
export type Category = (typeof CATEGORIES)[number];

/** A text's words, lower case and without accents: "LFO's pitch" is lfo, s, pitch. */
const words = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/**
 * Whether a text, a saved Patch's name for one, matches what was typed: every word typed starts a word of the text.
 * "res" finds Resonance, "one" not phone; nothing typed finds all.
 */
export function matchesName(query: string, text: string) {
  const within = words(text);
  return words(query).every((typed) => within.some((word) => word.startsWith(typed)));
}

/**
 * The Presets in a category that match what was typed, in the arrows' order: first those whose name or group
 * matches, then those that match only with their description too. Nothing typed matches all of the category. The
 * Tutorials and My Patches list no Presets of their own, so none are found there: the panel lists those itself.
 */
export function searchPresets(query: string, category: Category, presets: readonly Preset[] = PRESETS): { byName: Preset[]; byDescription: Preset[] } {
  if (category === 'Tutorials' || category === 'My Patches') return { byName: [], byDescription: [] };
  const inCategory = category === 'All' ? presets : presets.filter((p) => p.group === category);
  const byName = inCategory.filter((p) => matchesName(query, `${p.name} ${p.group}`));
  const byDescription = inCategory.filter((p) => !byName.includes(p) && matchesName(query, `${p.name} ${p.group} ${p.about}`));
  return { byName, byDescription };
}
