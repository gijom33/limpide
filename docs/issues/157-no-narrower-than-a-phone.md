# 157: No narrower than a phone

**What to build:** The owner's bug (inbox, 2026-10-31), with a screenshot of the night branch in a window 278 px wide: the header's second row (Demo, Tutorial, Hold, Song, the BPM, MIDI, Display, About) squeezed until Tutorial, Hold, Song and the BPM overlap. "Do not allow super narrow screens where buttons overlap." Today nothing sets a narrowest width: the page squeezes to whatever the window is. The layouts are designed and checked from 375 px (the design audit's phone); issue [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (night/2026-10-31) has just added the BPM to that row. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md), whose BPM is in the row that overlaps

**Status:** ready-for-human · bug. Built (2026-11-01) on night/2026-10-31, for the owner to try

## Decisions

1. **No screen so narrow that buttons overlap.** Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

2. **The narrowest width is 320 px,** the narrowest phone still met (the first iPhone SE, small Androids in their zoomed display modes). Below it the page keeps its 320 px layout and the window scrolls sideways; nothing squeezes further.
3. **From 320 px everything fits:** the header's rows hold their buttons without overlap from 320 px up (words giving way to icons, or the shorter forms of [156](./156-one-line-shorter-words.md), where the room runs out), and the design audit checks 320 px as well as 375.

## Agent Brief

**Category:** bug
**Summary:** Below some width the header's buttons overlap; the page gets a narrowest width of 320 px, and fits without overlap from there up.

**Current behavior:** The page has no narrowest width. In a window narrower than a phone (278 px in the owner's screenshot), the header's second row squeezes until its buttons lie on top of one another. Between 320 and 374 px nothing is checked.

**Desired behavior:** The page never lays out narrower than 320 px: in a narrower window it keeps the 320 px layout and the window scrolls sideways. From 320 px up no two controls overlap anywhere, the header's buttons included (giving up their words for icons where they must, with their names kept for screen readers). The design audit checks 320 px.

**Key interfaces:**
- The page's root layout and the phone's header rows (the playing and set-up buttons, the tempo)
- The design audit's widths and its overlap checks

**Acceptance criteria:**
- [x] At 280 px the page lays out at 320 px and scrolls sideways; nothing overlaps
- [x] At 320, 340 and 375 px no two header buttons overlap, and every button keeps a 44 px target or its waiver
- [x] The design audit runs at 320 px too and passes; a check fails on two controls overlapping
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Layouts above 375 px

## How it was built

**What was built:**
- **The narrowest width** (`src/styles.css`): the page's body is never narrower than 320 px. In a narrower window the page keeps its 320 px layout and the window scrolls sideways; the cards and dialogs, placed on the window, fit the window.
- **The phone's second row from 320 px:** below 375 px the playing and set-up buttons (Demo, Tutorial, Song; Hold, BPM, MIDI, Display, About) pad 2 px and sit 2 px apart, as the narrowest 2 × 2 windows already did (one rule for both now), each at least 32 px wide and never narrower than its word; the two groups stay 4 px apart. Each keeps its icon over its word, 44 px tall. At 320 px the row has 21 px to spare in Chromium and WebKit (17 with Verdana forced, standing in for Linux's wider fonts). Before, Song lay over Hold from about 358 px down, by 33 px at 320.
- **The design audit** (`e2e/designPrinciples.spec.ts`, `e2e/audit.ts`): a new rule, two controls on the same layer whose boxes cross (a layer is what a panel, a card or the header holds, so an open panel over the page is not a fault; a box is cut to what its scrolling box shows; the piano's keys are left out, the black over the white). The target tests run it at every size, and two sizes join them: the narrowest phone (320 × 568) and a window narrower still (280 × 568), with the phone's waivers. A test shows the rule failing on two buttons over each other and not on a panel over them.
- **The header spec** (`e2e/header.spec.ts`): at 280, 320, 340 and 375 px the eight buttons stand left to right on one row, each at least 44 × 32 px, nothing lies over anything, and the page is as wide as the window, or 320 px and scrolling sideways at 280.
- **The design principles:** the rule (no two controls overlap, from 320 px up), the audit's sizes, and the black keys' waiver at 320 px.

**Claude's calls, open to the owner:**
1. **Tighter, not shorter:** the row fits by tighter padding and spacing, not by shorter words or icons alone (decision 3 allowed either): every word stays whole, so nothing needs issue 156's short forms here, and on a touch screen each icon keeps its word (the design principles' "Icons carry words where hover cannot").
2. **A new waiver for the black keys at 320 px:** they are 20 px wide there (24 at 375), under the phone's 44 px, as the phone's 24 already was; the floor is 19.5. The white keys stay 33 px wide. The other way would be a seven-key octave or narrower octave buttons at 320.
3. **The cards and dialogs fit the window, not the 320 px page,** in a window under 320 px: they stay on screen rather than run off its edge.
4. **A side effect at 601 to 680 px:** the Display panel's own buttons (Freeze, Snapshot) pad 4 px there, not the 2 px the row's rule gave them before by a broader selector; the row itself is unchanged.

**Tests run:**
- Red first: the audit at 320 px failed on Song over Hold; the header spec failed at 280, 320 and 340 px (Song → Hold) and passed at 375.
- `npx tsc`, `npm run lint`; `npx vitest run`: 1287 passed, 1 timed out under load (two different ones over two runs, `filterDesign` and `edgePatches`, neither touched here); both pass alone: load flakes.
- The header, design audit and toolbar specs in Chromium and WebKit: 160 passed, 4 skipped. Again in Chromium with Verdana forced: the header, toolbar and the audit's target, overlap and layout tests, 61 passed. The audit's foldable contrast fails in Verdana alone on the Preset's description over Square's button (690 px, not touched here; it passes in the usual fonts).
- `npm run test:changed` (the night branch's changed specs, Chromium): 252 passed, 1 failed, Bead's frame cost, which passed alone: a load flake.
- The code review (standards and spec, since `daee255`). Fixed: the rule now shares the 2 × 2 one's; a button never narrower than its word; the overlap check's layer starts at the control's parent (a placed control was compared with nothing); names; a comment that told history; the spec's buttons found by role; the audit at 280 px and a test of the check itself; the black keys' 24 px in the principles. Not changed: one finding per control in the audit (as for the other rules).
- Real Linux fonts are checked only when GitHub runs the specs, at the next push.

**To try in the app:**
- Narrow the window below 375 px (or the browser's device mode at 320, then 280): the second row's buttons stand side by side, none over another, icon over word. Under 320 px the page stops narrowing and scrolls sideways.
- At 320 px, open Display, MIDI, the Tempo, the Tutorial list and About, and play the Demo: each fits, nothing lies over anything.
