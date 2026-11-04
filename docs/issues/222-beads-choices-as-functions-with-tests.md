# 222: Bead's choices as functions with tests

**What to build:** Part (c) of [184](./184-beads-frame-in-parts.md), split by the owner on 2026-11-03: review 9's finding 3 on 1.21.1 ([report](../reviews/2026-11-02/9-ts-react-webaudio.md)) that Bead's frame is one effect of about 520 lines with many mutable variables, its perch, visit, ride, landing and cling choices reachable only through end-to-end tests. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none; best after [220](./220-bead-keeps-its-covers-as-the-page-changes.md), which changes what the frame reads

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

From 184 (Claude's calls, open to the owner, 2026-11-02):

1. **Nothing Bead does changes:** a refactor, its behaviour held by the mascot spec as it is.
2. **The choices as pure functions** with unit tests, beside Bead's place, cling and motion modules that already are.

Claude's call, open to the owner (2026-11-03):

3. **Not built the same night as [204](./204-baggage-air-guitar-and-surfing-seen.md)'s surfboard and acts,** which change the same frame: one after the other, 204 first.

## Agent Brief

**Category:** enhancement
**Summary:** Where Bead goes next (an edge to rest on, a visit, a ride, a landing, a cling) is decided inline in one long frame function, testable only in a browser.

**Current behavior:** Bead's frame reads the page and decides its next move in one long effect, its state in many mutable variables.

**Desired behavior:**
- Each choice (where to perch, when and where to visit, when to ride a plot, where a throw lands, what it clings to) is a pure function of what the frame read, with unit tests.
- The frame only reads the page, calls the choices and moves Bead.
- Bead behaves exactly as now.

**Key interfaces:**
- Bead's frame
- Bead's place, cling and motion modules

**Acceptance criteria:**
- [ ] Unit tests for the perch, visit, ride, landing and cling choices
- [ ] The mascot spec passes unchanged in both browsers
- [ ] Bead's frame-cost test passes on a quiet machine

**Out of scope:**
- New tricks or places for Bead
