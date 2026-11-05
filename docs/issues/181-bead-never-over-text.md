# 181: Bead never over text

**What to build:** The owner's bug (inbox, 2026-11-02), on 1.21.0 during the Demo, with a screenshot of Bead beside Osc 1's ringed Waveform buttons, its tail across the word "WAVEFORM": "During Demo, Bead’s tail is on text which should be avoided. It should go a bit lower." A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-02). Built on its own branch with [192](./192-beads-cover-checks-complete.md), tried and approved by the owner: "181 and 192 look ok, you can merge"; merged into main the same day, ships with the next release

**Since then:** the text is also read again at once as a cover opens, closes or moves with the page, or the window resizes, and a tenth of a second after a scroll inside the page as well as of the window; its walk passes over what is not text whole (issue [220](./220-bead-keeps-its-covers-as-the-page-changes.md), 2026-11-03).

## Decisions

Decided by the owner, 2026-11-02:

1. **Bead's body and tail never cover text:** a control's label, a readout, a heading; where it stands beside one, it goes a bit lower ("It should go a bit lower").

Claude's call, open to the owner:

2. **Everywhere Bead stands still,** not only in the Demo: on a Section's edge, the line under a phone's tabs (142), a clear stretch (164), a ride's end (141), beside a Step's control (151). Its wanderings may pass over text; where it stops may not.
3. **Lower first:** the nearest place below the text that is clear; if none, the nearest clear place along the same line.

## Agent Brief

**Category:** bug
**Summary:** Bead can come to rest with its tail or body over a control's label, as beside Osc 1's Waveform during the Demo.

**Current behavior:** During the Demo (seen on 1.21.0), Bead stood beside Osc 1's Waveform buttons with its tail across the "WAVEFORM" label. Where Bead rests is chosen to avoid cards, rings and the header, but not text.

**Desired behavior:** Wherever Bead comes to rest, neither its body nor its tail (on either side, with the Detune twin) covers text on the page: labels, readouts, headings. Where its chosen place would, it settles a little lower, on the nearest clear place below; failing that, along the same line. Passing over text while moving is fine.

**Key interfaces:**
- Bead's resting places and the checks it already makes against cards, rings and the header (issues 142, 151, 164)
- Its drawn box, tail and Detune twin included (174, 179)
- The Demo's ring on the control it turns

**Acceptance criteria:**
- [x] During the Demo at a laptop's width, Bead never rests over a label (the e2e test samples where it rests, against every text node's box)
- [x] The same in a Tutorial (151) and on a phone's tab line (142)
- [x] A unit test on the placement: a place whose box meets a text box moves lower, else along the line
- [x] Bead's frame-cost test passes as before; every test passes in Linux's fonts too

**Out of scope:**
- Where Bead goes in the Tour and the Tutorials, or what it does in the Demo
- Bead moving over text on its way

## How it was built

Built with [192](./192-beads-cover-checks-complete.md), which shares its checks of Bead's whole drawing, on the branch worktree-agent-a908b6eb2871e644b (commits "Issue 181: Bead never rests over text…", "Issue 192: …" and "Issue 181: the reviews' fixes…"). Found on the way: the owner's screenshot fits the Tour's first card (the Tour's cards look like the Demo's), where Bead clung left of Osc 1's ringed Waveform buttons with its body and tail over the name "Waveform"; the Tour's second card did the same over "Cutoff". In the Demo itself, Bead's air guitar swings its tail down under its foot, towards the Section's name under its edge.

