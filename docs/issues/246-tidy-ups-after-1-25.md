# 246: tidy-ups after 1.25

**What to build:** The 1.25.0 code review's and ripple hunter's leftovers (2026-11-05), the ones not fixed before the release: small standards and smells, two edge cases in 230's remembered fold, a stale test name. Nothing a person sees, but for the two folds. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [228](./228-tidy-ups-after-1-23.md) (its items in Bead's frame and choices come first)

**Status:** done (2026-11-06). Built (2026-11-05) on night/2026-11-05 and merged into main on 2026-11-06, approved by the owner: "All issues seem tobe implemeted fine", then "Merge the night"; ships with the next release

## Decisions

Claude's calls, open to the owner (2026-11-05, triage):

1. **Bead's choices' tidy-ups (items 4 to 6) go into [245](./245-beads-frame-read-decide-draw.md) instead if 245 is built first:** it reshapes the same code.
2. **222's frame still deciding a few things inline** is left to 245, which takes the deciding out of the frame; nothing here.
3. **The two folds (item 8):** a fold made in a private window lasts the session, as it did before 230; the "you are playing now" card opens whole in the corner, as 230's call 5 says, whatever fold was made in 2 × 2.

## The items

1. **The Demo's phone test** (240's helper that the page stays put while a part plays) reads the part and the scroll every 250 ms in round trips: one wait inside the page instead, as the standards ask of timing.
2. **CSS locators where a role would do:** the Demo's parts (`[aria-label^="Part "]`, an image by its name); the caption, tagline, tip-hood and Demo-name locators have no role and stay.
3. **`nextVisitAt`'s bare boolean:** a named option.
4. **In Bead's choices:** `DROP_MIDDLE` and `STEP` beside Bead's own size, where the drawing reads them; `{ left, foot }` typed in two choices and the frame, one type.
5. **The same `moving` checks** (standing, hovering, landing; sliding, clinging) in three choices: named once.
6. **Names:** `rides` (a count) in `looksForPlots`, `clearAt` beside `onScreen` and `inView`, a droplet's `until` (falls to, for rain; rises to, for steam).
7. **The geek tips' `where`** for the Saw, Square and Triangle written three times: once.
8. **230's fold:** read again from storage each time a card opens, so in a private window it resets at each new Tutorial; and the "you are playing now" card, three and four across, takes a fold made in 2 × 2 into the corner.
9. **A mascot test name,** "wide enough for the LFO plots clear of the card": since 230 they are clear at 1440 too.
10. **Three loose claims in the Geek tips** (the fact-check): the Filter's formula is the analogue one, and Web Audio's Filter falls faster near the top (16 kHz at a 2 kHz Cutoff: −44.8 dB against −36.1 at 12 dB, −89.5 against −72.2 at 24 dB): say so in its `where`; a Pulse's "the wave's peak being 1" is true of a ±1 pulse, the one played running −0.5 to +1.5 at 25 %: say which; FM's β leaves out how FM is kept smaller on high Notes: work it in, or say so.

11. **Three flakes in 1.25.0's statistics run** (Chromium, the whole suite): Bead's landing through the Demo's scroll in 2 × 2 (211's test) failed twice in a row, Bead landing 17 px past where the page stopped (5654 against 5637.3), then passed six times alone: find why it can land past the stop, and make the test or the landing hold; the contrast check (what draws a control, WebKit) and 204's acts test failed once and passed alone.

(The grid's 13 rows written bare are already 228's.)

## Agent Brief

**Category:** enhancement
**Summary:** Eleven small tidy-ups from 1.25.0's review: a test's timing, locators, names and options, one shared type and check in Bead's choices, the geek tips' shared words, and 230's fold in two edge cases.

**Current behavior:** As the items above say.

**Desired behavior:**
- Each item as it says, and decision 3 for the folds; nothing else a person sees changes.
- Tests: the fold lasting a session where storage cannot be written; the "you are playing now" card whole in the corner after a fold in 2 × 2; the rest kept passing as they are.

**Out of scope:** the reshaping of Bead's frame (245); 228's items.

## How it was built

