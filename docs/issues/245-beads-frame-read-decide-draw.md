# 245: Bead's frame: read, decide, draw

**What to build:** From the architecture review of 2026-11-05 (its third candidate, picked by the owner). [222](./222-beads-choices-as-functions-with-tests.md) made Bead's choices pure functions, but the frame that calls them is still one block of about 740 lines that reads the page (some twenty reads), decides, and writes the drawing (some forty writes), interleaved, with about thirty values it keeps from frame to frame. Its bugs have been in how the calls are ordered and combined (210, 192, 197, 220, 221), and only the browser checks them: the mascot spec, Limpide's slowest (53 tests, 12.4 minutes in Chromium, measured 2026-11-05), four of whose tests are skipped on GitHub's WebKit for its few frames ([232](./232-1-24-0-red-on-githubs-linux-webkit.md)). Each frame becomes three steps: read the page, decide, draw. Nothing Bead does changes. Upkeep in v1 ([131](./131-v1.md)), decided by the owner.

**Blocked by:** [228](./228-tidy-ups-after-1-23.md) (its two items in Bead's frame: the bare 13s, the cling's six positional arguments)

**Status:** done (2026-11-06). Built (2026-11-05) on night/2026-11-05 and merged into main on 2026-11-06, approved by the owner: "All issues seem tobe implemeted fine", then "Merge the night"; released in 1.26.0

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

## How it was built

Built (2026-11-05) on night/2026-11-05.

**What was built:**

- **Read:** `pageReader` (`src/ui/beadPage.ts`) reads the page into a `Reading`: the Sections, what covers them, the text, the plots, the guided control, the header's and the tabs' feet, the docked card, the sound, and what the app asks (sent away, the Demo part, the guide). What a frame needs only now and then is a function on the reading, called only then: the plots, the controls over an edge, the control a Step points at and its neighbours, the panels, the page's box for a throw.
- **Decide:** `createBeadFrame` (`src/ui/beadFrame.ts`) holds Bead's state from frame to frame; its `step` takes a reading and returns what to draw (or that it has gone), touching no page. The frame's code moved there as it was, with the pose's finishing (held, thrown, hovering, flying, the board, the fit under the header) and its coming into view, which used to run in the drawing. Between frames it takes the pointer, the words, the theme, a Tutorial's Steps and the patch's changes.
- **Draw:** the Mascot writes what was decided, and its droplets and fishing line, which follow it.
- **Tests:** `src/ui/beadFrame.test.ts`, 13 node tests in about a quarter of a second, over readings of the page as the app lays it out (`src/ui/beadFrame.fixture.ts`, read once from Chromium at 1440 × 900, a 375 px phone and 2 × 2): home on the Amp; the Demo's acts in turn, three across, surfing on the line and leaning with the wave (204); keeping off text on its edge (181); a ride on a slow Sine three across, home at Depth 0 (141); dropped on a Triangle's plot it rides, on a Saw's it lands (197); a throw landing on an edge; melting on its edge and raining away from the air, three across and hovering on a phone; beside each of eight Tour and Tutorial controls over no label, then home (181); through the Demo's scroll, in view and landed before the page stops, on a phone and in 2 × 2 (211); a ride on LFO 1's plot on a phone and in 2 × 2, back to its edge (197).
- **The mascot spec:** the four tests skipped on GitHub's WebKit (204, 211, 197, 181) left it for those unit tests; issue 232 says so.

**Claude's calls, open to the owner:**

1. **The reading is plain values, but for a few reads made only when needed** (the plots, the controls over an edge, a control's neighbours, the panels), as functions on it, so a frame costs no more while Bead stays home (the frame-cost test).
2. **The scripted layouts were read from the app** (once, in Chromium, 2026-11-06), not made up; the Demo's scroll is scripted as `glideTo` makes it (1.4 s, eased), from the Filter's edge to the Amp's on a phone, and from hovering to the LFO & Envelopes in 2 × 2 at 690 × 640, where the move happens without the Demo's card.
3. **Only the four skipped tests left the spec.** Five others repeat some of what the unit tests now check (the Demo's acts, the ride home at Depth 0, the drop on a plot, the throw, the melt), but each also checks the drawing and the wiring through a real pointer or the real plot; they stay as the safety net.
4. **The umbrella's picture moved to `mascotPictures.ts`**, beside the other props, so the frame can know its top; the picture is unchanged.
5. **No oddity was found to raise** as its own question (decision 1).

**What to try in the app:** nothing should look different. Bead on its edge, the Demo through to its surfing part, a ride on a slow LFO, a throw, a Tutorial and the Tour, on a laptop and a phone: each as before.

**Since then (2026-11-07, [250](./250-tidy-ups-after-1-26.md))**: its call 3's five specs that repeated the unit tests (the Demo's acts, the ride home, the drop on a plot, the throw, the melt) are cut to their wiring; the rules are the unit tests'.