- **The page's text:** Bead reads the boxes of every line of text on the page, but for what is drawn over it anyway (the docked cards, tips and open panels) and what only a screen reader reads. It reads them at most twice a second, or a tenth of a second after the page scrolls: about 1.4 ms a read in Chromium and 1 to 2 ms in WebKit, under 0.05 ms a frame on average. The frame-cost test, which takes the median frame, passes as before.
- **On a line** (a Section's edge, the line under a phone's tabs, the docked card's top): the stretch it strolls along leaves out every spot where its drawing at rest would cover text. Its drawing at rest is its box, facing as drawn, with 3 px of leeway all round (the Amp stretching it, breathing, leaning), its Detune twin on Detune's side (as far as 50 cents puts it, whenever there is a twin), and its tail swung down under its foot, as the air guitar's strum does. On the card's top that tail is behind the card, so the page's text there does not count. An edge with no such spot counts as covered, as under a card (164).
- **Beside a control** (a Step's or a Tour card's): where its level place would cover a label, it goes a little lower, to the nearest place clear under it; with none within its own height, farther along its level, away from the control, within its width; with neither, not that side. The pointing-the-way spec allows it lower than level only beside Osc 1's and Osc 2's Waveform and the Display button, where it now goes under a name.
- **Passing over text:** moving (falling, flying, strolling, walking into a new stretch), surfing, riding, and hovering under the tabs, it may.
- **Tests:** unit tests on the drawing along a line (text beside its twin, a heading under its swung tail) and on the cling (lower under a label, else along, else the other side; the side it need not move on). In the mascot spec, a sampler checks Bead's drawing pixel by pixel, twin included, against every text line wherever it rests (standing or clinging still, not hopping or bouncing): through the Demo's first three parts at 1440 × 900 and 1280 × 800, beside each control of the Tour and the first six Steps of the Bass Tutorial, and on a phone's tab line (375 × 560, scrolled until its top is level with the tabs' names). The Tour and tab-line tests failed on main's code (over "Waveform", over "LFO & Env"); the Demo test passed there too.
- **Tests run:** `npx tsc`, `npm run lint`, `npx vitest run` (1621 passed; the Bead unit tests again after the reviews' fixes, 322 passed); the mascot, Demo, Tour, Tutorial and About specs in Chromium and WebKit, the frame-cost test included. After the reviews' fixes, the mascot and Demo specs in both browsers: 132 passed, 5 skipped, and one failure of 179's test "strolling right its tail trails…", which fails one run in eight on main's code too (no stroll right of 60 px in its sample). The Linux fonts' stand-in: the mascot spec's 181, 151 and 164 tests with letter-spacing 0.04em and 0.12em on every text, all passed. Reviewed by two fresh agents, one on the repository's standards, one on the two issues; their findings were fixed, but for the calls below.

Claude's calls, open to the owner:

1. **What counts as text:** every line of text on the page (labels, readouts, headings, the tabs' names, the header's buttons' names), but text inside a card, tip or panel, drawn over Bead, and text for screen readers alone.
2. **On a line, "lower" is "along":** it cannot stand lower than its edge, so on a line it keeps to the stretches clear of text. On a phone's tab line, where its top would be level with the tabs' names, it stands between two names (gaps of 54 and 55 px at 375 px); with Detune's twin it needs 60, so it hovers just under the tabs instead, which is lower. With no clear spot anywhere and nowhere else to go, it falls back to the stretch clear of covers alone.
3. **Hovering under the tabs may cover text:** the page moves under it there, and decision 2 did not list it; checking it would make Bead dodge sideways as the page scrolls.
4. **Beside a control, how far:** up to its own height lower (26 px), else up to its width along (44 px). Its tail stays level, so lowered it points at the ring's foot rather than the control's middle.
5. **Of two sides as free, the one it need not move on,** before the side away from the docked card (151's rule): beside a label it may cling on the other side rather than go lower, where that side covers no more of the neighbouring controls.
6. **Its Detune twin counts beside a control:** with a twin, it clings only on the side where the twin trails away from the control, as on the other side the twin would lie over the ring.
7. **Its drawing at rest:** 3 px of leeway all round, and its tail swung down 20 px under its foot from 18 px across its box (the air guitar's reach), facing as drawn, as at rest (179).

## To try

On the branch, with a dev server at http://localhost:5181:

- Take the Tour (About, Take the Tour) at a laptop's width: on the first card Bead should cling a little lower beside Osc 1's Waveform buttons, under the name "Waveform"; on the second, under "Cutoff".
- Play the Demo and go to its second part (its segment on the card): playing air guitar on the Amp's edge, its tail swings clear of the name "AMP".
- Start the Bass Tutorial: beside each Step's control, no name under Bead.
- On a phone, scroll slowly until the Oscillators' edge is just under the tabs: Bead stands between two tabs' names, or hovers just under the tabs, never over a name.
- Turn Osc 2's Detune with both Oscillators in the Mixer: the twin keeps off the names too.
