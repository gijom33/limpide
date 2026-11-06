# 246: tidy-ups after 1.25

**What to build:** The 1.25.0 code review's and ripple hunter's leftovers (2026-11-05), the ones not fixed before the release: small standards and smells, two edge cases in 230's remembered fold, a stale test name. Nothing a person sees, but for the two folds. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [228](./228-tidy-ups-after-1-23.md) (its items in Bead's frame and choices come first)

**Status:** ready-for-agent · enhancement. Polish for v1

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
