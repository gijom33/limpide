# 142: Bead on the line just under a phone's section tabs

**What to build:** The owner's bug (inbox, 2026-10-31), on a phone, Bead under the section tabs by the Oscillators' top edge: "Bead does not sit exactly on line when on top row. I understand there are issues with how to handle top row but if it's manageable, please fix."

The cause: on a phone Bead stands on a section's top edge only with room for its whole height (26 px) under the section tabs. The first section's edge is a margin (12 px) under them, so it hung from the tabs instead, its foot a drop's height down: 14 px below the line, looking like a missed landing.

**Blocked by:** none

**Status:** needs-triage · bug. Bead on the line built (2026-10-31, decisions 1 and 2); the owner's idea of hovering where it loses its edge waits on the owner's yes to Claude's plan below.

## Decisions

1. **Bead stands on the line, drawn over the tabs' foot** (option B of three: hanging higher behind the tabs, or hanging clear of the line, were the others). Decided by the owner, 2026-10-31.
2. **How far over:** as long as the edge shows under the tabs (2 px or more), so it stays on the line as the page scrolls, over the tabs by up to its height for the last pixels; once the edge has gone under them, it hangs as before. A first try allowed two thirds of its height and left a band of scroll where it hung off the line again (the owner's second screenshot). Only under the section strip: under the header (2 × 2) it still needs its whole height. An edge with room under the tabs still comes first. Claude's call, open to the owner.

## The owner's idea: hovering where it loses ground

The owner, 2026-10-31 (inbox): "If Bead has nowehere to go, maybe we can make it fly with its tail and stay local to where it lost ground." Claude's plan, for the owner's yes:

- **When:** wherever it hangs from the header today, on a phone or in 2 × 2: no edge it can stand on in view, as when its edge goes under the tabs.
- **How:** it takes off with its tail whirling (its flight up's pose) and hovers where it lost ground: at its own spot across, its foot a little under the tabs or the header, bobbing gently.
- **After:** when an edge it can stand on comes into view, it drops or flies onto it as now. It no longer hangs from the header.
- **Reduced motion:** it hovers still, without the whirl or the bob.

## How it was built

- `choosePerch` (`src/ui/mascotPlace.ts`) takes an `overlap`: an edge the drop fits under the ceiling with that much over it is kept, and taken when no roomy edge is in view, before hanging. `src/ui/Mascot.tsx` passes Bead's height less 2 px when the section strip, not the header, is the ceiling.
- `.mascot` is at the section strip's z-index (9), after it in the page, so it is drawn over the strip and still under the header (10) and the cards.
- Checked in the preview at 464 px: Bead's foot at 230 px, the Oscillators' edge at 230 px, its top 14 px over the strip.
