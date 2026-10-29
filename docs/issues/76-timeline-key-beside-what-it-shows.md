# 76: The Timeline's key beside what it shows

**What to build:** The Envelope Timeline's key (its entries, their names, patterns and order) is built inside its React component, where only Playwright reaches it, while what the Timeline shows and each line's pattern are pure functions beside the drawing. The key moves beside them, as one list that the key and the canvas's test attribute both read. Candidate 4 of the architecture review of 2026-10-28, in the light version the owner chose. Nothing visible changes.

**Blocked by:** none

**Status:** done (2026-10-28). The key's entries and order come from one pure list beside what the Timeline shows; the key and the canvas's attribute both read it. Nothing visible changed: the Playwright suite passes untouched.

## Agent Brief

**Category:** enhancement
**Summary:** One pure list of the Timeline's key entries, in the owner's order, read by the key and the canvas's attribute, with a node test of the order.

**Current behavior:**
- The key's entries and their order (what LFO 1 moves, then what LFO 2 moves, the Cutoff, the Filter Envelope, the Amp Envelope) are built in the component.
- The canvas lists what it draws in an attribute of its own, in another order, built separately from the same rule.

**Desired behavior:**
- One pure function, beside the rule for what the Timeline shows, gives the key's entries in order: each one's mark, name, and for a moved Parameter its stage and pattern.
- The key renders that list, adding each entry's tip; the canvas's attribute is that list's marks.

**Key interfaces:**
- The Timeline's key entries for a Patch

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, no Playwright test changed
- [x] A node test pins the key's order and contents: the Amp Envelope alone; the Filter Envelope and the Cutoff once its Amount is set; an LFO on the Cutoff as the Cutoff; LFO 1's then LFO 2's Destinations first, with their patterns and stages

**Out of scope:**
- The drawing: where lines, dots and labels go (the PRD leaves canvas pixels untested)
- The review's full "pure picture"

## Decisions (grilling, 2026-10-28, decided by the owner)

1. The light version: the key's entries and order move beside what the Timeline shows; the painting stays as it is.

Claude's calls, open to the owner:

2. The canvas's attribute lists the key's marks in the key's order (an LFO line as `lfo-` and its Destination). The one Playwright test that reads it looks for a Destination's name, which the marks keep.
3. Built in the session that grilled it, test-first, not pushed.

## How it was built

- **The list** (`src/viewers/timeline.ts`): `timelineKey(patch)` returns `KeyEntry`s (mark, name, and for a moved Parameter its Destination, stage and pattern), built from `timelineShows` and `linePattern`. The canvas's `data-shows` is its marks. Tests: `timeline.test.ts`.
- **The key** (`src/ui/EnvelopeTimeline.tsx`): renders `timelineKey(patch)`, each entry's tip from `tipOf`.

