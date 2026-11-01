# 163: Bead in About

**What to build:** The owner's idea (inbox, 2026-10-31): "Add Bead to the About screen." Since issue [150](./150-bead-shown-by-default.md) (night/2026-10-31) Bead comes onto the page by itself, so a visitor meets a water drop that About, the page's own introduction, says nothing of. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** [150](./150-bead-shown-by-default.md), whose rules (Display's switch lasting, the Notes for the visit, never with the switch Off) this line describes

**Status:** ready-for-agent · enhancement

## Decisions

1. **About names Bead.** Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

2. **A line among the credits,** headed "Bead", after "Made by": Bead's picture (as Display shows it) and one sentence in the app's light voice: who it is (a water drop that lives on the page and answers what you play), and that Display's switch sends it away for good. B, E, A, D is left for people to find.
3. **A link to Bead's page,** [bead.md](../bead.md) on GitHub, as "All its secrets", for those who want them; the tricks themselves stay off the page.
4. **With Bead switched Off,** the line stays (About tells who Bead is either way) and says it is resting, with the way back on in Display.
5. **About's first screen** keeps its way in (the Demo and Tour buttons) on a 393 × 659 phone: the line sits in the credits that scroll inside the card (issue 105).

## Agent Brief

**Category:** enhancement
**Summary:** The About panel introduces Bead in one line with its picture, among the credits.

**Current behavior:** About lists Made by, Support, Sound, Music, License and Privacy; Bead, which now comes onto the page by itself, is not mentioned.

**Desired behavior:** The credits gain a "Bead" entry after "Made by": Bead's small picture and one sentence saying who it is and that Display's switch sends it away for good, with a link "All its secrets" to bead.md on GitHub. With the switch Off, the sentence says Bead is resting and how to bring it back. The way in (the Demo and Tour buttons) stays on About's first screen at every width.

**Key interfaces:**
- The About panel's credits
- Bead's picture as Display draws it, and its stored switch
- The repository's bead.md page

**Acceptance criteria:**
- [ ] About shows the Bead entry with its picture, its sentence and the link
- [ ] With Bead switched Off the sentence says it is resting and where to turn it on
- [ ] On a 393 × 659 phone the Demo and Tour buttons are still on the first screen
- [ ] The About spec covers it; the design audit passes; every test passes in Linux's fonts too

**Out of scope:**
- Bead's tricks on the page, or the Notes that call it
