# 59: Tutorials, after the Learner's second run

**What to build:** What the Learner's second run ([review 5, 2026-10-27](../reviews/2026-10-27/5-learner-teacher.md), version 1.10.0) found in the Tutorials, the Demo card and the teaching aids. The learner could explain the whole signal chain afterwards, Resonance included; the teacher planned a lesson on Acid, Pluck and Wobble. From the review, 2026-10-27.

**Blocked by:** none

**Status:** in progress. Five fixed at once (2026-10-27); the rest wait for the owner's decisions

Fixed at once:

- [x] An overshooting drag ticked the Step (Cutoff dragged past 280 Hz down to 32 Hz): a Step now counts once its control rests within reach for 0.4 s, and a drag through the target does not (test in `e2e/tutorial.spec.ts`)
- [x] Bass's two Attack Steps said "all the way down" but aim at 2 ms, outside reach of the bottom (1 ms): now "almost to the bottom, about 2 ms"
- [x] The ring went back onto the Display button after the Ideal Step was done: once made, a Display Step rings nothing when its panel is shut
- [x] Pluck counted Harmonics ("every tenth is missing") the Spectrum no longer numbers past 7: now "the gaps move further apart"
- [x] No Tutorial text said the signal chain: Bass's first card now does (Oscillators make it, the Filter takes Harmonics away, the Amp shapes the loudness)

For the owner:

- [ ] **A Step within reach when it comes ticks itself** (Bass's Filter Decay, 250 → 180 ms; Pluck's Amp Decay). The grilling decided so (issue 40, decision 5); the learner found it confusing. Keep it, or ask for a touch first?
- [ ] **The card covers the pictures the Step talks about** at 1920 × 1080 (the bottom of the Spectrums, the Maths formula) and at 150 % zoom (most of the Filter Spectrum). A smaller card, a card beside the sections on wide screens, or scrolling the Step's Viewer into view too?
- [ ] **The Tutorials are hard to find after the welcome**: only the Patch name leads to them. A door in About, or in the header?
- [ ] **The "→ target" label covers its neighbour** (the Osc 2 tab, the Filter Mode icons, the Cutoff readout): below the control instead, or inside the ring?
- [ ] **No Tooltips on the Viewers, the faders, or the Timeline legend**. (The Timeline's two oranges, which review 5 found alike in both runs, are intentional: decided by the owner, 2026-10-27, not to change.)
- [ ] **Small on a projector**: the card's and the Demo card's text 12 to 13 px at 1920 × 1080
- [ ] **No Tutorial uses Snapshot, Maths or Guides**: a fifth Tutorial, or a Step in one of the four
