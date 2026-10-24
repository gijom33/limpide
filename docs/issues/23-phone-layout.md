# 23: Phone layout: stage strip and header

**What to build:** On phones a visitor sees at once that there is more than the Oscillators. A sticky strip of stage chips (Osc · Filter · Amp · Modulation) in the stage colours highlights the section on screen and jumps to a section when tapped. Shorter Viewers let the next panel peek above the fold. Scrolling down slides the header's first row (logo, Patch) away and the strip takes its place, so the sticky header stays about as tall as now. The icon buttons get tiny labels, ⓘ among them, and values show under every control.

**Blocked by:** 19, 22

**Status:** blocked

- [ ] Stage strip with scroll-spy highlight and jump-on-tap; 44 px targets
- [ ] Header row 1 slides away on scroll down, back on scroll up
- [ ] Labels under the row 2 icons; ⓘ button in row 2
- [ ] Viewer height on phones such that the Filter block's heading and first row show above the fold at 375×812
- [ ] Values under knobs and faders on phones
- [ ] e2e at 375×812: the strip is visible on load; tapping Filter scrolls to the Filter block and highlights its chip; the next block peeks above the fold
