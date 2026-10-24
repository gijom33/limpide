# 22: LFO & Envelopes section, and Glide beside Voices

**What to build:** The bottom row becomes the **LFO & Envelopes** section, in the modulation colour: an LFO block (a live plot of the LFO's real recent history, scrolling, with the live dot at the right; click the plot to change the shape; the plot sits to the right of the Destination selector; Rate and Depth under them), then the Envelope Timeline. Glide moves beside Voices in the Amp block and dims when Voices is above 1.

**Blocked by:** 19

**Status:** done, except MIDI Learn on the plot, which is wired (it carries the LFO Waveform's Learn target) but has no test of its own

- [x] LFO block with the history plot from the Modulation model; clicking or pressing Enter on the plot cycles the shape; the four shape buttons go; on phones the plot shrinks to the room beside the selector
- [x] The row's heading becomes LFO & Envelopes (the owner's name for it, rather than Modulation); the plot's canvas keeps its Envelope Timeline label
- [x] The row wears the modulation colour as its stage colour: border, heading, knob arcs (`--stage-mod`: `#5b8cff` dark, `#2f5fe0` light)
- [x] Glide beside Voices, dimmed (still adjustable) when Voices > 1, with a tooltip saying why
- [x] Tooltips updated (LFO Waveform, LFO & Envelopes, Glide)
- [ ] MIDI Learn on the plot learns the shape: wired, untested
- [x] e2e: clicking the plot steps through the shapes; Glide dims at 2 Voices; still fits 1440×900

## Decided while building

- **The LFO plot shows one second**, always: 1 Hz is exactly one period, 20 Hz twenty, as the owner asked. Two cycles (the prototype) made a fast LFO scroll a third of a cycle per frame and read as noise (the wagon-wheel effect); a version locked to the cycle with a moving dot was tried and dropped, the owner preferring the scrolling history. Drawn with two points per unit of width, so twenty periods keep their shape.
- **Now-dots on the Timeline**: each of its three lines (Amp Envelope, Filter Envelope, Effective Cutoff) ends in a dot in its colour, as the LFO plot's does. Its two areas are lighter (10 % each), so where they overlap they read no heavier than a Viewer's shading.
- **The logo gains the modulation blue**: the mark and the favicons run green, orange, purple, then blue (the PNG icons re-rendered from the SVG). The name beside and under the mark is plain text, in the text colour, and sits closer to it.
- **The Mixer's row is named Levels** on its tab (its group is still called Mixer), and its faders stretch to the height of the two Oscillator rows they take the place of.
- In Safari the Voices segments overflowed their box and slid under Glide; the caption-and-segments line is a grid, which Safari sizes in full.
