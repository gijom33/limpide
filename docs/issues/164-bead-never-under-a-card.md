# 164: Bead never under a card

**What to build:** The owner's bug (inbox, 2026-10-31), on a phone during the Demo on the night branch: "Bead should never be hidden by the info boxes." Bead lives on the Sections' top edges and is drawn under the header and the docked cards (issue 115's brief: "under the header and the cards"), so when the Demo's card, a Tutorial's or the Tour's docks over its edge, Bead disappears behind it. Polish of Bead in v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-10-31) on night/2026-10-31, for the owner to try

## Decisions

1. **Bead is never hidden by a card.** Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

2. **Bead moves, the card stays:** Bead stays drawn under the cards (so it never covers a card's words or buttons), and never stands where a card, a tip or an open panel covers it. When one comes over its spot, it goes, by its usual moves, to the nearest stretch of an edge in view and clear of them; when every edge in view is covered, it hops up onto the card's top edge and stands there until it can go back.
3. **Its room counts the cards:** the stretch of an edge Bead may roam leaves out what a card or a tip covers, as it already leaves out the controls, so a stroll never takes it under one.
4. **On a phone and in 2 × 2,** where Bead keeps in view as the page scrolls, the same: the docked card's top is an edge it may stand on when nothing else is clear.

## Agent Brief

**Category:** bug
**Summary:** Bead disappears behind the Demo's, a Tutorial's or the Tour's docked card when it docks over Bead's edge, on a phone above all.

**Current behavior:** Bead is drawn under the header and the docked cards. On a phone during the Demo, the Demo's card docks over the edge Bead stands on, and Bead is hidden until it happens to move away.

**Desired behavior:** Bead never stands where a docked card, a tip or an open panel covers it. Its room along an edge leaves those out; when one comes over its spot it moves, by its usual moves, to the nearest clear stretch in view; when no edge in view is clear, it stands on the card's top edge until one is. It is still drawn under the cards, so it never covers their words or buttons.

**Key interfaces:**
- Bead's choice of where to stand and roam (its room along an edge, what it leaves out)
- The docked cards' (the Demo's, a Tutorial's, the Tour's) boxes and when they change
- The tips and panels that open over the page

**Acceptance criteria:**
- [x] On a 375 px phone, during the Demo, Bead is in view and not under the Demo's card at any part
- [x] The same with a Tutorial's card and the Tour's
- [x] Bead never covers a card's words or buttons
- [x] The mascot spec covers it in both browsers; Bead's frame-cost test passes as before

**Out of scope:**
- Bead pointing the way ([151](./151-bead-points-in-the-tour-and-tutorials.md))

## How it was built (2026-10-31, on night/2026-10-31)

**What was built:**
- **What covers the page:** each frame Bead reads the boxes of the docked card (the Demo's, a Tutorial's or the Tour's), the open tips, the open panels and menus (Patches, Display, Tempo, MIDI, the Tutorials list, a Destination's menu, the Learn bar, Quick Setup) and the Preset's description. `clearAlong` (`src/ui/mascotPlace.ts`) gives the stretches of a line where the drop is under none of them.
- **Its room** along an edge keeps within those stretches (decision 3). With nothing over the edge it is as before; with something over part of it, Bead takes the clear run nearest to it and walks there.
- **Its line:** an edge with no clear stretch is never kept nor taken. On a phone and in 2 × 2, `choosePerch` takes another edge in view; with every edge in view covered, the docked card's top edge, until one is clear again (decisions 2 and 4). In three and four across the same, from its home section or a visit.
- **The rest:** thrown, it lands only on a clear spot; it surfs an LFO's plot only while nothing covers the plot. Its layer is unchanged, under the header and every card, tip and panel, so it never covers their words or buttons.
- **The words:** a line in bead.md's "Where it lives", and CONTEXT.md's Mascot.

**Claude's calls, open to the owner:**
1. **What counts as a cover:** the cards, the tips, the panels and menus listed above, and the Preset's description. The bubble over a dragged knob and the About window do not: the bubble is small and brief, and About covers the whole page.
2. **The card's top only when an edge in view is covered.** With no edge in view at all, Bead hangs under the header as before (since 2026-11-01, issue 142's decision 3: it hovers there on its tail instead); it goes onto the card's top only when the edges in view are all covered. So on a phone, scrolling, it may drop onto the card's top as an edge comes in under the card, then fly up to that edge once it clears the card.
3. **Surfing in the Demo, wide windows:** in three across at 1440 × 900 the Demo's card covers the LFOs' plots' feet, so Bead no longer surfs there; it conducts or plays air guitar instead, as when no LFO is on. Dragging the card aside (or a taller window) brings the surf back.
4. **Nowhere clear:** where a panel covers every edge and there is no card (Display or Patches open full width on a phone), Bead stays where it is, under the panel, until it closes. The panels are brief, and there is nothing in view to go to.
5. **Its whole box, standing:** what is kept clear is the drop's box standing (44 × 26 px). A leap, a hat or a prop may pass a little under a card beside its stretch for a moment.

**Tests run:**
- `npx tsc` and `npm run lint`.
- Unit: `src/ui/mascot*.test.ts`, 102 passed: `clearAlong` (4), `nearestSpan`, `choosePerch` with covered edges and the card (4).
- The mascot spec, after the review's fixes: Chromium 25 passed; WebKit 24 passed and 1 skipped (the frame cost is Chromium only). It now has, on a 375 px phone, the Demo's, a Tutorial's and the Tour's card docked, the page scrolled down and up, Bead settled at each step: in view and nowhere under the card. Also, in three across, Display opened over its edge. The new phone test failed on the code before this issue ("under": true). The surf test now drags the Demo's card off the plot first (call 3).
- The whole Vitest and Playwright suites were not run: only the mascot spec has Bead out.

**The review** (standards and spec, since `7f850f9`). Fixed:
- The Destination menu added as a cover.
- The room kept to its leftmost run when nothing covers the edge, as before.
- A check no caller reached removed.
- The cards found by role in the spec, and a test for a panel.
- bead.md and CONTEXT.md updated.

Not changed: call 4. The covers are read every frame, by one query; the frame-cost test passes.

**To try in the app:**
- On a phone (or the window at 375 px), with Bead on, play the Demo and scroll up and down through the page. Bead should never go behind the Demo's card. When the card comes over its edge it moves to another; with nothing else clear, it stands on the card's top.
- The same with a Tutorial (the Patches panel's Tutorials) and the Tour (About, Take the Tour).
- In three across, open Display: Bead leaves the top right edge for one clear of the panel, and goes home once Display is closed.

