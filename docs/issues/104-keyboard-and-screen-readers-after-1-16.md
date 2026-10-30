# 104: Keyboard and screen readers after 1.16

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 6, [report](../reviews/2026-10-30/6-accessibility.md), with review 12 on the header's order). Four gaps:

- Enter or Space on a Demo segment, or an arrow key on the Demo card, stops the Demo instead of jumping, and focus falls to the page (WCAG 2.1.1, 2.4.3). The segments' size is [99](./99-demo-segments-as-targets.md).
- At 860 px and below the header's Tab order is not the screen's: after Next Preset, focus goes down to the octave buttons, up to Hold, MIDI, Display and About on the right, then left to Demo, Tutorial and Song (WCAG 2.4.3). From 861 px up it matches. Issue 44's "one order, focus follows" no longer holds since the header relayout of 2026-10-29.
- At 1440 × 900 the docked Tutorial card hides 13 of 71 Tab stops (LFO 1's Destination, all of LFO 2), and the page cannot scroll them clear (WCAG 2.4.11); picking a Tutorial and each Next drop focus to the page (2.4.3).
- Greyed-out controls (Pulse Width on a Saw, a silent Osc 2's tuning, the Filter Envelope at Amount 0, an LFO's Rate at Depth 0) say nothing to a screen reader (WCAG 1.3.1).

**Blocked by:** none

**Status:** done (2026-10-30). The Demo's parts play and move from the keyboard without stopping it, Tab follows the header as it stands at every width, the Tutorial card takes the focus when picked, keeps it, and never hides a focused control, and each greyed-out control tells a screen reader why.

## Agent Brief

**Category:** bug
**Summary:** Everything the pointer can do on the Demo card and the Tutorial card works from the keyboard, focus follows the screen at every width, and a greyed-out control says why.

**Current behavior:** as listed above.

**Desired behavior:**
- **Demo card:** Enter or Space on a segment plays from its part, as a click does, and focus stays on that segment; arrow keys move between segments without stopping the Demo. Keys meant for the piano still play while focus is elsewhere.
- **Header:** at every width, Tab reaches the header's controls in the order they stand on screen, left to right, then top to bottom. The look of each layout stays exactly as it is now.
- **Tutorial card:** at every layout, a focused control is never hidden by the docked card: the page can scroll it clear (room below the last section, or scrolling on focus). Picking a Tutorial puts focus on its card; Next keeps focus on the card's Next (or the Step's control), never the page.
- **Greyed-out controls:** each still turns, and tells a screen reader that it does nothing now and why ("no effect while Osc 2 is silent"), through its accessible description. Its look stays as it is.

**Key interfaces:**
- The Demo card's segments
- The header's groups at the phone and 2 × 2 widths
- The docked Tutorial card and its Next
- What greys a control out

**Acceptance criteria:**
- [x] A keyboard-only test plays the Demo from a chosen segment with Enter and Space, and moves along with the arrows, without stopping it
- [x] The header test checks Tab order against the controls' positions on screen at the phone, 2 × 2, laptop and wide sizes, and its name says what it checks
- [x] At 1440 × 900 with the Tutorial card docked, every Tab stop can be focused and is unobscured; picking a Tutorial and pressing Next keep focus out of the page body
- [x] Each greyed-out control's accessible description names why it is inactive, and loses it when active again
- [x] The design audit and the screenshots of every layout are unchanged

**Out of scope:**
- The segments' size (99)
- The greyed-out controls' contrast: kept at the design principles' 30 %, since they still turn and now say why (Claude's call, open to the owner)
- The review's other notes (the welcome's focus on the build link, the Display panel left open after Tab, the Viewers' descriptions): left in its report for a later pass

## How it was built

- **The Demo's parts** (`src/ui/DemoBar.tsx`, `src/demo/stopRule.ts`): the stop rule lets Enter, Space, the arrows, Home and End through on the Demo's own card and button, so Enter or Space on a part plays from it as a click does, and Enter on the lit Demo button now stops it (it used to stop and restart it). Each part's button keeps its key whatever plays (the fill alone is new on each start), so the focus stays on it as the parts go by. The parts are one Tab stop, on the part playing or the one last focused; the arrows, Home and End move along them without playing (Claude's call, open to the owner: the radio groups' and tabs' pattern, so Tab passes the 15 parts in one step). None of it depends on where the parts sit, so it holds if [99](./99-demo-segments-as-targets.md) moves them. Tests: `src/demo/stopRule.test.ts` (five rows), `e2e/demo.spec.ts` "from the keyboard alone…".
- **The header** (`src/ui/App.tsx`, `src/ui/hooks/useMediaQuery.ts`): up to 860 px the header's groups are put in the DOM as the screen shows them (the Wordmark and the Patch, Demo to Song, Hold to About, then the keyboard), wider as before; keyed, so React moves them when the window crosses 860 px rather than starting them again. The CSS is unchanged. Test: `e2e/header.spec.ts` "at W×H (size) Tab meets the header's controls as they stand on screen…" at the phone, 2 × 2, laptop and wide sizes (each stop right of the last, or on a row below it); the placement test is renamed for what it checks.
- **The Tutorial card** (`src/ui/docked.ts`, `src/ui/TutorialCard.tsx`): a docked card (the Tutorial's or the Demo's) scrolls a control the keyboard focuses out from under it (keyboard focus only, so a knob pressed by its edge never moves under the pointer), where the page can scroll; the Tutorial card keeps room below the last section, so at 1440 × 900 all of them come clear. A picked Tutorial focuses its Start, after the welcome or the panel has put the focus back on their buttons; Next waiting for its Step is `aria-disabled` instead of `disabled`, so it keeps the focus and looks the same; when the button the focus was on goes (Back on the first card, "Do it for me" once made, Finish), the focus goes to the card's way forward. It still never takes the focus from a control being turned. Tests: `e2e/tutorial.spec.ts` "picking a Tutorial puts the focus on its card…", "at 1440 × 900 … every Tab stop comes clear of the card" (it found 9 stops under the card before the change), and the welcome's test.
- **Greyed-out controls** (`src/ui/inactive.tsx`; `Knob`, `Fader`, `Segmented`, `WaveformPicker`, `Tooltip`): `inactive` is now the reason, such as "No effect while Osc 2 is silent", "No effect unless Osc 1's Waveform is Pulse", "No effect while the Filter Envelope Amount and Osc 2's Env Amount are 0", "No effect while LFO 1's Depth is 0", "No effect with more than one Voice". It goes in a hidden element that the control's description reads first, ahead of its tooltip, and goes when the control acts again; the tooltip now adds its own id beside it instead of replacing it. Test: `e2e/keyboardAccess.spec.ts` "a greyed-out control tells a screen reader why…".
- **The look:** screenshots at 390, 690, 1000, 1440 and 1920 px, of the page and of the Tutorial card at Step 1, were pixel-identical before and after (a throwaway comparison, not kept). The layout specs passed, also with Verdana forced. The Demo's tip no longer says any key stops it.
- **Tests run:** `npx vitest run` (834 passed); the whole Playwright suite in Chromium and WebKit (857 passed; the issue 81 Tooltips test failed once under load and passed alone). The two Tab-walking tests skip WebKit, as `e2e/layoutPolish.spec.ts` does, since Safari tabs to buttons only when its settings ask it to; the Tutorial focus test runs in both.
