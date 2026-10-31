# 128: A Tutorial on how a synth works

**What to build:** The owner's idea (inbox, 2026-10-30): "Tutorial should come with a lesson on how synthesis works, defining the oscillator, filter, amp taps and the LFO sections, etc." So a learner who has never used a synth is told what each section is for, in the signal's order, before the Tutorials that build a sound.

What exists already: Bass, the Tutorial the Welcome opens ([58](./58-first-tutorials.md)), goes through the signal chain from left to right, Oscillators, Filter, Amp. But each of its Steps is about the bass being built, not about what the section is. The Learner's review found that nothing shows the chain or says where to start ([40](./40-preset-tutorials.md), review 5). A diagram of the chain was turned down for now ([`.out-of-scope/signal-flow-view.md`](../../.out-of-scope/signal-flow-view.md)), so this lesson would be the place it is told.

**Blocked by:** the owner's answers below, and a PRD story once they are given

**Status:** needs-triage · enhancement

## Questions for the owner

1. **What form?** A Tutorial like the others, each Step a change in one section whose note opens with what the section does (for example, choose a Waveform: "the Oscillators make the raw sound…"), ending on a simple Preset of its own. Or a tour, a card per section pointing at it, read and then Next, with nothing to turn. Claude's recommendation: a Tutorial. Each Step still has a change to make, so the learner's hands learn the instrument (PRD story 85), and a card with nothing to do tends to be skipped. The player stays as it is.
2. **Before Bass, or Bass reworked?** Claude's recommendation: a new Tutorial, first in the Tutorials list and opened by the Welcome's Tutorial button, with Bass after it. Bass stays about making a bass, and the new one is about the instrument.
3. **Which sections, one Step each?** Claude's recommendation:
   - the Oscillators, with the Mixer: the raw sound and its Waveform;
   - the Filter: what it takes away, and the Cutoff;
   - the Amp: how loud over time, and its Envelope;
   - the LFOs & Envelopes: something that moves another control by itself.

   FM, Ring, Glide and the Sub's options are left to their own Tutorials.
4. **The Taps:** each Viewer listens at a Tap: after the Mixer, after the Filter, or after the Amp. Should each section's Step point at the Viewers under it and say what they show at that point in the chain? Claude's recommendation: yes. It is how the page shows the signal changing from section to section.
5. **Its name:** CONTEXT.md has "Lesson" in the Avoid list for Tutorial, so this one is a Tutorial too, named for example "How a synth works". Claude's recommendation: that name.
