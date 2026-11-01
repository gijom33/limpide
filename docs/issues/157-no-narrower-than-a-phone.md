# 157: No narrower than a phone

**What to build:** The owner's bug (inbox, 2026-10-31), with a screenshot of the night branch in a window 278 px wide: the header's second row (Demo, Tutorial, Hold, Song, the BPM, MIDI, Display, About) squeezed until Tutorial, Hold, Song and the BPM overlap. "Do not allow super narrow screens where buttons overlap." Today nothing sets a narrowest width: the page squeezes to whatever the window is. The layouts are designed and checked from 375 px (the design audit's phone); issue [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (night/2026-10-31) has just added the BPM to that row. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md), whose BPM is in the row that overlaps

**Status:** ready-for-agent · bug

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
- [ ] At 280 px the page lays out at 320 px and scrolls sideways; nothing overlaps
- [ ] At 320, 340 and 375 px no two header buttons overlap, and every button keeps a 44 px target or its waiver
- [ ] The design audit runs at 320 px too and passes; a check fails on two controls overlapping
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Layouts above 375 px
