# 58: The first four Tutorials

**What to build:** The content for the Tutorial player ([57](./57-tutorial-player.md)), as decided in the grilling of [issue 40](./40-preset-tutorials.md): four Tutorials, each with its Steps and its Listen phrase, in the voice of the Presets' about lines (plain words, what to hear, what to see in the Viewers). Drafted by Claude, reviewed by the owner.

**Blocked by:** [57](./57-tutorial-player.md) for playing them; the words can be drafted before

**Status:** done (2026-10-27): the words reviewed by the owner.

- [x] Bass, the one the Welcome opens: the signal chain from left to right, Oscillators (saw and Sub), Filter (Cutoff down), Amp (a short Envelope); a low riff
- [x] Acid: Resonance and the Filter Envelope
- [x] Pluck: the Amp Envelope's shape; an arpeggio
- [x] Wobble: an LFO moving the Cutoff
- [x] A unit test per Tutorial: its Steps applied to Init give exactly its Preset's Patch
- [x] The owner's review of the words (2026-10-27), each Tutorial checked against the app as it is now. Three notes corrected, the owner approving each: Bass's Ideal (since [61](./61-ideal-every-oscillator.md) it marks every Oscillator, circles for Osc 1 and squares for Osc 2); Pluck's Pulse Width (from 25 % to 30 % the gaps move closer together, not further apart as [59](./59-tutorials-after-review-5.md) had it); Wobble's Retrigger (a sine restarts from the middle of its swing, so "from the same point", not "from the top"). Acid's Snapshot Step, added in 59, approved as written.
- [x] Then the Learner's review again ([42](./42-reviews.md), profile 5): run 2026-10-27, its findings in [59](./59-tutorials-after-review-5.md)

The words are in `src/tutorial/tutorials.ts`: Bass 15 Steps (one of them Display's Ideal), Acid 14 (one a Snapshot, since 59), Pluck 14, Wobble 11. Each Listen phrase is two bars around A2–C5, high enough for a phone's speaker.
