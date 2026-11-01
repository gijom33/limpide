# 137: Teaching tempo sync

**What to build:** The third slice of [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (grilling, 2026-10-31, decisions 14 and 15, decided by the owner): the learning layer for the tempo and Sync, and the Presets that use it.

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md)

**Status:** ready-for-agent · enhancement. In v1 ([131](./131-v1.md)).

## Agent Brief

**Category:** enhancement
**Summary:** The tips, the Synth Geek Layer and a Tutorial Step explain how a synced Rate follows the tempo, and the Presets whose LFO is a rhythm use Sync.

**Current behavior:** issue 112 gives Sync, the BPM and Tap a first line of tip each and nothing more.

**Desired behavior:**
- **Tips** for Sync, the BPM and Tap: what each does and why a synced wobble stays on the beat when the tempo changes, in the tips' own voice.
- **The Synth Geek Layer** writes the conversion on a synced Rate, with the live numbers: "1/8 at 120 BPM: 120 ÷ 60 × 2 = 4 Hz", dotted and triplet values included.
- **A Tutorial Step**, in the Tutorial that teaches the LFO: the learner turns Sync on and hears the wobble lock to the Listen loop's beat.
- **The Presets:** profile 15 (the Preset curator, issue 42) picks the Presets whose LFO is plainly a rhythm (the wobbles, the gates) and sets Sync on with the note value that sounds as they do at their usual tempo; the others stay as they are.
- History's line on tempo sync is not here: it goes to [134](./134-history-in-the-tooltips.md).

**Key interfaces:**
- The tips, the Synth Geek Layer's formulas
- The Tutorials' Steps
- The Presets

**Acceptance criteria:**
- [ ] The Synth Geek Layer's conversion shows the right Hz for a straight, a dotted and a triplet value
- [ ] The Tutorial Step passes when Sync is on, and its test plays through
- [ ] The Presets chosen keep their sound at 120 BPM (their level and RMS checks pass)
- [ ] The words pass the facts check before a push
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- History in the tooltips ([134](./134-history-in-the-tooltips.md))
- The Tour, which stays as it is
