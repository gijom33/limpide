# 190: The Tutorials after review 16's second run

**What to build:** Review 16's findings on 1.21.1 ([report](../reviews/2026-11-02/16-synth-neophyte.md)), its second run after [129](./129-words-fun-to-read.md): 13 of its 15 first findings answered. New: a Tutorial's end card names the next Tutorial but has no button to start it; the Spectrum's numbered places are never introduced though two notes lean on them; the Tour's frozen badge reads as a riddle and the Amp card is the Tour's longest; Next before a Step is made still does nothing and says nothing (its first run's 15); the five-Step Filter Envelope drill comes three times.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **A button to the next Tutorial** on an end card ("Next: Acid"), as the Tour's "Build a Bass", shown on a phone too.
2. **Next before the Step is made says so,** the first time: "Turn the ringed control first, or press Do it for me."
3. **The drill shortened after its first time:** from the second Tutorial that has it, one Step sets the Filter Envelope's four faders together, with Do it for me.
4. **The words** (the Spectrum's places introduced where first leaned on, the frozen badge naming the stage first, the Amp card a sentence shorter) are checked by the fact-checker's and 129's rules.

## Agent Brief

**Category:** enhancement
**Summary:** The Tutorials' last gaps for a newcomer: no way on from an end card, a silent Next, an unexplained Spectrum detail, a cryptic badge and a repeated drill.

**Current behavior:** An end card says "Next: Acid… It is under Tutorial, at the top." with only Done, and on a phone that line is folded away. Ring Bell 5 and Deep Breath 2 refer to the Spectrum's numbered places, never introduced. The frozen badge reads "FROZEN down to a level: Decay". Next before a Step is made only dims. Bass, Acid and Pluck each take five Steps for the Filter Envelope.

**Desired behavior:** An end card has a primary "Next: <name>" button beside Done that starts that Tutorial, on every width. The Spectrum's numbered places are introduced in a line where first leaned on. The badge reads "Frozen: Decay, the fall to a steady level". Next before the Step is made shows a short line the first time. From the second Tutorial with the drill, one Step sets the four faders.

**Key interfaces:**
- The Tutorial card's end and its Next
- The Tutorials' Steps and notes
- The Tour's frozen line and the Amp card
- The word tests of 129 (each word explained where first used)

**Acceptance criteria:**
- [ ] An e2e test: an end card's Next button starts the next Tutorial, on a phone too
- [ ] An e2e test: Next before a Step shows its line once
- [ ] The word tests pass; each Tutorial's end Patch still equals its Preset; every test passes in Linux's fonts too

**Out of scope:**
- New Tutorials
- The Tour's order
