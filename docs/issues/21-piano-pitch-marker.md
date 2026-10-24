# 21: Pitch marker on the piano

**What to build:** Pitch has no knob, so pitch modulation shows on the piano: a marker in the modulation colour at the sounding pitch of the newest Note, between keys when it is between them. It wobbles with an LFO on Pitch and slides across the keys during Glide.

**Blocked by:** 20

**Status:** blocked

- [ ] Modulation model: the sounding pitch (Note, Glide, LFO on Pitch) at a given time, in fractional semitones (unit tests, including Glide's `setTargetAtTime` curve)
- [ ] Marker drawn by the render loop over the piano, outside React; hidden when no Note sounds or the pitch is off the visible keys
- [ ] `prefers-reduced-motion`: the marker sits on the Note, no wobble
- [ ] e2e: with Glide on, the marker moves between two keys after the second key is pressed
