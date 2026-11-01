# 158: Three slips in the Tour and the Tutorials

**What to build:** Profile 16's first review (the synth neophyte, [report](../reviews/2026-10-31/16-synth-neophyte.md), 1.19.0) found three things in the learning layer that do not work as they say, apart from its words ([129](./129-words-fun-to-read.md)). A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-10-31) on night/2026-10-31, for the owner to try: two slips; the third answered by the owner (the LFO card's words go to 129).

## Agent Brief

**Category:** bug
**Summary:** The Tour's LFO card points at a knob that is out of view, a Bass Step is ticked before it is done, and a Tutorial's Snapshot stays on the Viewers through the next ones.

**Current behavior and desired behavior:**
- **The Tour's LFO card** tells the person to watch the dot on the Cutoff knob swing, but at 1440 × 900 and on a 375 px phone the Cutoff is out of view while the card shows. The card's "bring into view" includes the Cutoff (the control it watches) with the LFO's controls and Viewers, so the dot is on screen whenever the card speaks of it; where they cannot all fit, the Cutoff wins over the LFO's second Viewer.
- **Bass Step 4** (turn on the Ideal in Display) is ticked as done before the person does anything, when the Ideal is already on, so the Step's lesson is skipped. A Display Step whose overlay is already on starts by turning it off (the Tutorial's own state, given back when it ends), so the person turns it on and sees what it adds; or, where turning it off would surprise, it says so and counts as done only once the person has opened Display. Claude's call, open to the owner: turn it off at the Step's start.
- **Acid's Snapshot** (the faint A/B trace a Step takes) stays on the Viewers after Acid ends and through the Tutorials that follow, with nothing saying what it is. A Snapshot a Tutorial took is cleared when that Tutorial ends or is left, as its other changes to the Display are; a Snapshot the person took themselves stays.

**Key interfaces:**
- The Tour's cards and how a card brings its Section into view
- The Tutorial state: a Step's done test, Display Steps, what a Tutorial gives back when it ends
- Snapshot in the Display state

**Acceptance criteria:**
- [ ] On the Tour's LFO card, at 1440 × 900 and 375 × 812, the Cutoff knob is on screen
- [x] Bass Step 4 with the Ideal already on: the Step is not done until the person turns it on
- [x] After Acid ends or is left, no Snapshot shows unless the person took one
- [ ] E2e tests for each, red before the fix; every test passes in Linux's fonts too

**Out of scope:**
- The words of the cards and Steps ([129](./129-words-fun-to-read.md))

## Decisions

1. **The Tour's LFO card points at the Timeline, not the Cutoff:** issue [129](./129-words-fun-to-read.md)'s rewrite points it at the Envelope Timeline's dotted line, which shows the Cutoff swinging, and drops the Cutoff knob from the card; criterion 1 goes, and 128's decision 10 (a card's Viewers first) stands. Decided by the owner, 2026-10-31 (option A, Claude's recommendation).

## Questions for the owner

1. **The Tour's LFO card cannot show the Cutoff knob and its Viewer together, at 1440 × 900 or on a 375 × 812 phone.** The Cutoff sits at the top of the Filter section; the LFO card's Viewer, the Envelope Timeline, and the LFO 1 Depth knob the synth turns sit in the LFO row below. At 1440 × 900 the Cutoff's top to the Timeline's bottom is 670 px, and the room between the top of the window and the card is about 570 px; on the phone the Cutoff is some 1,300 px above the Timeline, with about 555 px of room. The card already asks for the Cutoff (`watch`), after its Viewer and its control, so it shows only on a window tall enough for all three. The brief's tie-break ("the Cutoff wins over the LFO's second Viewer") does not settle it: the LFO card has one Viewer, and [128](./128-how-a-synth-works.md)'s decision 10 puts a card's Viewers first. So the first criterion contradicts decision 10 at both sizes. Which way?
   - **A (recommended): point the words at what the card shows,** in [129](./129-words-fun-to-read.md)'s rewrite of the Tour's fourth card, as profile 16 suggests ("watch the orange dotted line on the Timeline rise and fall"), and drop the Cutoff from the card. Decision 10 stands, the card speaks of nothing off screen, and 158 closes with the two slips built.
   - **B: the Cutoff first on the LFO card.** The knob shows; the Timeline is then mostly under the card at 1440 × 900 (about 50 of its 140 px show) and off screen on the phone. This reverses decision 10 for that card.
   - **C: the page follows the words:** the Cutoff while the Depth rises, then the Timeline, as the Demo follows the knob it turns. It moves the page while the person reads, which no card does today.

   The e2e test for the first criterion (at 1440 × 900 and 375 × 812, the Cutoff knob and the Envelope Timeline both clear of the header and the card) is written and red; it is kept out of the commits until the answer.

## How it was built

Built test-first on night/2026-10-31 (2026-10-31): an e2e test for each slip, red before its fix.

- **Bass Step 4.** A Display Step whose overlay is on as its Step comes turns it off, so the Step waits for the person to open Display and turn it on. If they leave the Tutorial before turning it on (Quit, Done, another Tutorial, the Demo, the Tour), the overlay is turned back on. A reload or a closed page turns it back on too, since the overlays are remembered. Back and Next over a made Step leave it alone.
- **Acid's Snapshot.** The Snapshot a Snapshot Step took is cleared when its Tutorial ends or is left, the same ways. A Snapshot the person took themselves stays: one taken before the Tutorial, or one taken after clearing the Tutorial's or over it.
- The glossary's Step and Snapshot say so, and issues 40 (decision 4) and 59 (decision 5) carry a "Since then" line.

**Claude's calls, open to the owner:**
- The Ideal is turned off as Step 4 comes, as the brief suggested, not left on with a different done test.
- Bass Step 4 said "Open Display and see that Ideal is on (turn it on if not)", which would now be untrue: it says "Open Display and turn on Ideal." 129 may rewrite it.
- A page the browser keeps to come back to (Back and Forward) turns the overlay back on as it goes and off again as it comes back, so the Step still waits.
- A Snapshot the person takes after the Tutorial's, during the same Tutorial, counts as theirs and stays.

**Tests:** `tsc`, the lint, the unit tests of the files touched, and the Tutorial and Tour specs in Chromium and WebKit (113 passed). Not yet run in Linux's fonts, so the last criterion stays open, as does the first.

**What to try:** open the Bass Tutorial with Ideal on and go to Step 4: Next waits, and Display shows Ideal off until you turn it on. Quit at Step 4: Ideal is on again. In Acid, take the Snapshot at Step 2, then Quit or pick Pluck: the grey trace is gone. Take a Snapshot of your own, run a Tutorial and leave it: yours is still there.
