# 158: Three slips in the Tour and the Tutorials

**What to build:** Profile 16's first review (the synth neophyte, [report](../reviews/2026-10-31/16-synth-neophyte.md), 1.19.0) found three things in the learning layer that do not work as they say, apart from its words ([129](./129-words-fun-to-read.md)). A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug

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
- [ ] Bass Step 4 with the Ideal already on: the Step is not done until the person turns it on
- [ ] After Acid ends or is left, no Snapshot shows unless the person took one
- [ ] E2e tests for each, red before the fix; every test passes in Linux's fonts too

**Out of scope:**
- The words of the cards and Steps ([129](./129-words-fun-to-read.md))
