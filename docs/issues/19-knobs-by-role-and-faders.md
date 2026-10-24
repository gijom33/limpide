# 19: Knobs by role, faders and value arcs

**What to build:** Knob size follows the Parameter's role ([ADR-0008](../adr/0008-knob-size-follows-the-parameter-s-role.md)); the Mixer levels and both ADSRs become vertical faders; every knob and fader draws its value as a filled arc or fill in its stage's colour, in look B as picked in issue 18 (the spec is its Picks section). The whole instrument still fits 1440×900 and 1710×1060 without scrolling.

**Blocked by:** 18

**Status:** ready-for-agent

- [ ] `role: 'play' | 'set'` on every knob Parameter; levels and envelope stages marked as faders; unit test that every Parameter has one
- [ ] Play: Cutoff, Resonance, Envelope Amount, LFO Rate, LFO Depth, Detune. Set: Pulse Width, Octave, Semitone, Velocity, Key Track, Glide
- [ ] Tokens: big dial 68 px (60 on phones), small 52 px, fader track and 24 × 14 cap; each column as wide as its dial or text, whichever is wider; heading column 68 px; issue 15's knob pitch tests rewritten to "no two controls closer than 8 px"
- [ ] Fader component: vertical drag, Shift for fine, arrow keys, double-click reset, MIDI Learn, Pickup flash, the same value and label lines as knobs
- [ ] Look B: darker panels, raised caps, value arc or fill in the stage colour, one 3 px marker line on knobs and fader caps; no glow; inactive dims the value, never the marker (still ≥ 3:1)
- [ ] Focus ring only for keyboard focus, not after a click or drag
- [ ] Touch targets ≥ 44 × 44 px: the 24 × 14 fader cap gets an invisible hit area that size (the prototype's was 36 × 30)
- [ ] The Filter Envelope as one wrapping row (Amount, then four faders); in rows with a picker, picker and heading aligned with the dial's visible bottom
- [ ] Touch: a drag starts only on the dial or the handle, so a drag on a track scrolls the page; double-tap resets
- [ ] Value bubble above the finger while dragging on touch
- [ ] Single-pointer alternative: a click on a knob's arc or a tap on a fader's track (without dragging) jumps the value there
- [ ] e2e: fits 1440×900 and 1710×1060 (the prototype was 87 px too tall at 1440×900); no two controls closer than 8 px at 375×812, 1000×800 and 1440×900; every fader sets its Parameter; touch scroll over a fader's track scrolls the page
