# 47: Layout polish from the UI review

**What to build:** The UI maniac's nitpicks ([review 3](../reviews/2026-10-26/3-ui-maniac.md)), measured at every width in both themes: none is a sideways scroll or clipped text, but together they are what a designer on LinkedIn would screenshot. From the inbox, 2026-10-26. The first two block the post; the rest are ranked as in the review.

**Blocked by:** none

**Status:** the first two done (2026-10-26); the rest to do. **Before the LinkedIn post:** the first two (a 1366 × 768 laptop is common)

- [x] The Filter Envelope's Release fader wraps alone onto a second line, and the Osc tabs fall below their heading, at 1331–1434 px (1366 × 768 included, where the page then scrolls), 601–603 px and 345–369 px. Fixed: on laptop windows from 1331 px the fader columns take what the row leaves (44 to 56 px: 47 at 1331, 50 at 1366, 56 from 1434); at 601 px they may go to 37 ("Release" was already wider than its 40 px column); on phones under about 372 px (a stage under 331 px) the row names go above, as they did under 345. The Filter Envelope stays on one line from 320 to 1920 px, and 1366 × 768 scrolls 835 px where it scrolled 957
- [x] One inner margin for every section on every layout: on phones the stages have 12 px and LFO & Envelopes 16; at 861–960 px 8 against 16 (the 2 × 2 layout was fixed in 1.8.1). An e2e test like the 2 × 2 one, at every layout. Done: LFO & Envelopes takes the stages' padding on phones (12 px) and at 861–960 px (8 px); `e2e/toolbarLayout.spec.ts` checks every heading's inset at six sizes, and the Filter Envelope on one line at nine
- [ ] The MIDI panel under its button, as the Display panel is under its own (271 px away at 1440, 831 at 2560; at 690 it ends left of the button)
- [ ] At 861–879 px the Timeline's "Effective Cutoff" legend runs 17 px past the content edge
- [ ] Viewer labels clear of the traces ("−48 dB" crossed by the Response Curve; "1k", "10k" under the Harmonic bars; the Timeline's "1k" struck by the Cutoff line)
- [ ] One "on" fill for toggles (Song and Hold, side by side, differ; a third in the Display panel)
- [ ] The Patch name doesn't slide 6 px when its changed dot appears
- [ ] Nitpicks 8 to 26 in the review: the Osc 2 tab's width, first rows not lining up across columns, LFO plots past the content edge in 2 × 2, four focus-ring recipes, panels off the page's grid, the phone Patch panel's nested scroll, uneven outer spacing, mixed label placement at 860, the collapsed phone header's 4 px, the accent orange beside the Filter's, the LFO names hidden on phones, half-dimmed inactive controls, two picker text colours, "Source on GitHub" on two lines, Viewers swamping the controls at 2560, 9 px header words, the Wordmark's missing hover, the octave buttons' Tab order (down before up). Each to fix or drop with a reason
