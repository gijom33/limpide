# 192: Bead's cover checks, complete

**What to build:** The 1.20.0 code review's findings on where Bead stands (inbox, 2026-11-01): the hover line taken without checking covers, so Bead can hover under a phone's description box; the clear stretch checked for its 44 px box only, while the left Detune twin and a left-facing tail reach 24 px beyond it; a "Demo stopped" card lingering 6 s after a Tour or Tutorial starts, Bead standing on it though the newer card may lie over it; a ride's LFO kept when the window turns stacked mid-ride; the throw's walls taken from the window, not the page, below 320 px. A bug of v1's polish ([131](./131-v1.md)); with [181](./181-bead-never-over-text.md) (never over text), best built together.

**Blocked by:** none

**Status:** done (2026-11-02). Built on its own branch with [181](./181-bead-never-over-text.md), tried and approved by the owner: "181 and 192 look ok, you can merge"; merged into main the same day, ships with the next release

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the inbox's lines of the 1.20.0 and 1.21.0 reviews and checks.

## Agent Brief

**Category:** bug
**Summary:** Bead's checks against what covers it miss a few cases: the fallback hover line, its twin and tail, a lingering card, a layout change mid-ride, and walls below 320 px.

**Current behavior:** With every edge covered and no card docked, Bead falls back to the hover line without checking covers, and hovers under a phone's page-wide description box (z 9 under 40). The clear stretch is checked for the 44 px box only; the Detune twin (−16 px) and a left-facing tail reach up to 24 px outside it. A "Demo stopped" card stays 6 s after a Tour or Tutorial starts, and Bead stands on the first docked card it finds. A ride's LFO stays chosen when the window turns stacked mid-ride. Below 320 px the throw bounces off a wall inside the page.

**Desired behavior:** Every place Bead takes is checked against every cover for its whole drawing, twin and tail included; with nothing clear, it waits off-screen at its edge rather than under a cover. The "Demo stopped" card goes when a Tour or Tutorial starts, and Bead stands on the topmost docked card. A layout change ends a ride. The throw's walls are the page's.

**Key interfaces:**
- Bead's place rules and its covers list
- Its drawn box, twin and tail
- The docked cards
- The ride and the throw

**Acceptance criteria:**
- [x] Unit tests for each case: the hover line covered, the twin or tail under a cover, two docked cards, a layout change mid-ride, a throw below 320 px
- [x] The mascot spec passes in both browsers; every test passes in Linux's fonts too

**Out of scope:**
- Text under Bead (issue 181)
- Bead's frame cost (issue 184)

## How it was built

Built with [181](./181-bead-never-over-text.md) on the branch worktree-agent-a908b6eb2871e644b (commits "Issue 192: Bead's cover checks see its whole drawing, the topmost card" and "Issue 181: the reviews' fixes…", which also holds 192's wait behind an edge).

- **Its whole drawing against the covers:** every stretch it may stand, hover or surf on is checked against the cards, tips and panels for its box, its tail turned round past its box's left (26 px: strolling right, pointing the way, a funny turn) and its Detune twin on Detune's side (16 px, whenever there is a twin). Beside a control, its twin counts too.
- **Nowhere clear:** the hover line is checked as the edges are. With every edge covered, no card to stand on and the hover line covered (a phone's page-wide description), it goes up out of sight under the tabs or the header, the way it comes; three or four across, with its edge covered all along and nowhere else clear, down out of sight behind its edge. It comes back into view once somewhere is clear.
- **Two docked cards:** it stands on the topmost with room on its top: the later in the page, drawn over the other.
- **The "Demo stopped" card:** it already went when a Tutorial or the Tour started (their start resets it, since issue 128). A new test in the Demo spec holds it, from a Note that stops the Demo to a Tutorial's and to the Tour's start.
- **A layout change mid-ride:** a visit's or a ride's end is one rule, `visitEnds`, and the window turning to the stacked layout ends either.
- **The throw's walls:** the page's sides (its body's), so below 320 px it bounces off the page's edge, not the window's.
- **Tests:** unit tests for each case (the hover line covered, the twin and the turned tail under a cover, beside a control too, two docked cards, a layout change mid-ride, a throw below 320 px) and the Demo spec's new test. Checked in the browser with a stand-in cover over the whole window of a phone: Bead went out of sight, and came back once it was gone.
- **Tests run:** as in 181. The mascot and Demo specs pass in Chromium and WebKit but for 179's stroll test, which fails one run in eight on main's code too; the Linux fonts' stand-in (letter-spacing 0.04em and 0.12em) on the mascot spec's 164, 151 and 181 tests passed.

Claude's calls, open to the owner:

1. **"Waits off-screen at its edge"** is built as out of sight where it is: up under the tabs or the header from its hover line, down behind its edge from an edge, as it comes and goes; not off the window's side, which would give the page a sideways scroll bar.
2. **The covers count its tail turned round, always,** though at rest it faces as drawn: under a cover it is hidden whichever way it faces, and turned round at a stretch's left end its tail lay under the cover beside it.
3. **The topmost card** is the later in the page with room on its top for it: the docked cards all sit at one height over the page, the later drawn over.
4. **The throw's walls are the body's sides,** the page's, never narrower than 320 px.

## To try

On the branch, with a dev server at http://localhost:5181:

- Turn Osc 2's Detune down to −50 with both Oscillators in the Mixer, then open Display over Bead's edge: the twin does not sit under the panel.
- On a phone, scroll so that Bead's only edge in view is under an open description (a Preset picked in the Patches panel): Bead goes up out of sight under the tabs, and comes back once the description closes.
- Play the Demo, play a Note to stop it, then start a Tutorial at once: the "Demo stopped" card goes, and Bead stands on the Tutorial's card where it must.
- Three across, wait for Bead to ride a slow Sine LFO (LFO 1 on, its Depth up, 0.5 Hz), then narrow the window to a phone's: it leaves the ride for the right column.
- In a window under 320 px wide, throw Bead to the right: it bounces off the page's right side.
