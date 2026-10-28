# 72: The Patch panel after its review

**What to build:** What the issue 69 review sent to the inbox (2026-10-28) about the Patch panel's search and categories, decided by the owner (triage of 2026-10-28, questions 16 to 19 and 21): truer words on the search box, the categories in one row on the in-between layout, a result count for screen readers, a word for saved Patches hidden by a category, and the code smells in the same files.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Decisions (triage, 2026-10-28, decided by the owner)

1. **The search box is named "Search"** for screen readers; its placeholder stays "Search names and descriptions"; the heading stays "Presets".
2. **Up to 860 px wide the categories are one row scrolling sideways**, as on a phone: from 601 to 860 px they wrapped into four rows (121 px measured at 700 px) beside the search box.
3. **A polite status says how many were found** ("12 found", "Nothing found"), visually hidden, read once typing pauses (WCAG 4.1.3).
4. **Saved Patches hidden by a category get a line:** under the Tutorials or a Preset group, when Patches are saved, My Patches says "Your saved Patches are under All and My Patches." in place of its list; with none saved, "None saved yet." as now.
5. **The review's code smells in the same files** are tidied with these.

## Agent Brief

**Category:** enhancement
**Summary:** Polish the Patch panel's search and categories (a truer name, one row of categories up to 860 px, a live result count, a word for hidden saved Patches) and tidy its code, with no change to what a search finds.

**Current behavior:**
- The search box's accessible name is "Search Presets", though it also narrows the Tutorials (by their Preset's name) and My Patches (by name).
- From 601 to 860 px wide (the 2 × 2 layout) the 17 category pills wrap into four rows beside the 240 px search box; at 600 px and below they are one row scrolling sideways under it.
- The result rows and "Nothing matches" change silently as you type: a screen reader hears nothing.
- Under the Tutorials category or a Preset group, My Patches shows its heading and Save field but no list and no word why.
- Code: `matchesName` is also the matcher for name, group and description together; the search's × reuses the delete button's class; the panel computes `searchPresets` twice a render (once for the category, once for All to find the Tutorials); which categories list Presets, Tutorials or My Patches is asked with `category === …` checks in both the panel and the search module; the result rows are `[string, Preset[]]` pairs whose "Name" and "Description" double as group labels; the search field's and the pills' CSS copy the save field's and the Patch items' rules; the panel component holds search, categories, saving, deleting, files and sharing in about 390 lines.

**Desired behavior:**
- The search box's accessible name is "Search"; placeholder and heading unchanged.
- Up to 860 px wide, the categories are one row scrolling sideways under the search box, as at phone widths; above 860 px, unchanged (beside the box, wrapping).
- A visually hidden polite live region announces the number found while a search is typed ("12 found"; "Nothing found" when nothing matches), and nothing when the search is empty.
- Under the Tutorials category or a Preset group, with at least one saved Patch, My Patches shows "Your saved Patches are under All and My Patches." where its list would be; the Save field and file buttons stay. With none saved, "None saved yet." as now.
- Code: the matcher has a name that says what it matches; the × has a class of its own; one place answers what a category lists (Presets, Tutorials, My Patches); the search runs once per render; result rows carry their label and kind as a small named type; the copied CSS shares selectors; the search and categories move out of the panel component into one of their own, the panel keeping saving, deleting, files and sharing.

**Key interfaces:**
- `CATEGORIES`, `Category`, `searchPresets` and the word matcher (`matchesName` today), `isSearch`
- The Patch panel component and the new search-and-categories component it renders
- The `Library` the panel lists My Patches from

**Acceptance criteria:**
- [ ] The search box is found by role `searchbox` and name "Search" (tests updated)
- [ ] At 700 × 900 the category radiogroup is one row (its height one pill's) and scrolls sideways; at 1440 it wraps beside the box as now
- [ ] Typing a search updates a `role="status"` element's text with the count; it is empty when the search is cleared
- [ ] With a Patch saved and the Bass category chosen, My Patches shows the line above; with none saved, "None saved yet."
- [ ] Every existing test of the Patch panel and of the search passes, with only the box's name changed; the design audit passes
- [ ] `npx tsc`, `npm run lint`, `npx vitest run`, `npx playwright test` green

**Out of scope:**
- What a search matches or its order (decisions 3, 11 and 12 of issue 69)
- The ‹ › arrows, saving, renaming, deleting, files and Share links, beyond moving code
- The categories' look above 860 px