Built (2026-11-05) on night/2026-11-05, after 228, 238, 241 to 245, test-first where there was behaviour (the folds, the tips' words). Each item:

1. **The Demo's phone test:** mended. `staysWhileThePartPlays` waits once in the page, frame by frame, until the next part or the time is up, and fails if the page scrolled.
2. **CSS locators:** mended. The Demo's parts are found by role, the group named "Part …" (on a phone the card is whole, so its parts are a group, not the corner's image). The others stay, as the item says.
3. **`nextVisitAt`'s bare boolean:** mended, `{ stacked }`.
4. **In Bead's choices:** mended here, since 245 left it (decision 1). `DROP_MIDDLE` and `STEP` sit in `mascotCling.ts` beside Bead's size, where the drawing reads them too; `Spot` is the one `{ left, foot }` type, in the two choices and the frame.
5. **The `moving` checks:** mended. `settled`, `pointingTheWay` and `inHand` beside `Moving`, used in the choices, the frame and the place.
6. **Names:** mended. `rideCount`, `clearSomewhere`, and a droplet's `fallsTo` (steam that rises keeps none), with `fling`'s `toHeight`: rain falls to it, steam rises to it.
7. **The geek tips' `where`:** mended, written once for the Saw, Square and Triangle.
8. **230's fold:** mended and tested through the app (decision 3). The person's fold is kept for the session as well as in storage, so where storage cannot be written it lasts the session. In three and four across the Demo's card takes the layout's fold: folded while it plays, whole once the Demo stopped. A fold made in 2 × 2 used to fold the "you are playing now" card in the corner, which hid its words with no button to unfold it.
9. **The mascot test name:** already mended. 245 moved that test into `beadFrame.test.ts` without the claim ("through the Demo, each act in turn…").
10. **The three claims:** mended and tested. The Filter's `where` says its formula is the analogue one, and gives the browser's figures near the top (a low-pass at a 2 kHz Cutoff and a Q of 0.71, at 48 kHz: −44.8 against −36.1 dB at 12 dB, −89.5 against −72.2 at 24 dB; checked by hand). The Pulse's peak of 1 is said to be a ±1 Pulse's, and the one played is said to run from −2d to 2(1 − d), −0.5 to +1.5 at 25 %. FM's `where` says FM is kept smaller on high Notes, β with it.
11. **The three flakes:** 211's and 204's tests are now scripted unit tests (245), frame by frame at a steady 60 frames a second, so load can no longer make them fail. In the script, Bead lands about half a second before the page stops, in 2 × 2 and on a phone. The 17 that the browser test measured were milliseconds, not pixels: 5654 against 5637.3 is one frame. A likely cause is a frame dropped under the whole suite's load, but it was not confirmed in a browser, since that test no longer runs there. The contrast check was not touched: it failed once and passed alone, so it counts as a load flake and its limits stay.

**Claude's calls, open to the owner:**

1. **A fold made on the "you are playing now" card in three and four across is the layout's,** so it is not remembered, like a fold made on the small card (230's call 2). This card has no fold button anyway.
2. **The session's fold comes before storage's** while the page is open: a fold made in another tab shows from the next visit, not in this tab.
3. **FM's high Notes are said, not worked out:** the tip knows no Note, and how much FM is kept also depends on Osc 2's ratio.

**What to try in the app:** in 2 × 2, fold the Demo's card and stop it. Widen the window to three across, play the Demo, and play a Note: the "you are playing now" card, whole in the corner. In a private window, fold a Tutorial's card and open another Tutorial: it opens folded. With the Geek Layer on, hover the Filter's Mode, the Pulse waveform and FM: the new words. Nothing else should look different, Bead included.

**Tests run:** `npx tsc` and `npm run lint` clean. The unit tests of the touched files (geek, tips, Bead's choices, frame, place, cling and spray) are green, 229 tests. Eight Playwright specs over the touched UI (dockedCards, demo, mascot, geek, tooltips, touchTips, tour, tutorial) are green: 239 tests in Chromium and 228 in WebKit, with no flake. Those runs came before the review's fixes, which change comments, two names, one check and FM's tip; the unit tests were run again after them. The code review (standards and spec) found no bug; its notes are mended (`ebca1d5`).
