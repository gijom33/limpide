# 188: The UI maniac's five on 1.21.1

**What to build:** Review 3's findings on 1.21.1 ([report](../reviews/2026-11-02/3-ui-maniac.md), with screenshots): MIDI Learn's widened tile pushes Hold over Song on a phone; the MIDI panel and the Tutorial menu open over the header's bottom row while Display's opens under it; the Synth Geek formulas run across the spectra's bars; the header's buttons do not line up with the piano from 900 px; a long description squashes the Tutorial menu's icon.

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **One rule for where a header panel opens:** under the header, as Display's does.
2. **Formulas never over data:** a formula sits where no bar or trace is drawn, or its Viewer leaves it room.

## Agent Brief

**Category:** bug
**Summary:** Five layout slips: an overlap during MIDI Learn on phones, two anchoring rules for header panels, formulas over the spectra's bars, header buttons off the piano's line, and squashed icons in the Tutorial menu.

**Current behavior:** At 320–375 px the "MIDI Learning" tile widens to 65 px and pushes Hold over Song (15 px overlap at 375); from 861 px it reflows the header and drops a key. From 861 px the MIDI panel and the Tutorial menu open from the header's top row, over its bottom row and last keys; Display's opens under the header. With the Geek Layer on, "bₙ = 2 / (π n) …" and "|H| = 1 / √…" run across the A4, 2 and 3 bars (375 px WebKit; at 1440 px the Osc line ends on the A4 bar). From 900 to 1099 px the header buttons' top drifts 16 → 22 px against the keys' 16; from 1100 px they sit 2 px inside the keys; the keyboard–Hold gap is 12 px at 926–1277 and 8 px elsewhere. A long Tutorial description shrinks the mortarboard to 9.7 px.

**Desired behavior:** MIDI Learn's tile keeps its width (the word shortened as 156 does), nothing moves or overlaps at any width. Every header panel opens under the header. The Geek formulas sit clear of the bars and traces at every width. The header buttons' top and bottom match the keys', with one gap to the keyboard. The Tutorial menu's icons keep their size and the names one start.

**Key interfaces:**
- The header's layouts and the MIDI Learning tile
- The header panels' placing
- The Viewers' Synth Geek formulas
- The Tutorial menu

**Acceptance criteria:**
- [ ] The header spec checks no overlap with MIDI Learn on at 320–1920 px
- [ ] The design audit checks each header panel opens under the header, and the formulas clear of the bars
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- The header's order (issue 154)

## Added in triage (2026-11-02)

- From the 1.20.0 code review: issue 175 hides only the opener's own tip, so tips inside an open Display, MIDI or Patches panel still show over its rows (likelier with 162's four settings on one row); 153's × tip relies on the Patches panel's tips, so the two issues' words disagree. No tip of a control under an open panel; a panel's own controls keep theirs.
