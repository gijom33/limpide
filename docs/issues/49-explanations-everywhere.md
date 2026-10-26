# 49: Explanations for every control, on every screen

**What to build:** Tooltips explain the side controls but not the core ones, and never open on a touch screen. The learner found no tooltip on Cutoff, Resonance, Waveform, Octave, Semitone, the stage headings or any Viewer, while other tooltips name "the Scope", "the Spectrum" and "the Response Curve", words the screen never shows ([review 5](../reviews/2026-10-26/5-learner-teacher.md)); checked in `src/ui/tips.ts`. On a phone, `src/ui/Tooltip.tsx` opens only on hover or focus, so nothing explains anything ([review 1](../reviews/2026-10-26/1-curious-contact.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** to do. **Before the LinkedIn post:** the touch explanations and the core tooltips (most visitors arrive on a phone)

- [ ] Tooltips for Cutoff, Resonance, Waveform, Octave, Semitone, the Oscillators, Filter and Amp headings, and each Scope, Spectrum and the Timeline, in the words of the PRD's glossary
- [ ] The Viewers' names on screen (Scope, Spectrum, Response Curve), so the tooltips' words point at something
- [ ] Explanations on touch: a long press on a control or heading, or an ⓘ per section; decided after a quick prototype on a real phone
- [ ] The welcome's first line in plain words for a non-musician, the synth words after it
- [ ] The MIDI icon on iPhone and iPad, where MIDI never works: not a red error mark
- [ ] Projector reading: Maths formulas and Viewer axis labels larger than 10 px at 1920 × 1080; the Timeline's Filter Envelope and Effective Cutoff in colours told apart
