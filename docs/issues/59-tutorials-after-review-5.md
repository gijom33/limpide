# 59: Tutorials, after the Learner's second run

**What to build:** What the Learner's second run ([review 5, 2026-10-27](../reviews/2026-10-27/5-learner-teacher.md), version 1.10.0) found in the Tutorials, the Demo card and the teaching aids. The learner could explain the whole signal chain afterwards, Resonance included; the teacher planned a lesson on Acid, Pluck and Wobble. From the review, 2026-10-27.

**Blocked by:** none

**Status:** done. Five fixed at once (2026-10-27); the rest decided by the owner and built (Decisions below)

Fixed at once:

- [x] An overshooting drag ticked the Step (Cutoff dragged past 280 Hz down to 32 Hz): a Step now counts once its control rests within reach for 0.4 s, and a drag through the target does not (test in `e2e/tutorial.spec.ts`)
- [x] Bass's two Attack Steps said "all the way down" but aim at 2 ms, outside reach of the bottom (1 ms): now "almost to the bottom, about 2 ms"
- [x] The ring went back onto the Display button after the Ideal Step was done: once made, a Display Step rings nothing when its panel is shut
- [x] Pluck counted Harmonics ("every tenth is missing") the Spectrum no longer numbers past 7: now "the gaps move further apart"
- [x] No Tutorial text said the signal chain: Bass's first card now does (Oscillators make it, the Filter takes Harmonics away, the Amp shapes the loudness)

For the owner:

- [x] **A Step within reach when it comes ticks itself** (Bass's Filter Decay, 250 → 180 ms; Pluck's Amp Decay). The grilling decided so (issue 40, decision 5); the learner found it confusing. Keep it, or ask for a touch first? Decided: a touch first (decision 5 below).
- [x] **The card covers the pictures the Step talks about** at 1920 × 1080 (the bottom of the Spectrums, the Maths formula) and at 150 % zoom (most of the Filter Spectrum). A smaller card, a card beside the sections on wide screens, or scrolling the Step's Viewer into view too? Done (2026-10-27): the card folds and moves, as the owner asked (Decisions below).
- [x] **The Tutorials are hard to find after the welcome**: only the Patch name leads to them. A door in About, or in the header? Decided by the owner (2026-10-27): a Tutorial button in the header, after Demo. It lists the four, the finished ticked; picking one starts it. The header's zones sit 12 px apart and its wordless buttons pad 6 px, so the piano keeps its key widths (`e2e/header.spec.ts`, `e2e/tutorial.spec.ts`).
- [x] **The "→ target" label covers its neighbour** (the Osc 2 tab, the Filter Mode icons, the Cutoff readout): below the control instead, or inside the ring? Decided: in place of the control's name (decision 6), then back above it (the owner, 2026-10-27).
- [x] **No Tooltips on the Viewers, the faders, or the Timeline legend**. Done (2026-10-27, asked by the owner): each Scope and Spectrum says which Tap it is and what it shows, every fader (the Mixer's Osc 1 and Osc 2, both Envelopes' stages), LFO Rate and Depth, the Timeline and each entry of its key; `e2e/tooltips.spec.ts` hovers them all. (The Timeline's two oranges, which review 5 found alike in both runs, are intentional: decided by the owner, 2026-10-27, not to change.)
- [x] **Small on a projector**: the card's and the Demo card's text 12 to 13 px at 1920 × 1080. Decided: bigger from 1280 px (decision 7).
- [x] **No Tutorial uses Snapshot, Maths or Guides**: a fifth Tutorial, or a Step in one of the four. Decided: a Snapshot Step and a Maths Step in Acid (decision 8); the Maths Step then taken out (the owner, 2026-10-27).

## Decisions on the docked cards (grilling, 2026-10-27, decided by the owner)

From the owner's inbox line: "Would be nice if we could move the popped up information window at the bottom to be able to see the things behind. Would be good if we could collapse it too, maybe."

1. **Both cards**, the Demo's and a Tutorial's, fold and move.
2. **Folding:** a ⌄ button in the top row folds the card to that row: the Demo keeps its name, part dots and Stop; a Tutorial its name, "Step n of m", and Start, Next or Finish. It stays folded until unfolded, whatever the Demo or the Tutorial does next. On a phone the Tutorial keeps its + beside it.
3. **Moving:** dragged by the top row (not its buttons), with a mouse, pen or finger, from 601 px up; on a phone it spans the bottom edge and only folds. It stays inside the window; a double-click on the top row puts it back; it opens at the bottom each time. Keyboard users fold, not move.
4. **Remembered:** the fold, in this browser, for each kind of card; not the position.

Built in `src/ui/cardPlacement.tsx`; tested in `e2e/dockedCards.spec.ts`.


## Decisions on the rest (grilling, 2026-10-27, decided by the owner)

Numbered on from the docked cards' four.

5. **A Step already in reach waits for a touch.** A knob or fader within reach of its target, but not on it, when its Step comes up is left alone until the learner moves it; from then on it counts as any Step does, resting within reach for 0.4 s. "Do it for me" still makes it. This reverses issue 40's decision 5 for that case only: a control already exactly on its target, or a Display option already on, shows as done.
6. **Reversed by the owner (2026-10-27): the target is back above its control**, having tried it in place of the name. Was: **The target takes the place of the control's name** ("→ 280 Hz" where "Cutoff" was) while its Step is open, so the readout stays in sight and no neighbour is covered. A control with no name line under it (the choice buttons) keeps the label above.
7. **Bigger cards from 1280 px windows up:** both docked cards' text at 15 px (14 px for the smaller lines) and the cards 720 px wide. Phones and smaller windows unchanged; browser zoom stays the teacher's way to reach the back row.
8. **Snapshot and Maths in Acid.** A Snapshot Step before the Cutoff comes down (a new kind of Step: a press of the Snapshot button, made by a Snapshot taken after the Step comes up), so the next notes compare against the faint trace; a Maths Step after Resonance, which then reads as Q (taken out by the owner, 2026-10-27: no Maths in the Tutorials). Guides stay out of the Tutorials: they mark headroom, which none of the four Presets is about.

Built in `src/ui/hooks/useTutorialState.ts`, `src/ui/TutorialCard.tsx`, `src/tutorial/tutorials.ts` and `src/styles.css`; tested in `e2e/tutorial.spec.ts`.

After trying it (the owner, 2026-10-27): a made Step's tick is a filled badge in the accent colour, on the instruction and beside "Step n of m" (so a folded card shows it too); the target back above its control; no Maths Step.
