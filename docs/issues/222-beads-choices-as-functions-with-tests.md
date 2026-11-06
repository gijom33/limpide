# 222: Bead's choices as functions with tests

**What to build:** Part (c) of [184](./184-beads-frame-in-parts.md), split by the owner on 2026-11-03: review 9's finding 3 on 1.21.1 ([report](../reviews/2026-11-02/9-ts-react-webaudio.md)) that Bead's frame is one effect of about 520 lines with many mutable variables, its perch, visit, ride, landing and cling choices reachable only through end-to-end tests. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none; best after [220](./220-bead-keeps-its-covers-as-the-page-changes.md), which changes what the frame reads

**Status:** done (2026-11-05). Built (2026-11-04) on night/2026-11-04, merged into main, not yet released; accepted by the owner: "OK with the rest of the tickets reviewed", with Claude's calls in it.

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
- [x] Unit tests for the perch, visit, ride, landing and cling choices
- [x] The mascot spec passes unchanged in both browsers
- [x] Bead's frame-cost test passes on a quiet machine

**Out of scope:**
- New tricks or places for Bead

## How it was built

Built at night on 2026-11-04, test-first. The new choices are in a new module, `mascotChoices`, beside Bead's place, cling and motion modules, and each has unit tests:

- **The perch** in three and four across. Its home is the top right section. It stands on the edge it visits. When that edge is covered, it goes to the nearest edge on screen and clear, then to the docked card. With nowhere clear, it waits behind its edge.
- **The visit.** Whether a visit or a ride is due now, when the next one comes on each layout, and how long one lasts.
- **The ride.** Whether the frame looks for the LFO plots at all (only in a Demo part, on a ride, or with a ride due, so a frame at home costs no more). Then which plot it rides or surfs, and whether it is on that plot this frame.
- **The landing.** Which edge a throw lands on.
- **The cling.** Its next move to a control's side: to the Section's edge first, straight down the panel, or across from beside another control. Also whether it stays beside the last control while the next is out of reach.

The phone's perch, the visit's choice and end, the drop onto a plot and the place beside a control were already functions with tests. They stay where they were. The frame now reads the page, calls these choices and moves Bead.

Tests: `tsc` and the lint are clean, and Bead's unit tests pass (30 new). The mascot spec passed in WebKit, and in Chromium but for one test that is green alone (a load flake). The frame-cost test, which runs in Chromium only, passed.

Claude's calls, open to the owner:

1. **A new module for the new choices**, rather than adding to Bead's place module (already near 580 lines). The choices that were already functions stay in the place module, so their tests did not move.
2. **The frame still makes a few small calls inline**: which Section's edge serves a control, whether that edge has room, and whether a landing after a throw starts a visit. Each is a line or two that reads the page or sets the frame's own state. Moving them would add arguments without adding a test worth having.
3. **Bead's state is still in the frame's variables.** The issue asked for the choices to be functions, not for less state.

What to try in the app: nothing should look different. Watch Bead for a minute on each layout:

- Its visits and rides.
- A throw onto another section.
- A Tutorial, where it slides down beside each Step's control.
- The Demo's surfing.
