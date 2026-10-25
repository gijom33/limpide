# 28: Target sizes

**What to build:** Everything a pointer can hit is at least 24 × 24 px on a laptop (WCAG 2.5.8) and 44 × 44 px on a phone (Apple's 44 pt), as the design principles require (issue 17 measured today's failures). A target may grow by an invisible pad (as the fader caps do) rather than by looking bigger. Taking an entry off the known list in `e2e/designPrinciples.spec.ts` is how each one is marked fixed.

**Blocked by:** none

**Status:** needs-decision: the piano's keys and a phone's 44 px controls change the layout, so the owner picks how (larger pads, taller rows, or fewer controls per row)

- [ ] Laptop: segmented pickers at least 24 px tall (22 today)
- [ ] Laptop: piano keys at least 24 px wide (white 20, black 12 today), or a decision that the computer keyboard and MIDI are the keys' equivalent
- [ ] Phone: every 28 px control (Patch bar, Display, Oscillator tabs, pickers, destination selectors, the panels' buttons and fields) at least 44 px tall
- [ ] Phone: the header's icon buttons (34 to 40 px wide), the Preset arrows (18 px wide), the logo (24 px tall) and the black piano keys (27 px wide) at least 44 px
- [ ] Known list in `e2e/designPrinciples.spec.ts` empty of issue 28's entries
