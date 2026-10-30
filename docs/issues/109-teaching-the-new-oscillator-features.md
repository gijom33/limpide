# 109: Teaching FM, Ring, the Sub and Pink Noise

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 5, [report](../reviews/2026-10-30/5-learner-teacher.md)):

- No Tutorial teaches FM, Ring, the Sub or Pink Noise; a learner meets 1.16.0's features only through long tips and about 8 s of Demo. A loaded Preset's about line ("Turn FM down and watch the rungs fold away") shows only on hover in the Patch panel.
- The Maths Layer ignores FM and Ring: it still writes a saw's series (bₙ = 2 / (π n)) under a Spectrum that no longer follows it, with nothing for sidebands or sum and difference.

The owner's own idea in the inbox (2026-10-30, "Add tutorial for FM and ring presets") and a line of Claude's brainstorm say the same; they stay in the inbox until the owner triages them, and would join this issue.

**Blocked by:** none

**Status:** needs-triage · enhancement. Questions for the owner below.

## Questions for the owner

1. **Which Tutorials?** Claude's recommendation: three, each built from Init on an existing Preset: FM Ladder (FM, two sines making a ladder), Ring Bell (Ring, two notes neither of which you hear), and Sub Two Down with Pink Surf's Noise (the Sub and the Noise colour in one).
2. **The Maths Layer under FM and Ring:** write the rule that holds (for FM, the sidebands at the Note ± whole multiples of Osc 2, their sizes by Bessel functions; for Ring, the sum and the difference), and say plainly when the saw's series no longer applies? Claude's recommendation: yes.
3. **A loaded Preset's about line:** show it somewhere once loaded, not only on hover in the Patch panel (under the Patch name for a few seconds, or in the Patch panel's open row)? Claude's recommendation: under the Patch name until the first knob is turned.
