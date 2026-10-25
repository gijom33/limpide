# 27: Contrast

**What to build:** Every control's edge stands out from the panel at 3:1 and every text at 4.5:1, in both themes, as the design principles require (issue 17 measured today's failures). Taking an entry off the known list in `e2e/designPrinciples.spec.ts` is how each one is marked fixed.

**Blocked by:** none

**Status:** needs-decision: brighter edges change look B, so the owner picks the new values (a prototype of two or three settings first)

- [ ] Control edges (`--border`, `--control-on`) at 3:1 against the panel and the page, both themes
- [ ] A knob's groove and a fader's track (`--groove`) at 3:1, both themes
- [ ] Light theme: `--muted` text at 4.5:1 on the panel and the page
- [ ] Light theme: the Oscillators green readable as text at 4.5:1 (the heading and its strip tab), still told apart from the other stages for colour-blind eyes
- [ ] The Space hint on Freeze at 4.5:1 (no opacity)
- [ ] Known list in `e2e/designPrinciples.spec.ts` empty of issue 27's entries
