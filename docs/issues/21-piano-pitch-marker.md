# 21: Pitch marker on the piano

**What to build:** Pitch has no knob, so pitch modulation shows on the piano: a marker in the modulation colour at the sounding pitch of the newest Note, between keys when it is between them. It wobbles with an LFO on Pitch and slides across the keys during Glide.

**Blocked by:** 20

**Status:** done. The marker is the rings' live dot, on the piano's top edge (low on the keys it hid behind the black keys and the C names).

- [x] Modulation model: the sounding pitch (Note, Glide, LFO on Pitch) at a given time, in fractional semitones (engine tests: `modulationAt(t).pitch`; Glide's curve was already unit-tested in `glideFrequency`)
- [x] Marker drawn by the render loop over the piano, outside React; hidden when no Note sounds or the pitch is off the visible keys
- [x] `prefers-reduced-motion`: the marker sits on the Note, no wobble
- [x] e2e: with Glide on, the marker moves between two keys after the second key is pressed
