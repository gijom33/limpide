# 190: The Tutorials after review 16's second run

**What to build:** Review 16's findings on 1.21.1 ([report](../reviews/2026-11-02/16-synth-neophyte.md)), its second run after [129](./129-words-fun-to-read.md): 13 of its 15 first findings answered. New: a Tutorial's end card names the next Tutorial but has no button to start it; the Spectrum's numbered places are never introduced though two notes lean on them; the Tour's frozen badge reads as a riddle and the Amp card is the Tour's longest; Next before a Step is made still does nothing and says nothing (its first run's 15); the five-Step Filter Envelope drill comes three times.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-02) on night/2026-11-02, for the owner to try

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
- [x] An e2e test: an end card's Next button starts the next Tutorial, on a phone too
- [x] An e2e test: Next before a Step shows its line once
- [ ] The word tests pass; each Tutorial's end Patch still equals its Preset; every test passes in Linux's fonts too

**Out of scope:**
- New Tutorials
- The Tour's order

## How it was built

Built on 2026-11-02, at night, test-first.

- **The end card's way on** (decision 1): beside Done, a primary "Next: Ring Bell" button (the name of the Tutorial after this one in the menu's order) starts it from Init, its first card taking the focus on Start. Done is then a plain button; after Deep Breath, the last, Done stays the only way forward. Folded, the card keeps the button in its top row, as it keeps Next. The line above it now reads "Next comes Acid: a talking bass…", without "It is under Tutorial, at the top".
- **Next before the Step is made** (decision 2): the first press in a Tutorial shows "Turn the ringed control first, or press Do it for me." under the card's words, until the Step is made; a screen reader hears it. Later presses in that Tutorial show nothing new.
- **The drill shortened** (decision 3): a new kind of Step sets several faders at once. Bass keeps its four Filter Envelope Steps; Acid and Pluck each set the Envelope's four faders in one Step (Acid 12 Steps now, Pluck 11). All four are ringed, each with its target above it ("150 ms", without the arrow a single control's has, so the four stay apart: measured at 375, 393, 690 and 1440 px, 3 px between the closest at 690; every target label is 2 px narrower each side for it), and the Step counts once all four rest within reach; "Do it for me" sets them all. Each Preset is still rebuilt exactly.
- **The words** (decision 4): Ring Bell 5 and Deep Breath 2 now say what the small numbers along the Oscillator Spectrum's top are ("where each Harmonic belongs: 2 at twice the Note's pitch, 3 at three times"), and the word tests ask for that wherever "place" or those numbers are first used. The Tour's frozen line names the stage first: "Frozen: Decay, the fall to a steady level" (Attack, the rise; Sustain, that level held), and after the Release all four by name. The Amp card no longer has its Amp Scope sentence. CONTEXT.md's Step, and issues 129 and 130, say what changed.

Claude's calls, open to the owner:

1. "The first time" for the Next line is once per Tutorial started, not once ever: a learner who left Bass yesterday hears it again in Acid.
2. The drill is shortened by the menu's order (Bass first), not by which Tutorials the learner has finished: someone who starts at Acid gets the one Step too, its words still saying what each fader does.
3. The end line drops "It is under Tutorial, at the top", the button now doing that job.
4. A several-fader Step's targets go without the arrow, to fit four side by side.
5. The last freeze names the four stages by name alone ("Attack; Decay; Sustain; Release"), so the line keeps its height on a phone.

Not checked here: "every test passes in Linux's fonts too" waits for GitHub's run.

**To try:** finish FM Ladder and press "Next: Ring Bell", on a laptop and a phone. Start Bass and press Next before turning anything. In Acid, Step 6, turn the Envelope's four faders one by one (or press Do it for me). Read Ring Bell 5 and Deep Breath 2 with a Note playing, and watch the Tour's Amp card freeze.
