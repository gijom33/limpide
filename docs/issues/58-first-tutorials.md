# 58: The first four Tutorials

**What to build:** The content for the Tutorial player ([57](./57-tutorial-player.md)), as decided in the grilling of [issue 40](./40-preset-tutorials.md): four Tutorials, each with its Steps and its Listen phrase, in the voice of the Presets' about lines (plain words, what to hear, what to see in the Viewers). Drafted by Claude, reviewed by the owner.

**Blocked by:** [57](./57-tutorial-player.md) for playing them; the words can be drafted before

**Status:** drafted (2026-10-26), waiting for the owner's review of the words. **Before the LinkedIn post.**

- [x] Bass, the one the Welcome opens: the signal chain from left to right, Oscillators (saw and Sub), Filter (Cutoff down), Amp (a short Envelope); a low riff
- [x] Acid: Resonance and the Filter Envelope
- [x] Pluck: the Amp Envelope's shape; an arpeggio
- [x] Wobble: an LFO moving the Cutoff
- [x] A unit test per Tutorial: its Steps applied to Init give exactly its Preset's Patch
- [ ] The owner's review of the words
- [ ] Then the Learner's review again ([42](./42-reviews.md), profile 5)

The words are in `src/tutorial/tutorials.ts`: Bass 15 Steps (one of them Display's Ideal), Acid 13, Pluck 14, Wobble 11. Each Listen phrase is two bars around A2–C5, high enough for a phone's speaker.
