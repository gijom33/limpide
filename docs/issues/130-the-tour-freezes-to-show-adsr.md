# 130: The Tour freezes the Viewers to show the Envelope

**What to build:** The owner's idea (inbox, 2026-10-31): "During tour, we could use tricks such as viewer freeze to explain ADSR." So the Tour stops the picture at the right moment, and the person sees the shape of a Note's Amp Envelope (Attack, Decay, Sustain, Release) instead of chasing it as it scrolls by.

What exists already: Freeze stops every Viewer on its frame while the sound plays on (PRD story 39; the Space bar, or Freeze in the Display menu). The Tour's Amp card ([128](./128-how-a-synth-works.md)) turns only Attack and Release, on the Amp Scope and the Amp Spectrum, and says nothing of Decay and Sustain. The Envelope Timeline draws a Note's Amp Envelope over the last few seconds, but the Tour shows it only on the LFO card.

**Blocked by:** none (the Tour, [128](./128-how-a-synth-works.md), came out in 1.18.0)

**Status:** ready-for-agent · enhancement. Polish for v1 ([131](./131-v1.md)).

## Decisions

Decided by the owner in a grilling, 2026-10-31 (Claude's recommendations, each accepted; the questions below kept as asked):

1. **On the Amp card,** with the Envelope Timeline added to its Viewers; no fifth card.
2. **All four stages:** the card turns Attack, then Decay, then Sustain, then Release. A Note takes the lengths set when its key goes down or up, so each change is made before a Note plays; this answers the 1.18.0 fact-check's finding below.
3. **The freeze:** once a changed Note's Release has faded, the Tour freezes the Viewers for about three seconds, and the card names the stage just changed on the frozen Timeline ("up: Attack"); after the last stage, all four, left to right ("up: Attack; down to a level: Decay; held: Sustain; let go: Release"). Then the picture runs again. The sound never stops: Freeze stops only the picture.
4. **The person's own Freeze** (Space, or Display's Freeze) during the card is theirs for the rest of the card, and the Tour stops freezing on its own. The Tour lets go of its own Freeze when the card changes or the Tour ends.
5. **No other trick for now:** a Snapshot of a short Attack kept while the Tour lengthens it would show both shapes at once, but one trick per card is easier to follow.

## Agent Brief

**Category:** enhancement
**Summary:** The Tour's Amp card turns all four stages of the Amp Envelope, one per Note, and freezes the Viewers once each Note has faded so the person sees the shape it drew.

**Current behavior:** The Amp card turns Attack, then Release, over a repeated phrase, on the Amp Scope and the Amp Spectrum; it says nothing of Decay and Sustain. A Note takes its lengths when its key goes down or up, so with the knobs' taper few Notes get the longest Attack while the move plays (0.8 s once in 48 s), and the Envelope Timeline is not shown on this card.

**Desired behavior:** The Amp card shows the Envelope Timeline beside the Amp Scope and Spectrum. It changes one stage at a time (Attack, Decay, Sustain, Release), each set before a Note plays so the Note carries it, and brings each back. After each changed Note's Release has faded, the Tour freezes every Viewer for about three seconds while the sound plays on, and the card names that stage on the frozen Timeline; after the last stage it names all four, left to right. Then the picture runs again and the next change comes. If the person freezes or unfreezes themselves during the card, the Tour stops freezing for the rest of that card; the Tour's own Freeze is let go whenever the card changes or the Tour ends. The card's words say what it now does, in the Tour's voice, and pass the fact-checker.

**Key interfaces:**
- The Tour's card data (its Viewers, phrase, tempo and moves) and the Tour card that plays it
- Freeze (the Display state the Space bar and Display's Freeze set)
- The Envelope Timeline Viewer and how the Tour brings Viewers into view
- The Tour's existing rule for a control the person grabs (the Tour lets go of it)

**Acceptance criteria:**
- [ ] The Amp card shows the Envelope Timeline with the Amp Scope and Spectrum, at every width the Tour supports
- [ ] Each of the four stages is changed before a Note plays, and that Note's shape on the Timeline shows the change
- [ ] After each changed Note fades, every Viewer freezes for about three seconds while the sound plays on, and the card names the stage; after the last, all four
- [ ] Space during the card freezes or unfreezes as always, and the Tour freezes no more on that card
- [ ] Leaving the card or the Tour lets go of the Tour's Freeze; a Freeze the person set is left as it is
- [ ] The card's words pass the fact-checker (profile 13): no claim the engine does not make true
- [ ] The Tour's e2e spec covers the freeze and the person's own; every test passes in Linux's fonts too

**Out of scope:**
- A Snapshot trick, or a fifth card
- Rewriting the other cards' words ([129](./129-words-fun-to-read.md))

## Questions for the owner

1. **Where?** On the Amp card, or a card of its own, "Amp Envelope", after Amp? Claude's recommendation: the Amp card, which already speaks of Attack and Release, with the Envelope Timeline added to its Viewers. A fifth card would make the Tour longer for one idea.
2. **What does the Tour freeze, and when?** Claude's recommendation: the phrase plays one long Note; when its Release has faded, the Tour freezes the Viewers for about three seconds, and the card names the four stages on the frozen Timeline, left to right ("up: Attack; down to a level: Decay; held: Sustain; let go: Release"). Then the picture runs again and the next Note plays. The sound itself never stops: Freeze stops only the picture.
3. **Decay and Sustain too?** Claude's recommendation: yes. The card turns Attack, then Decay, then Sustain, then Release, each frozen once its new shape is drawn, so the person sees each knob change one stage of the shape.
4. **The person's own Freeze:** pressing Space during the Tour freezes or unfreezes as always. Claude's recommendation: like a control the person grabs, their Freeze is theirs for the rest of the card, and the Tour stops freezing on its own. The Tour lets go of its Freeze when the card changes or the Tour ends.
5. **Other tricks?** A Snapshot (the faint A/B trace) of a short Attack, kept while the Tour lengthens it, so both shapes are seen on the Amp Scope at once. Claude's recommendation: not now. One trick per card is easier to follow; this one can come later.

## Comments

- 2026-10-31, from the 1.18.0 fact-check (inbox): the Amp card says the synth lengthens the Attack, then the Release, but a Note takes the length set when its key goes down or up; with the knobs' taper few Notes get the longest (0.8 s once in 48 s). The card's words or its timing are reworked here, with the freeze. Triage, Claude's call, open to the owner.
- 2026-10-31, from profile 16's first review: Decay and Sustain are never explained anywhere, and the Filter Envelope arrives unannounced in the Bass; this card's four stages are where a newcomer first meets them, so its words say each in plain words. Triage, Claude's call, open to the owner.
