# 69: Search and categories in the Patch panel

**What to build:** From the owner's idea (2026-10-28): "Add a search feature for the patches. Also add a category filter like we have in Ableton Live or Apple LogicPro." The Patch panel lists 91 Presets in 14 groups, the Tutorials and My Patches; a search box and a row of categories narrow it.

**Blocked by:** none

**Status:** done (2026-10-28)

## Decisions (grilling, 2026-10-28, decided by the owner)

1. **The categories are the Preset groups:** All first, then Tutorials, the 14 groups in the arrows' order (Start to Movement & Effects), and My Patches last. Each Preset keeps its one group; nothing is re-tagged.
2. **One category at a time:** All brings everything back.
3. **Search matches the descriptions too, the names first** (the owner's own, replacing the grilling's answer, names and groups only): a name or group that matches ranks above a description that does.
4. **Search within the category:** a search looks inside the chosen category; when nothing matches, the message offers All.
5. **The search box on the Presets heading's line:** focused when the panel opens on a computer, not on a phone (its keyboard would cover the list). Escape clears the text first; a second Escape closes the panel.
6. **My Patches too:** the search narrows My Patches (by name: they have no description), and My Patches is the last category.
7. **One row of categories everywhere:** pills under the search box, wrapping on a computer, scrolling sideways on a phone. Under All, each group's name stays at the start of its row.
8. **Kept until the page reloads:** the search and the category stay when the panel closes and opens again, to audition the results one by one; a × clears the search. Neither is stored.
9. **The ‹ › arrows ignore the filter:** they step through every Preset, as now; the filter is the panel's only.
10. **Enter loads the first match** and closes the panel; Tab goes on to the categories, then the results.
11. **Two rows while searching:** "Name" (a name or group matches), in the arrows' order, then "Description" (only the description matches). Each pill keeps its Tutorial cap and its tooltip, which shows the description. The Tutorials row shows a Tutorial whose Preset matches by name.
12. **A word matches a word's start:** "res" finds Resonance, "lfo" finds LFO's, "one" not phone; case and accents don't count. Every word typed must be found: in the name and group for a Name match, in the name, group and description together for a Description match.
13. **A short scroll on a small laptop** (asked while building): at 1100×800 the search and categories, on the heading's line, cost the Presets a scroll of about one row; from about 840 px tall (a 13-inch MacBook's window, 1470×830) the whole list fits. The Tutorials row stays.

Claude's calls, open to the owner: the design audit's waivers for the Patch items' faint edges and 28 px height cover the category pills and the search field, drawn the same way; Enter skips the Tutorials row (it loads a sound) unless the Tutorials are the category; under a Preset group, My Patches shows its Save field but not its list.

- [x] `searchPresets` in `src/patch/presetSearch.ts`, with unit tests: word starts, every word, names before descriptions, a category. After the 1.14.0 review: `Category` read from `CATEGORIES`, `matchesName` the matcher itself (the panel uses it for My Patches), and the Tutorials and My Patches said to find no Presets
- [x] The Patch panel's search box and categories (`PatchBar.tsx`), with e2e tests on a computer and a phone (`e2e/patchSearch.spec.ts`)
- [x] Escape, Enter and the focus on opening; the search and category kept until a reload
