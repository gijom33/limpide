# 130: The Tour freezes the Viewers to show the Envelope

**What to build:** The owner's idea (inbox, 2026-10-31): "During tour, we could use tricks such as viewer freeze to explain ADSR." So the Tour stops the picture at the right moment, and the person sees the shape of a Note's Amp Envelope (Attack, Decay, Sustain, Release) instead of chasing it as it scrolls by.

What exists already: Freeze stops every Viewer on its frame while the sound plays on (PRD story 39; the Space bar, or Freeze in the Display menu). The Tour's Amp card ([128](./128-how-a-synth-works.md)) turns only Attack and Release, on the Amp Scope and the Amp Spectrum, and says nothing of Decay and Sustain. The Envelope Timeline draws a Note's Amp Envelope over the last few seconds, but the Tour shows it only on the LFO card.

**Blocked by:** [128](./128-how-a-synth-works.md) (the Tour, built and not yet released), and the owner's answers below

**Status:** needs-triage · enhancement

## Questions for the owner

1. **Where?** On the Amp card, or a card of its own, "Amp Envelope", after Amp? Claude's recommendation: the Amp card, which already speaks of Attack and Release, with the Envelope Timeline added to its Viewers. A fifth card would make the Tour longer for one idea.
2. **What does the Tour freeze, and when?** Claude's recommendation: the phrase plays one long Note; when its Release has faded, the Tour freezes the Viewers for about three seconds, and the card names the four stages on the frozen Timeline, left to right ("up: Attack; down to a level: Decay; held: Sustain; let go: Release"). Then the picture runs again and the next Note plays. The sound itself never stops: Freeze stops only the picture.
3. **Decay and Sustain too?** Claude's recommendation: yes. The card turns Attack, then Decay, then Sustain, then Release, each frozen once its new shape is drawn, so the person sees each knob change one stage of the shape.
4. **The person's own Freeze:** pressing Space during the Tour freezes or unfreezes as always. Claude's recommendation: like a control the person grabs, their Freeze is theirs for the rest of the card, and the Tour stops freezing on its own. The Tour lets go of its Freeze when the card changes or the Tour ends.
5. **Other tricks?** A Snapshot (the faint A/B trace) of a short Attack, kept while the Tour lengthens it, so both shapes are seen on the Amp Scope at once. Claude's recommendation: not now. One trick per card is easier to follow; this one can come later.

## Comments

- 2026-10-31, from the 1.18.0 fact-check (inbox): the Amp card says the synth lengthens the Attack, then the Release, but a Note takes the length set when its key goes down or up; with the knobs' taper few Notes get the longest (0.8 s once in 48 s). The card's words or its timing are reworked here, with the freeze. Triage, Claude's call, open to the owner.
