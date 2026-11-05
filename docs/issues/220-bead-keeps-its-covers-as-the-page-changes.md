# 220: Bead keeps its covers as the page changes

**What to build:** Part (a) of [184](./184-beads-frame-in-parts.md), split by the owner on 2026-11-03: review 18's finding 4 on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that Bead costs 0.6 to 0.9 ms and an extra style recalculation a frame, mostly from looking up every panel and tooltip on the page each frame (5 fps of the Demo at 4× throttling). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, not yet released; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

From 184 (Claude's calls, open to the owner, 2026-11-02):

1. **Nothing Bead does changes:** a speed-up, its behaviour held by the mascot spec as it is.
2. **Measured on a quiet machine,** before and after: Bead's frame-cost test failed under load before (1.0 to 1.9 ms against 1 ms), so a loaded machine says nothing.

## Agent Brief

**Category:** enhancement
**Summary:** Each frame, Bead searches the whole page for the panels, tips and cards it must keep clear of, and reads their boxes.

**Current behavior:** Every frame Bead looks up every open panel, tooltip and docked card on the page and reads where each is.

**Desired behavior:**
- Bead keeps its list of what covers the page up to date as panels, tips and cards open and close, rather than searching each frame.
- Their boxes are read again only on a scroll, a resize or a change to the page's layout, not every frame.
- Bead stays clear of them exactly as now, the moment one opens.
- The text boxes it avoids are read again as the page changes too, not only every 0.5 s, on a page scroll or a resize: a panel opening, or a scroll inside one, no longer leaves it over text for half a second (the 1.22.0 code review, inbox, triaged 2026-11-03).

**Key interfaces:**
- What Bead must keep clear of (panels, tips, docked cards, text)
- Bead's frame

**Acceptance criteria:**
- [ ] Bead's frame cost measured idle and in the Demo, before and after, on a quiet machine, the figures in the issue; under 0.3 ms idle
- [ ] A panel, a tip or a card opening moves Bead off what it covers as before (the mascot spec, unchanged, in both browsers)
- [ ] Bead's frame-cost test passes on a quiet machine
- [ ] A panel opened over Bead's resting text moves it within a frame or two, not half a second (a browser test)

**Out of scope:**
- The render loop's order of reads and writes ([221](./221-the-frame-reads-the-page-before-it-writes.md))
- Bead's choices as functions ([222](./222-beads-choices-as-functions-with-tests.md))

## How it was built

The night of 2026-11-03, on `night/2026-11-03`, test-first.

**Where the time went.** A CPU profile of Bead idle in Chromium (1440 × 900) put 0.2 ms of every frame in one `querySelectorAll`: the search for the cards, tips and panels. The text read cost about 0.03 ms a frame on average, most of it looking up, for each line of text, whether it sat inside a cover.

**What was built.**
- **The covers are watched, not searched for** (`watchCovers` in `mascotCovers.ts`, beside the list itself). It keeps the list up to date as covers are put in, taken out, shown and hidden. It reads their boxes again only once the page has changed, scrolled (the window or anything in it) or resized, or while a cover, or what holds it, is in a transition or an animation. A drawing's shapes (the Viewers', the plots') and the `data-` and `aria-` marks that no style rule names, set every frame, are not changes. Bead's own drawing is not either.
- **The text is read again at once** as a cover opens, closes or moves with the page, or the window resizes. It is read within 0.1 s of a scroll inside the page as well as of the window, or of a cover sliding (in a transition, or carried by a scroll). Otherwise it is read twice a second, as before.
- **The text's walk passes over what is not text whole,** instead of looking up each line's place.
- **Tests:** browser unit tests for the watch, and two mascot browser tests: Display opened over Bead sets it off within 3 frames, and text scrolled under it inside the page within 10 frames (up to 30 before; red before the change).

**The figures.** Chromium, 1440 × 900, a quiet machine (load about 2 to 3). This is the frame work with Bead added, over the same frame without it: the mean of 8 s, three rounds each. The 4× runs were throttled through DevTools.

| | Before | After |
| --- | --- | --- |
| Idle, 1× | +0.63 ms (2.12 over 1.50) | **+0.15 ms** (1.63 over 1.48) |
| Demo, 1× | +0.32 ms | +0.12 ms |
| Idle, 4× | +1.34 ms | +0.49 ms |
| Demo, 4× | +2.22 ms, 22.3 fps against 25.2 | +1.32 ms, 22.8 fps against 25.0 |

- **The extra style recalculation stays:** 2.0 a frame idle with Bead, against 1.0 without it. It comes from reading the page after a write, in the order of the frame's reads and writes, which is [221](./221-the-frame-reads-the-page-before-it-writes.md).
- The 4× idle figure (0.49 ms) is over 0.3 ms. The 0.3 ms target was read as the M2's own speed, the frame-cost test's.
- WebKit's clock counts whole milliseconds, so it was not measured.

**The calls (Claude's call, open to the owner).**
1. **What makes the text be read again at once:** a cover opening, closing or moving with the page, and the window resizing. Other changes to the page wait for the twice-a-second read, as before. Reading at once on every change tried 30 reads a second in the Demo, and read every 0.1 s still cost 1.2 ms a frame at 4× in the Demo. No page change seen moves text under Bead without moving a cover: the panels are all drawn over the page.
2. **The marks that no style names:** a `data-` or `aria-` attribute changes how the page looks only through a style rule that names it. So the watch reads the style rules once, as it starts, and passes over the others: the Viewers set some forty a frame for the tests. The page loads no stylesheet later. One that did would need the watch to read the rules again.
3. **The criterion "a panel opened over Bead's resting text"** is tested by its two parts. Display opened over its edge sets it off within 3 frames, counting the frame of the click. Text brought under it by a scroll inside the page sets it off within 10 frames. The panels hold no text Bead keeps off, and move none.
4. **A change seen only by its size:** a cover growing with no change to the page is seen by a ResizeObserver, after the browser lays the page out, so a frame later than before. Nothing in the page does this today.

**Tests.**
- `npx tsc`, the lint, and the unit tests of the touched files: the mascot modules with the watch's, 183 passed.
- The whole mascot spec, after the first commit and again after the review's fixes: Chromium 51 passed each time, the frame-cost test among them; WebKit 48 passed and 3 skipped each time. No test failed.
- The review (standards and spec) found the docs of 164 and 181 out of date, comments telling history, a cover moved in the page losing its order, and the text read every frame while a cover slides. All were fixed. The rest are calls 1, 2 and 4 above.

**To try in the app.** Bring Bead out and leave the page idle, then open and close Display, Tempo, the Patches and a tip over its edge. It should leave at once, as before. Play the Demo and drag its card over Bead: the same. To see the speed, open Chrome's DevTools Performance panel with 4× CPU throttling, record 5 s idle with Bead and without it, and compare the scripting time a frame.

