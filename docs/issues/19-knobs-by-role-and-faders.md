# 19: Knobs by role, faders and value arcs

**What to build:** Knob size follows the Parameter's role ([ADR-0008](../adr/0008-knob-size-follows-the-parameter-s-role.md)); the Mixer levels and both ADSRs become vertical faders; every knob and fader draws its value as a filled arc or fill in its stage's colour, in look B as picked in issue 18 (the spec is its Picks section). The whole instrument still fits 1440×900 and 1710×1060 without scrolling.

**Blocked by:** 18

**Status:** done. Double-tap to reset tried by the owner on a real phone (2026-10-26).

- [x] `control: 'play' | 'set' | 'fader'` on every Parameter definition; unit test of the agreed lists
- [x] Play: Cutoff, Resonance, Envelope Amount, LFO Rate, LFO Depth, Detune. Set: Pulse Width, Octave, Semitone, Velocity, Key Track, Glide
- [x] Tokens: big dial 68 px (60 on phones, 52 on compact windows), small 52 px (40 on compact windows), fader track and 24 × 14 cap; each column as wide as its dial or text, whichever is wider; heading column 68 px; issue 15's knob pitch tests rewritten to "no two controls closer than 8 px"
- [x] Fader component: vertical drag, Shift for fine, arrow keys, double-click reset, MIDI Learn, Pickup flash, the same value and label lines as knobs
- [x] Look B: darker panels, raised caps, value arc or fill in the stage colour, one 3 px marker line on knobs and fader caps; no glow; inactive greys out the whole dial or fader, marker included (30 %), the name staying readable
- [x] Focus ring only for keyboard focus, not after a click or drag
- [x] Touch targets ≥ 44 × 44 px: the 24 × 14 fader cap gets an invisible hit area that size (the prototype's was 36 × 30)
- [x] The Filter Envelope as one wrapping row (Amount, then four faders); in rows with a picker, picker and heading aligned with the dial's visible bottom
- [x] Touch: a drag starts only on the dial or the handle, so a drag on a track scrolls the page
- [x] Double-tap resets on touch screens (double-click does; tried by the owner on a real phone, 2026-10-26)
- [x] Value bubble above the finger while dragging on touch; on phones values stay hidden at rest and show in the name's place when keys, MIDI or the Demo move a control (as today)
- [x] Single-pointer alternative: a click on a knob's arc or a tap on a fader's track (without dragging) jumps the value there
- [x] e2e: fits 1440×900 and 1710×1060 (the prototype was 87 px too tall at 1440×900); no two controls closer than 8 px at 375×812, 1000×800 and 1440×900; every fader sets its Parameter; touch scroll over a fader's track scrolls the page

## Decided while building

- **The Mixer is a third Oscillators tab** (Osc 1 · Osc 2 · Mixer), the owner's call: with faders, the Mixer under both Oscillator tabs made the Oscillators the tallest stage and the page 55 px too tall at 1440×900. Osc 2's Tuning stays one shared row under both Oscillator tabs (live, greyed out while Osc 2 is silent); the Mixer's panel takes its place.
- **Short laptop screens** (up to 960 pt tall): faders 72 px, Viewers down to their 78 pt floor. **Compact windows** (below 1330 pt wide or 760 pt tall): knobs 52/40 px, faders 64 px, and a row of knobs or faders has its name above it so the row stays on one line; a row of choices (Mode, Voices) keeps its name beside. Below 960 pt wide the stages' side padding is 8 pt.
- **Inactive** greys out the whole dial or fader, marker included, to 30 %, and the readout to 45 %, at the owner's request (the design principles say so; WCAG 1.4.11 exempts inactive controls).
- The page is darker in the dark theme (look B's panels) and slightly grey in the light theme, for every part of the app, not only the controls.

## Later

- 2026-10-29: Osc 2's Tuning is no longer one row shared under both Oscillator tabs. Each tab has its own pitch row under its Waveform (Osc 1: Octave and FM; Osc 2: its Tuning and Env Amount), decided by the owner in [90](./90-osc1-octave.md), since Osc 1's new knobs did not fit beside Pulse Width on narrow screens.
