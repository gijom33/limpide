import { PRESET_GROUPS, PRESETS, type Preset } from './presets';

/** The Patch panel's categories (issue 69): All, the Tutorials, the Preset groups in the arrows' order, My Patches. */
export const CATEGORIES = ['All', 'Tutorials', ...PRESET_GROUPS, 'My Patches'] as const;
export type Category = (typeof CATEGORIES)[number];

/** What a category lists: All lists everything, a Preset group its Presets alone, the other two themselves. */
export function categoryLists(category: Category) {
  return {
    presets: category !== 'Tutorials' && category !== 'My Patches',
    tutorials: category === 'All' || category === 'Tutorials',
    mine: category === 'All' || category === 'My Patches',
  };
}

/** A text's words, lower case and without accents: "LFO's pitch" is lfo, s, pitch. */
const words = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** Whether something was typed to search for: a word, not only spaces or punctuation (which would match everything). */
export const isSearch = (query: string) => words(query).length > 0;

/**
 * Whether a text (a name, a group, a description, or several together) matches what was typed: every word typed
 * starts a word of the text. "res" finds Resonance, "one" not phone; nothing typed finds all.
 */
export function matchesWords(query: string, text: string) {
  const within = words(text);
  return words(query).every((typed) => within.some((word) => word.startsWith(typed)));
}

/** The Presets found: first those whose name or group matches, then those that match only with their description too. */
export interface Found {
  byName: Preset[];
  byDescription: Preset[];
}

/** The Presets found that a category lists: those of its group, all of them under All, none under the other two. */
export function inCategory(found: Found, category: Category): Found {
  if (!categoryLists(category).presets) return { byName: [], byDescription: [] };
  if (category === 'All') return found;
  const ofGroup = (p: Preset) => p.group === category;
  return { byName: found.byName.filter(ofGroup), byDescription: found.byDescription.filter(ofGroup) };
}

/**
 * The Presets in a category that match what was typed, in the arrows' order (`Found`). Nothing typed matches all of the
 * category. The Tutorials and My Patches list no Presets of their own, so none are found there: the panel lists those itself.
 */
export function searchPresets(query: string, category: Category, presets: readonly Preset[] = PRESETS): Found {
  const byName = presets.filter((p) => matchesWords(query, `${p.name} ${p.group}`));
  const byDescription = presets.filter((p) => !byName.includes(p) && matchesWords(query, `${p.name} ${p.group} ${p.about}`));
  return inCategory({ byName, byDescription }, category);
}

/** A row of the Patch panel's results: a Preset group's, or while searching, the Presets found by name or by description. */
export interface ResultRow {
  kind: 'group' | 'byName' | 'byDescription';
  label: string;
  presets: Preset[];
}

/** The rows the panel lists the Presets found in, the empty ones left out: by group, or while searching, two rows. */
export function resultRows(found: Found, searching: boolean): ResultRow[] {
  const rows: ResultRow[] = searching
    ? [
        { kind: 'byName', label: 'Name', presets: found.byName },
        { kind: 'byDescription', label: 'Description', presets: found.byDescription },
      ]
    : PRESET_GROUPS.map((group) => ({ kind: 'group', label: group, presets: found.byName.filter((p) => p.group === group) }));
  return rows.filter((row) => row.presets.length > 0);
}
