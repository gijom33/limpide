# 20: Modulation rings

**What to build:** Serum-style modulation display on every modulated control, as prototyped in issue 18. A 2.5 px ring in the modulation colour (blue: `#5b8cff` dark, `#2f5fe0` light), outside the value arc, shows the total range the active sources reach right now; a live dot shows the Effective value while a Note sounds (Hold included). Hovering or focusing a source (the LFO's controls, the Filter Envelope's, Velocity, Key Track) brightens only its share. Rings and dots are drawn by the render loop from the Modulation model (ADR-0002, ADR-0003), following the newest Note (ADR-0007).

**Blocked by:** 19

**Status:** done

- [x] Reach as pure functions of the Patch and the Note sounding (`src/modulation/reach.ts`, unit tests): the lowest and highest value modulation can take Cutoff or a Pulse Width to, and each source's share
- [x] Cutoff: Filter Envelope, LFO, Velocity and Key Track shares; Pulse Width: the LFO's share (Osc 1 and Osc 2), clamped as the sound is
- [x] The model reports the newest Note and its Velocity while its Gate is open (`modulationAt().sounding`, engine test)
- [x] Ring and dot drawn outside React, updated each frame; no React re-render per frame (ADR-0002)
- [x] Dot hidden when no Note sounds (until the Release has faded); ring shown whenever a source reaches the Parameter
- [x] Hovering or focusing a source brightens its share; the rest of the ring dims
- [x] `prefers-reduced-motion`: the dot hides, the ring stays
- [x] e2e: no ring at rest; a ring once LFO Depth is up; a dot that moves while a Note sounds and goes once it fades; Pulse Width rings for an LFO on Pulse Width; the share on hover and focus; reduced motion

## Decided while building

- **Velocity and Key Track are fixed for a Note**, so they shift the range rather than widen it: while a Note sounds the ring uses its Velocity and key; with none, Velocity reaches as far as the hardest strike would open the Filter, and Key Track stays at C4, where it changes nothing.
- The dot's value is the model's Effective Cutoff itself (`modulationAt().cutoff`), which the existing engine tests already hold to the sound at the LFO's peak and trough, so it needs no test of its own.

Later, 2026-10-28 (issue 70): the reach functions return only the range a ring covers, and on the Cutoff the Filter Envelope's sweep; the per-source shares, which no ring read any more, are gone.
