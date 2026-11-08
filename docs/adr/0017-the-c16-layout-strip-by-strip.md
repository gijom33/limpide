# The C16 layout strip by strip, its knobs Relative, answering the C16 alone

**Status:** accepted; its "two steps when turned fast" corrected by issue 145, decision 17: a fast turn sends a burst of eight 66s, which reach the page split and merged, each now counted a third of a step; its "Mappings made by MIDI Learn … answer any Controller" narrowed by issue 255: one learned from another input on a control the layout had answers every Controller but the C16, so the C16's knob it took drives nothing (Claude's call, open to the owner) · **Date:** 2026-10-31 · **Decided by:** the owner

Supersedes two parts of [ADR-0009](./0009-a-built-in-layout-for-the-c16.md): its layout, and its knobs finding their Encoder Mode on their first turn. A built-in layout for the C16, beside MIDI Learn, stands.

Trying the C16 on the real device (2026-10-31) showed what ADR-0009 could not know. Its panel is four strips, each two knobs, a fader and three buttons (M, S, R), and its buttons' CCs count down each strip, then across. Its knobs can send positions or, set in its editor, Relative steps; "Relative #1" is 64-centred, two steps when turned fast. Detecting the mode from three values took a knob that sat near the middle for a Relative one (issue 144). And a Mapping knew only a channel and a CC, so another keyboard's sustain pedal (CC 64) or mod wheel (CC 1) drove the C16's buttons and knobs. Profile 17's review (issue 42) proposed the layout; the owner decided it in issue 145's grilling.

So:

- **Each strip is a column of its section on screen,** each bank a section (A the Oscillators, B the Filter, C the Amp, D the LFOs); M1–M4 and S3 are the same on every bank (the Preset arrows, Freeze, Hold, Snapshot). The places are data (`src/midi/c16.ts`), and the card to print is drawn from that data.
- **The knobs are declared Relative #1,** not detected: an endless knob moves its control from wherever it is, with no Pickup dead zone and no jump after a Preset change. The card tells the owner of a C16 to set its knobs so.
- **Each button's mode is declared:** momentary for what a press does (an Action, a step through a choice of more than two), toggle for a two-way switch, whose light then shows its state. A shared toggle would have four lights that disagree, so Freeze is momentary too.
- **The layout's Mappings answer a C16 alone,** told by its input's name, over USB or Bluetooth. Mappings made by MIDI Learn or Quick Setup answer any Controller, as before.

The cost: a C16 left in its factory settings (knobs sending positions, buttons toggles) does not play this layout right until it is set as the card says; and a C16 renamed on the device is not recognised.
