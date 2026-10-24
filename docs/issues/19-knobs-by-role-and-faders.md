# 19: Knobs by role, faders and value arcs

**What to build:** Knob size follows the Parameter's role ([ADR-0008](../adr/0008-knob-size-follows-the-parameter-s-role.md)); the Mixer levels and both ADSRs become vertical faders; every knob and fader draws its value as a filled arc or fill in its stage's colour, in the style picked in issue 18. The whole instrument still fits 1440×900 and 1710×1060 without scrolling.

**Blocked by:** 18

**Status:** blocked

- [ ] `role: 'play' | 'set'` on every knob Parameter; levels and envelope stages marked as faders; unit test that every Parameter has one
- [ ] Play: Cutoff, Resonance, Envelope Amount, LFO Rate, LFO Depth, Detune, Pulse Width. Set: Octave, Semitone, Velocity, Key Track, Glide
- [ ] Knob tokens per size (dial, column, pitch); fader tokens (height, width); issue 15's knob tests rewritten to one pitch per size
- [ ] Fader component: vertical drag, Shift for fine, arrow keys, double-click reset, MIDI Learn, Pickup flash, the same value and label lines as knobs
- [ ] Value arc or fill in the stage colour; glow while dragging; inactive still legible (≥ 3:1)
- [ ] Touch: a drag starts only on the dial or the handle; a tap on the track does nothing; double-tap resets
- [ ] Value bubble above the finger while dragging on touch
- [ ] Single-pointer alternative to dragging, as picked in issue 18
- [ ] e2e: fits 1440×900 and 1710×1060; every fader sets its Parameter; touch scroll over a fader's track scrolls the page
