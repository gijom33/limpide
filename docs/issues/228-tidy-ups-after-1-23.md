# 228: Tidy-ups after 1.23

**What to build:** From the inbox (2026-11-02 and 2026-11-03): the 1.22.0 and 1.23.0 code reviews' standards and smells, none a bug. Polish for v1 ([131](./131-v1.md)), as [196](./196-tidy-ups-after-1-21.md) was after 1.21.

**Blocked by:** [222](./222-beads-choices-as-functions-with-tests.md) for the items in Bead's frame (it reshapes that frame)

**Status:** ready-for-agent · enhancement. Polish for v1

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
- [ ] Each item mended or kept with its reason
- [ ] A test of Glow's traces after a cycles change
- [ ] tsc, the lint, every unit and browser test pass unchanged

**Out of scope:**
- Behaviour changes
