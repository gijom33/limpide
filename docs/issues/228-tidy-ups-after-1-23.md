# 228: Tidy-ups after 1.23

**What to build:** From the inbox (2026-11-02 and 2026-11-03): the 1.22.0 and 1.23.0 code reviews' standards and smells, none a bug. Polish for v1 ([131](./131-v1.md)), as [196](./196-tidy-ups-after-1-21.md) was after 1.21.

**Blocked by:** [222](./222-beads-choices-as-functions-with-tests.md) for the items in Bead's frame (it reshapes that frame)

**Status:** done (2026-11-06). Built (2026-11-05) on night/2026-11-05 and merged into main on 2026-11-06, approved by the owner: "All issues seem tobe implemeted fine", then "Merge the night"; released in 1.26.0

## Decisions

Claude's calls, open to the owner (2026-11-03, triage):

1. **Nothing anyone sees changes;** every test passes unchanged.
2. **The glossary's words in the code:** issue 195's fades at the top of the range are named Fade, not Dip (the glossary's Dip is the 3 ms drop before a Note).

## Agent Brief

**Category:** enhancement
**Summary:** Small code-quality slips the last two reviews found: misnamed things, logic written twice, refs written during render.

**Current behavior (each a review's finding):**
- Issue 195's top-of-range fades named with "Dip" (`RESONANCE_DIP`, `LEVEL_DIP`, `dipCurve`, `toDip`, …).
- Which LFO a Rate belongs to worked out in four places (the Patch's knob turns, the Tutorials' readiness, the Geek Layer's Rates, the MIDI hook's step resets).
- The reduced-motion scroll choice ("auto" or "smooth") in five copies.
- The Patch bar copying the header panel hook's focus-out instead of using it.
- Two refs written during render (the Tour card's, focusBack's), where 196 moved the Timeline's out.
- In Bead's frame, three bare 13s beside `HEIGHT / 13`; six positional arguments to the cling.
- A Controller passed down three calls to reach the relative steps; the next Tutorial worked out again in the app though its card has it; a step-reset list written twice in the MIDI hook; `type At = Required<GeekAt>`.
- In the Scope: fundamental, fundamentalAt and now travelling together; the hover drawing written twice; `vibrato` meaning a flag and a number; Glow's buffer inline in the Scope's draw; a comment in Cycle Lock calling scratch arrays kept between frames.
- About found without exact in a test.
- Glow's old traces drawn at a new width after a cycles or Note change, untested.

**Desired behavior:** each mended as the review suggests, or kept with the reason in the issue.

**Key interfaces:**
- The Filter's design, the engine, the Patch, the Tutorials, the Geek Layer, the MIDI hook, the header panels, the Tour card, Bead's frame and cling, the Scope and Glow

**Acceptance criteria:**
- [x] Each item mended or kept with its reason
- [x] A test of Glow's traces after a cycles change
- [x] tsc, the lint, every unit and browser test pass unchanged

**Out of scope:**
- Behaviour changes

## How it was built

Built at night (2026-11-05) on night/2026-11-05, on top of 241 and 242, test-first where there was behaviour (the Glow). Each item:

- **Dip at the top of the range:** mended. Issue 195's curves and gains are `RESONANCE_FADE_CURVE`, `LEVEL_FADE_CURVE`, `fadeCurve`, `FADE_POINTS`, `toFade`, `resonanceFade`, `levelFade`; Dip stays the glossary's 3 ms drop.
- **Which LFO a Rate belongs to, in four places:** mended. `rateOf` (the Patch) gives the LFO and the Sync a Rate knob turns it in; `knobTurns`, the Tutorials' `readyFor` and the Geek Layer's Rate tip read it, and the MIDI hook restarts a Rate's steps where `rateKnob` changes.
- **The reduced-motion scroll in five copies:** mended, one `scrollBehavior` beside the Demo's glide.
- **The Patch bar copying the header panel hook:** mended. It uses `useHeaderPanel`, which now asks an `onEscape` first (the search cleared before the panel closes).
- **Two refs written during render:** mended, the Tour card's and focusBack's written in effects, as 196 did the Timeline's.
- **Bead's frame:** mended. `ROWS` stands for the three bare 13s; `clingFor` takes the control and one `ClingAround`. Bead's pictures keep their own 13 (`skyLift`): outside the frame, and a new import for one number.
- **The Controller passed down three calls:** mended. The control surface works a Relative message's steps out once, in `apply`, and hands the steps on; `isRelative` answers once whether a mode is Relative.
- **The next Tutorial worked out again in the app:** mended; the card hands its own `next` to `onStartNext`.
- **The step-reset list written twice:** mended, one list of what a knob gathered towards a step.
- **`type At = Required<GeekAt>`:** mended, the alias gone.
- **fundamental, fundamentalAt and now travelling together:** named, as the Scope's `ScopePitch`. Kept as three fields of the Scope's options and of the Tap's props: the engine gives them as three, and a browser test passes them so.
- **The hover drawing written twice:** kept. The readout's lines are built twice a hovered frame, for its box and for the canvas's one-line text: one small function, and the one-line `hoverReadout` is what the tests read. Built once, `hoverReadout` would have served the tests alone (the review's note).
- **`vibrato` a flag and a number:** mended; the flag is `withVibrato`.
- **Glow's buffer inline in the Scope's draw:** mended with the next item: the Glow keeps what each trace was drawn for, so the Scope's draw only hands it the trace and its cycles, and the Spectrum's own filter by axis and width moved into the Glow.
- **A comment in Cycle Lock:** mended; it calls its arrays scratch, written afresh by each lock.
- **About found without exact:** mended in every test that looks the button up.
- **Glow's old traces at a new width after a cycles or Note change:** mended and tested. After a change of the cycles shown, the traces of the old count are passed over rather than drawn across the new width, as the Spectrum already did on a change of its axis or width (issue 199). Another Note over the same cycles keeps them, as each trace spans its cycles across the width; a low Note that shows fewer cycles passes them over.

Claude's calls, open to the owner:

1. **The Glow after a cycles change** is the one thing that can be seen: for a quarter of a second after a cycles change, the old count's traces no longer show stretched under the new ones. Decision 1 said nothing seen changes; the Spectrum's rule since 199 was taken as the intent, and the old traces were a glitch.
2. **Renames in the tests:** the Filter's test imports the renamed curves, Glow's test helper gives a key, and the About lookups are exact; no test's expectations changed.

**To try in the app:** with Display's Glow on Scopes, hold a Note and change the cycles: the trail starts afresh at the new count, with no stretched traces. The Patches panel: Escape clears the search, then closes the panel; Tab out and a press elsewhere close it. A Tutorial's last card: Next: starts the next Tutorial. Reduced motion: the Tour and the Tutorials still jump rather than glide.


**Tests run:** `npx tsc` and `npm run lint` clean; the unit and browser tests of the files touched (61 files, 1494 tests, then the 22 the review's fixes touched) green; 16 Playwright specs over the touched UI (about, demo, mascot, tour, tutorial, patches, patchSearch, header, keyboardAccess, dockedCards, sectionStrip, viewerControls, midiLearn, quickSetup, geek, lfo), 409 tests each in Chromium and WebKit. One failure in each, both green rerun alone, so load flakes, their limits left as they were: Chromium's "off what comes over it at once (issue 220) … within a tenth of a second" (load averages up to 22.8 during the run, 2.7 alone) and WebKit's "never under a card (issue 164) … on a phone, with the Tour's card docked" (8.9 during, 3.1 alone). The code review (standards and spec) found no behaviour slip; its notes are mended (`ef7e1c1`).
