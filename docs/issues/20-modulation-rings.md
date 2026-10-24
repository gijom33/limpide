# 20: Modulation rings

**What to build:** Serum-style modulation display on every modulated control, as prototyped in issue 18. A 2.5 px ring in the modulation colour (blue: `#5b8cff` dark, `#2f5fe0` light), outside the value arc, shows the total range the active sources reach right now; a live dot shows the Effective value while a Note sounds (Hold included). Hovering or touching a source (the LFO block, Envelope Amount, Velocity, Key Track) brightens only its share. Rings and dots are drawn by the render loop from the Modulation model (ADR-0002, ADR-0003), following the newest Note (ADR-0007).

**Blocked by:** 19

**Status:** blocked

- [ ] Modulation model: the Effective value and each source's reachable range for Cutoff and Pulse Width, as pure functions of the Patch, Gate history, Velocity, Note and time (unit tests)
- [ ] Cutoff: Filter Envelope, LFO, Velocity and Key Track shares; Pulse Width: LFO share (Osc 1 and Osc 2)
- [ ] Ring and dot drawn outside React, updated each frame; no React re-render per frame (ADR-0002)
- [ ] Dot hidden when no Note sounds; ring shown whenever a source's depth is not zero
- [ ] Hovering or focusing a source brightens its share
- [ ] `prefers-reduced-motion`: the dot hides, the ring stays
- [ ] Engine test: the dot's value matches the model's Effective Cutoff at the LFO's peak and trough
- [ ] e2e: with LFO Depth up and a Note held, the Cutoff knob shows a ring and a moving dot
