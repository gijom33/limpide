# 53: Presets and synth features

**What to build:** From the synth enthusiast ([review 2](../reviews/2026-10-26/2-synth-enthusiast.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** all but the last done (2026-10-27); LFO tempo sync and tremolo wait for a grilling with the owner

- [x] Pads and keys Presets with Voices to play chords: 7 of the 9 Pads (Pad, PWM Strings, Warm Pad, Brass Swell, Choir, Sweep Pad, Dark Drone), Organ, Electric Piano, Marimba, Glass Keys, Harp and Clav are at 1 Voice. A Presets test that a chordal Preset has more than one. Done: all twelve at 8 Voices; Dark Drone stays on one, a drone being one Note. `presets.test.ts` holds every Pad but the drone, every Piano and the six keys above one Voice
- [x] A share link keeps the Patch name (it opens as "Shared Patch")
- [x] The mouse wheel turns a knob under the pointer
- [x] A gentler Glide taper (Off to 6 ms in its first 40 px)
- [x] Quick Setup starts at Cutoff
- [ ] LFO tempo sync and an Amp (tremolo) destination: to grill against the PRD's scope first

How the rest was done (2026-10-27):

- Share links carry the name after the sound: `#p=…&n=Pure%20Sine`. A link from before opens as "Shared Patch", as it did; "Last session" is never sent as a name.
- The wheel, or a two-finger scroll, over a knob's dial or a fader's track turns it (4 % a notch, Shift for fine) and does not scroll the page; elsewhere the page scrolls as before.
- Glide reaches 2 s (it reached 10) on a square taper: a fifth of the travel is about 80 ms, half about half a second. Every Preset's Glide (0.5 s at most) keeps its value.
- Quick Setup starts with the Filter's three knobs, then follows the page.
