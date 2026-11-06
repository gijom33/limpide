# 245: Bead's frame: read, decide, draw

**What to build:** From the architecture review of 2026-11-05 (its third candidate, picked by the owner). [222](./222-beads-choices-as-functions-with-tests.md) made Bead's choices pure functions, but the frame that calls them is still one block of about 740 lines that reads the page (some twenty reads), decides, and writes the drawing (some forty writes), interleaved, with about thirty values it keeps from frame to frame. Its bugs have been in how the calls are ordered and combined (210, 192, 197, 220, 221), and only the browser checks them: the mascot spec, Limpide's slowest (53 tests, 12.4 minutes in Chromium, measured 2026-11-05), four of whose tests are skipped on GitHub's WebKit for its few frames ([232](./232-1-24-0-red-on-githubs-linux-webkit.md)). Each frame becomes three steps: read the page, decide, draw. Nothing Bead does changes. Upkeep in v1 ([131](./131-v1.md)), decided by the owner.

**Blocked by:** [228](./228-tidy-ups-after-1-23.md) (its two items in Bead's frame: the bare 13s, the cling's six positional arguments)

**Status:** ready-for-agent · enhancement. Upkeep for v1

## Decisions

Decided by the owner, 2026-11-05 ("ok"):

1. **A reshaping only:** nothing Bead does changes; any oddity found is its own question, not a silent fix (Q1).
2. **In v1, as upkeep,** for a night shift, after 228 (Q2).
3. **Each frame in three steps** (Q3):
   - **Read the page** into plain values: the Sections, what covers them, the text, the plots, the control a Tutorial or the Tour points at, the header's foot, the docked card; from the page itself, or from a script in tests.
   - **Decide**, from Bead's state, that reading and the time: where it goes, how it stands, what it does; touching no page.
   - **Draw** what was decided.
4. **Its decisions tested without a browser** over scripted readings (Q4): the cling beside a Step's or a Tour card's control, the rides and throws, the Demo's acts and its falls and flights to a part's Section, leaving by rain, keeping off text. The four skipped on GitHub's WebKit come back that way, checked in every run:
   - each Demo act in turn, three across (204);
   - landing in view through the Demo's scroll to a part's Section (211);
   - riding a slow Sine on LFO 1's plot, and back to its edge (197);
   - beside each control in the Tour and a Tutorial, over no label (181).

   The mascot spec keeps the checks that Bead is drawn and wired to the page.

Claude's calls, open to the owner:

5. **No ADR:** it continues 222, where the choices became pure.
6. **The three steps' exact shape is the builder's,** the reading two adapters (the page and the tests' script) and the deciding step pure.
7. **Not built the same night as 243,** whose Shows Bead reads for its guiding: one after the other, either first.

## Why

From the review, and asked of 244 by the owner in the same grilling:

- **The bugs where they live:** the order of reads, choices and writes fixed in one tested place.
- **Faster, steadier tests:** a decision checked on a scripted reading in a fraction of a second, the same on any machine, where the browser spec takes minutes and depends on the frame rate.
- **Four checks back on GitHub:** the tests skipped there since 1.24.0.
- **The cost:** the largest of the three reshapings (243, 244, 245), on the part where a slip shows most, Bead's motion; the mascot spec stays as the safety net.

## Agent Brief

**Category:** enhancement
**Summary:** Bead's frame splits into reading the page, a pure decision over that reading, and drawing; its decisions are tested without a browser.

**Current behavior:** Each frame, one long block reads the page's layout, calls Bead's pure choices, place, cling and motion, keeps its own running values, and writes the drawing, all interleaved. What Bead decides from a given page can be checked only in the browser.

**Desired behavior:**
- Reading the page gives plain values (the Sections, covers, text, plots, the guided control, the header's foot, the docked card), from the page or from a script.
- A pure step takes Bead's state, a reading and the time, and returns the next state and what to draw; it touches no page.
- Drawing writes that, and only that.
- Everything Bead does is unchanged: the mascot spec passes as it is, the frame-cost test included.
- Tests: the decisions listed in decision 4 as node unit tests over scripted readings, the four skipped on GitHub's WebKit among them; the mascot spec keeps drawing and wiring checks, its repeats of what the unit tests now cover removed.

**Out of scope:** any change to what Bead does; its tricks' pictures and the droplets; the Shows' module (243).
