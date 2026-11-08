# 142: Bead on the line just under a phone's section tabs

**What to build:** The owner's bug (inbox, 2026-10-31), on a phone, Bead under the section tabs by the Oscillators' top edge: "Bead does not sit exactly on line when on top row. I understand there are issues with how to handle top row but if it's manageable, please fix."

The cause: on a phone Bead stands on a section's top edge only with room for its whole height (26 px) under the section tabs. The first section's edge is a margin (12 px) under them, so it hung from the tabs instead, its foot a drop's height down: 14 px below the line, looking like a missed landing.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; approved by the owner: "okay", Bead hovering wholly under the tabs as built (call 1); the tricks still cut off by the top rows went to [200](./200-beads-tricks-above-the-top-rows.md)

## Decisions

1. **Bead stands on the line, drawn over the tabs' foot** (option B of three: hanging higher behind the tabs, or hanging clear of the line, were the others). Decided by the owner, 2026-10-31.
2. **How far over:** as long as the edge shows under the tabs (2 px or more), so it stays on the line as the page scrolls, over the tabs by up to its height for the last pixels; once the edge has gone under them, it hangs as before. A first try allowed two thirds of its height and left a band of scroll where it hung off the line again (the owner's second screenshot). Only under the section strip: under the header (2 × 2) it still needs its whole height. An edge with room under the tabs still comes first. Claude's call, let stand by the owner in 1.19.0.
3. **Hovering where it loses ground:** Claude's plan below, as written. Decided by the owner, 2026-10-31 ("ok on all questions").
   **Since then (2026-11-02, issue [192](./192-beads-cover-checks-complete.md)):** with the hover line itself covered, Bead waits out of sight under the header or the tabs, and comes back into view once somewhere is clear. Decided by the owner (192).

## Acceptance criteria

Written after it was built (issue 196: it had none), from the decisions and the tests run below.

- [x] On a phone, Bead stands on the first section's top edge under the tabs, drawn over their foot, while 2 px or more of the edge shows (decisions 1 and 2)
- [x] Under the header in 2 × 2 it still needs its whole height
- [x] With no edge in view it hovers under the tabs or the header, its top 3 to 6 px below them, bobbing, near where it lost ground, still with reduced motion (decision 3)
- [x] An edge coming into view below, it drops onto it; one coming in above, it flies up onto it; thrown with none in view, it catches itself on the hover line
- [x] The mascot unit tests and the mascot spec in Chromium and WebKit pass

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

### Decision 3, hovering (2026-11-01, on night/2026-10-31)

**What was built:**
- **Its hover line** (`choosePerch`, `src/ui/mascotPlace.ts`): with no edge it can stand on in view, on a phone or in 2 × 2, its line is no longer the header's foot to hang from but a line a little under the header or the section tabs, its top 6 px under them. `Perch.hanging` and the `hanging` move are now `hovering`.
- **Taking off** (`createMascotPlace`): losing ground, it takes off at once, no crouch, its tail straight down under it and whirling as in its flight up, and eases onto the hover line at its own spot across (at most 500 px a second, slowing as it nears it). There it bobs gently, 3 px up and back, 0.8 times a second, so its top stays 3 to 6 px under the tabs.
- **After:** an edge coming into view below, its tail stops and it drops onto it, with no hop; one coming in over it (from under the tabs, scrolling up), it flies up onto it at once, its tail already under it. Thrown with no edge in view, it catches itself on the hover line coming down onto it, or flies up to it from under it. Sent away while hovering, it drips down the window, as it did hanging.
- **Its pose and place** (`src/ui/Mascot.tsx`): hovering, its legs tucked, its tail whirling, held upright and unstretched; it stays within 12 px of where it lost ground (or, arriving with no edge in view, of a spot at random), and clear of a card, a tip or a panel up to the top of its bob.
- **Reduced motion:** it is on its hover line at once and hovers still, its tail down without the whirl, no bob.
- **The words:** bead.md ("Where it lives", and sending it away), CONTEXT.md's Mascot, and dated lines in 115 and 164.

**Claude's calls, let stand by the owner in 1.20.0:**
1. **Under the tabs, not over them.** The plan said "its foot a little under the tabs or the header". Read as its foot just under them, the drop would hover over the tabs; its pixels take the pointer (tickles, clicks), so a hovering Bead would keep a finger off the tab under it for as long as no edge is in view, and under the header it would be hidden (it is drawn under the header). So the whole drop hovers under them, its top 3 to 6 px below. The cost: when its edge goes under the tabs (where, by decision 2, it stood with its body over them), it eases about 30 px down to hover rather than staying at that height. The other way: over the tabs' foot under the section strip only, as decision 2 does for standing.
2. **Local, not fixed:** it may stray 12 px either way from where it lost ground, so its dancing steps and little strolls go on.
3. **No spray while hovering:** its tail flings droplets while taking off, as in its flight up, but not while it hovers, so a long hover over a section does not keep raining on it.
4. **A glide, not the gravity flight,** onto the hover line, even from an edge leaving at the window's bottom when you scroll up quickly: no crouch first, easing in rather than coasting over and dropping.
5. **Its tricks go on while it hovers** (a funny turn, a dance, a prop), held upright and unstretched so none lifts it over the tabs.

**Tests run:**
- Unit (`src/ui/mascotPlace.test.ts`), red then green: the hover line, the take-off at its own spot, the bob and its stillness with reduced motion, from hovering a drop with no hop and a flight with no crouch, from an edge far below up to hover, and the throw caught on the hover line. `src/ui/mascot*.test.ts`: 106 passed.
- `npx tsc` and `npm run lint`.
- The mascot spec, Chromium and WebKit: the short phone window's test now checks the hover (scrolled until its edge goes and none is left: hovering, its top 0 to 8 px under the tabs and never over them, bobbing, within 14 px of where it lost ground, its tail whirling; with reduced motion, still); the scroll-through tests and 164's now name hovering. Final runs: 49 passed (1 skipped, the frame cost in WebKit), then 48 passed. The one failure, "a pointer over it tickles it" in three across (not touched here), passed 3 times alone: a load flake. Bead's frame-cost test passed.
- **The review** (standards and spec, since `3d3a766`). Fixed: two stale comments; a constant renamed (`BOBS_A_SECOND`) and the tail's whirl named, shared with the flight up; the throw caught on the hover line finds its room there again; the room clear of covers up to the top of its bob; dated lines in 115 and 164. Found by a run under load and fixed: a funny turn could stretch the hovering drop a pixel over the tabs (now held unstretched), and the scroll-through looked before a slow flight had landed (it now waits for it to settle). Not changed: call 1 (the review asked to put it to the owner, so it is here) and the spec's polling of the scroll.
- Checked in the app on port 5174 at 375 × 560: scrolled 60 px, the Oscillators' edge gone under the tabs, Bead hovering 3.5 px under the strip, its tail down and whirling.

**To try in the app:**
- On a phone (or the window at 375 px), with Bead on, scroll down slowly from the top: as the Oscillators' edge goes under the tabs, Bead takes off on its whirling tail and settles just under the tabs where it was, bobbing. Scroll on until the Filter's edge comes into view: it drops onto it. Scroll back up: as an edge comes out from under the tabs, it flies up onto it.
- The same in 2 × 2 (a window about 690 px wide and short), under the header.
- With no edge in view, throw it: it catches itself on its tail under the tabs.
- With reduced motion (the system's setting), it hovers still, its tail straight down.
