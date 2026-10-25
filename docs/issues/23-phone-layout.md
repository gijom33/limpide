# 23: Phone layout: section strip and header

**What to build:** On phones a visitor sees at once that there is more than the Oscillators. A sticky strip of equal tabs (OSC · FILTER · AMP · LFO & ENV), underlined in the section's colour, highlights the section on screen and jumps to a section when tapped (look B in issue 18). The next section peeks above the fold. Scrolling down slides the header's first row (logo, Patch, Display) away; scrolling up brings it back. The playing row's icon buttons carry their word, ⓘ About among them. Values stay hidden at rest, as before (they show while a control changes; above the finger while it drags, from issue 19).

**Blocked by:** 19, 22

**Status:** done

- [x] Section strip (`SectionStrip`): tabs named after the sections for assistive technology (Oscillators, Filter, Amp, LFO & Envelopes), 44 pt tall; the highlighted one is the section a third of the way down what the header and strip leave visible (the last one at the page's end); a tap lands the section 8 pt under the strip (the last section: the page's end), smoothly unless reduced motion is asked for
- [x] Header row 1 slides away on scroll down (past the first 80 pt), back on any scroll up; the strip stays right under the header
- [x] The playing row's buttons (Demo, Song, Hold, MIDI, About) show their icon over their word, 44 pt tall; About (ⓘ) joins the row on phones
- [x] The Filter's heading and first row show above the fold at 375×812 (no change to the Viewers needed: the Mixer tab of issue 19 shortened the Oscillators)
- [x] e2e at 375×812: the strip and its targets; landing and highlight going down and up; the highlight following a scroll by hand; the header's first row hiding and returning; the words in the playing row on one line; the Filter peeking; no strip on a laptop
