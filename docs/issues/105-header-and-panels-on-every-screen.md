# 105: The header, panels and cards on every screen

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 1, 2, 3 and 7, [curious contact](../reviews/2026-10-30/1-curious-contact.md), [synth enthusiast](../reviews/2026-10-30/2-synth-enthusiast.md), [UI maniac](../reviews/2026-10-30/3-ui-maniac.md), [recruiter](../reviews/2026-10-30/7-recruiter.md)):

- From 601 px up the MIDI panel is as wide as the MIDI button (60 px at 1440, 34 at 690): one word a line, MIDI Learn and Quick Setup clipped, the Bend choices over the Amp section.
- The Patch name is cut even when short: every Preset reads "I…" or "S…" at 601 px (a 17 px text box), and longer names (Split Octave Bass) are cut from 861 to 1100 px.
- On a phone (393 × 659, and 393 × 700 in LinkedIn's browser) the welcome's credits push Play the Demo, Follow the Tutorial and Close below the fold, with no hint that it scrolls.
- On a phone the Bass Tutorial's Step 4 points at the Oscillator Spectrum, hidden under its own docked card; the page does not scroll to it, and the Step's text is cut short with "…".
- The mouse wheel cannot turn Osc 1's or Osc 2's Octave (a notch rounds back to the same octave), nor small trackpad scrolls the Semitone.

**Blocked by:** none

**Status:** done (2026-10-30). The MIDI panel is its content's width from 601 px up; the Patch name shows short names whole at 601 px and takes its column's spare room from 861 px; the welcome's buttons stay on a short phone's first screen, the credits scrolling above them; a Tutorial Step brings the Viewer its note names clear of the card, its note whole on a phone; a wheel notch moves an Octave or a Semitone one step.

## Agent Brief

**Category:** bug
**Summary:** What the reviewers found cut, hidden or stuck on particular screens works on every layout.

**Current behavior:** as listed above.

**Desired behavior:**
- **MIDI panel:** as wide as its content needs (up to its existing maximum) at every width, its words on whole lines, nothing clipped, the Bend choices inside its border.
- **Patch name:** a Preset's name shows whole wherever the header has the room; at 601 px at least a short name ("Init", "Kick", "Breathing Pad") shows whole. Where a long name must be cut, it is cut with an ellipsis after as many letters as fit.
- **Welcome on a phone:** Play the Demo, Follow the Tutorial and Close are on the first screen at 393 × 659; the credits come after them, or scroll inside the card with a visible hint.
- **Tutorial on a phone:** each Step's control and the Viewer it points at are scrolled clear of the docked card, and the Step's whole text can be read.
- **Stepped knobs:** each wheel notch or trackpad scroll that goes past a step's threshold moves a stepped knob (an Octave, a Semitone, any choice-like knob) by one step; small scrolls add up until they do.

**Key interfaces:**
- The MIDI panel, the Patch picker's name, the welcome card
- The Tutorial's scrolling of a Step into view
- The knob's wheel handling for stepped Parameters

**Acceptance criteria:**
- [x] At 601, 690, 1440 and 1920 px the MIDI panel's content fits inside it (no clipping, no wrap mid-word)
- [x] At 601 px "Init" shows whole; at 861 to 1100 px a test lists the names it cuts, none under the room it has
- [x] At 393 × 659 the welcome's three buttons are inside the viewport on first load
- [x] On a phone, each Step of every Tutorial brings its control and Viewer clear of the card (the existing check extended to the Viewer a Step names)
- [x] One wheel notch on an Octave moves it one octave; ten small trackpad deltas adding to one notch move a Semitone one step
- [x] Every test passes in Linux's fonts too (the Verdana emulation)

**Out of scope:**
- The icon-only header buttons with Tips off ([106](./106-header-icons-named-with-tips-off.md), waiting on the owner)
- The review's other nitpicks (the piano off-centre outside 1205–1924 px, first rows not aligned across columns, the tabs' hidden dots' space): left in review 3's report for a later pass

## How it was built

- **The MIDI panel** (`src/styles.css`): from 601 px it hangs from its button, `position: relative`, and its `width: min(380px, 100%)` was the button's. It is now `max-content` up to 380 px, its right edge still on the button's: 380 px at 601, 690, 1440 and 1920, nothing outside it, MIDI Learn and Quick Setup whole. Test: `e2e/layoutPolish.spec.ts` "at W×H the MIDI panel's content fits inside it, every word whole" (with a stand-in Controller, so the Bend choices show), and the under-its-button test now at 601 and 1920 too. Red before the change.
- **The Patch name** (`src/styles.css`): its left padding, kept only to centre the name against the changed dot's room on the right, is a gap of 8 px; in the sections 2 × 2 the header's groups and the logo sit 8 px apart (12 before) and the playing and set-up buttons pad 4 px (6). At 601 px the text box is 65 px (43 in Verdana, 17 before): Init, Kick, Bass and Acid show whole; the longer names (Soft Triangle, Breathing Pad) are still cut there. From 861 px the fixed widths still place the keyboard, and where the name's own column is wider than what it holds the name takes the spare room, up to the widest Preset's 172 px, moving nothing else: no Preset is cut from 1279 px up (7 were at 1100 to 1279). Tests: `e2e/header.spec.ts` "the Patch name": at 601 px Init, Kick, Bass and Acid whole; at 861, 900, 1000, 1100 and 1279 px each Preset's name shown in turn, the cut ones listed in the test's annotations, each wider than the text box, and the column with no room to spare wherever one is cut.
- **The welcome** (`src/ui/About.tsx`, `src/styles.css`): the card is never taller than the window; on a short one the credits give way, scrolling inside the card (three lines at least) with their foot faded while more is below, so the buttons stay at the bottom, where the owner put them (2026-10-27), and on the first screen. At 393 × 659 with the published site's Privacy paragraph they end at 626 px (681 px was their top before). Tests: `e2e/welcome.spec.ts` "on a short phone": at 393 × 659 and 393 × 540 (standing in for the Privacy paragraph, which the tests' build leaves out) the three buttons wholly in the viewport, the credits faded until scrolled to their end, the card itself not scrolling.
- **The Tutorial on a phone** (`src/tutorial/tutorial.ts`, `src/tutorial/tutorials.ts`, `src/ui/TutorialCard.tsx`, `src/ui/docked.ts`, `src/ui/SectionStrip.tsx`): a Step names the Viewer its note points at (`viewer`: a Tap's Scope or Spectrum, or the Envelope Timeline); the Ideal Step's is the Oscillator Spectrum. `bringClear` (beside issue 104's focus check, which now uses it) scrolls the least that shows the Step's control and that Viewer between the header, as it will be after the scroll (on phones and 2 × 2 its rows slide away going down; `headerBottomAt`), and the card; where both do not fit, the control first until the Step is made, then the Viewer. The ring's scroll margins are now the room its ring and target take (28 px above, 6 below). On a phone a made Step's note shows whole; the instruction and the first and last cards keep their two lines. Tests: `src/tutorial/tutorials.test.ts` "points each Step at the Viewer its note names" (red before the Steps named them); `e2e/tutorial.spec.ts` "on a W, each Step of P brings its control, then the Viewer its note names…", every Tutorial at 375 × 812, 393 × 659 and 690 × 830, replacing the Wobble-only check: before the change the Bass Ideal Step's Oscillator Spectrum sat at 500 to 617 px under the card's top at 553.
- **Stepped knobs** (`src/ui/paramControl.tsx`, `Knob.tsx`, `Fader.tsx`): a stepped control gathers scroll in one direction and moves one step for each 90 px (a notch: Chrome's 100 px, Firefox's 3 lines of 33), small scrolls adding up; what is left over is dropped, so a notch never moves two steps, and gathered scroll is forgotten after a second. Knobs without steps turn 4 % a notch as before. Test: `e2e/knob.spec.ts` "one wheel notch turns a stepped knob one step…" (Osc 1's Octave up and back, eight 10 px scrolls leaving Osc 2's Semitone, two more moving it, Resonance 4 %), red before.
- **Docs:** "Since then" lines on [40](./40-preset-tutorials.md) (decision 7, the note whole), [53](./53-presets-and-synth-features.md) (4 % a notch) and [57](./57-tutorial-player.md).
- **Tests run:** `npx vitest run` (838 passed); the full Playwright suite in Chromium and WebKit (904 passed, 17 skipped, 13 failed under the load of the whole run: the eight WebKit contrast audits, four other WebKit tests and one Tutorial test, each at or near its timeout; all 13 passed when rerun). The stepped-knob test was one of them: its scrolls now go in one `evaluate`, as gathered scroll is forgotten after a second, and it passes in both browsers. The layout specs (header, layout polish, welcome, About, Tutorial, docked cards, fits the screen, in-between, toolbar, four across, section strip, the design audit) again with Verdana forced: 352 passed, 6 skipped.
- **Claude's calls, open to the owner:**
  1. **The Patch name from 861 to 1199 px** keeps its fixed width: the header's spare room there is right of the keyboard, and giving it to the name would move the piano further off-centre (up to 100 px at 1000), which the owner's 2026-10-29 layout keeps central where it can. The name takes only its own column's spare room, so it moves nothing; longer names (Soft Triangle, Split Octave Bass) keep their ellipsis there.
  2. **"Breathing Pad" at 601 px** is still cut: whole it needs about 90 px of text, and the 2 × 2 header at 601 px leaves 65 (43 in Verdana) beside the buttons' words. Init, Kick, Bass and Acid show whole.
  3. **Scrolling in the credits** rather than putting the buttons above them: it keeps the owner's buttons at the bottom (2026-10-27).
  4. **The made Step's note whole on a phone** (amends issue 40's decision 7 for the note alone), and **the Viewer before the control** once a Step is made, where both do not fit (the Cutoff knob and the Filter Spectrum are 460 px apart on a phone).
  5. **90 px a step** for the wheel on stepped knobs, any leftover dropped.

