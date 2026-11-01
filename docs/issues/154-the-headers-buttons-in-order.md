# 154: The header's buttons in order

**What to build:** The owner's idea (inbox, 2026-10-31), on the header right of the keyboard as issue [112](./112-tempo-midi-clock-and-an-arpeggiator.md) left it (night/2026-10-31, about 1900 px wide: Hold, the BPM, Tap, MIDI, Display and About on top; Demo, Tutorial and Song under the last three): "Let's have a UI/UX expert help with how those buttons are stacked up. I personally hate the fact that they are not aligned and that there seems to be no logic to it. By the way, it's okay if the keyboard is not centered." Polish of v1's layouts ([131](./131-v1.md)).

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md), whose tempo and Tap are among the buttons; the owner's choice among the expert's proposals (below)

**Status:** ready-for-agent · enhancement. The first step (the expert's proposals) can be built now; the build waits on the owner's choice.

## Decisions

Decided by the owner, 2026-10-31:

1. **A UI/UX expert** proposes how the buttons are arranged; the owner chooses.
2. **Aligned, with a logic** a person can see: the buttons line up in rows and columns, and what sits together belongs together.
3. **The keyboard need not be centred:** issue [82](./82-top-row-centres-the-piano.md)'s rule (the piano at the page's centre from 1200 px) no longer binds; the buttons' order comes first.

Claude's call, open to the owner:

4. **Two steps.** First the expert (an agent in the role of [42](./42-reviews.md)'s profile 3, the UI maniac, with the craft of a product designer) proposes two or three arrangements, each drawn with the `prototype` skill as a page of mock headers at 861, 1100, 1440 and 1920 px, with the logic of each in a line (for instance by use: playing — Hold, the tempo, Tap; learning — Demo, Tutorial, Song; setting up — MIDI, Display, About). The owner chooses in the morning. Then the chosen one is built at every width from 861 px, the design audit having the last word.
5. **From 861 px only:** the phone and 2 × 2 keep their own rows ([152](./152-the-phones-header-rows-in-2x2.md)).

## Agent Brief

**Category:** enhancement
**Summary:** Propose, then build, an arrangement of the header's buttons right of the keyboard in which they align and are grouped by a visible logic, at every width from 861 px.

**Current behavior:** From 861 to 1919 px the header's buttons right of the keyboard stand in two rows: Hold, the BPM, Tap, MIDI, Display and About on top, Demo, Tutorial and Song under the last three, right-aligned. The rows' buttons differ in width and do not share columns, and the grouping follows no rule a person can see. The layout keeps the piano at the page's centre from 1200 px.

**Desired behavior, step 1 (the proposals):** a throwaway prototype page showing two or three arrangements of the same buttons at 861, 1100, 1440 and 1920 px, each with its logic in a line and its trade-offs (width taken, words kept or icons alone, where the piano lands). The issue gets a "Questions for the owner" entry asking which, with Claude's recommendation, and its Status becomes `needs-info`. Nothing in the app changes in this step.

**Desired behavior, step 2 (after the owner's choice):** the chosen arrangement is built at every width from 861 px: buttons aligned on a grid, grouped as chosen, the same height and spacing in a group; the piano wherever that leaves it. Tab order follows the visual order.

**Key interfaces:**
- The header's groups (playing, set-up, the tempo) and their layout rules from 861 px
- The design audit's widths and its header checks
- The prototype skill's throwaway pages

**Acceptance criteria:**
- [ ] Step 1: a prototype page with two or three arrangements at four widths, and a question for the owner with Claude's recommendation
- [ ] Step 2: the chosen arrangement at every width from 861 px, buttons on a shared grid, Tab order matching what is seen
- [ ] The phone and 2 × 2 unchanged; the design audit passes; every test passes in Linux's fonts too

**Out of scope:**
- The header below 861 px ([152](./152-the-phones-header-rows-in-2x2.md))
- New buttons or new icons
