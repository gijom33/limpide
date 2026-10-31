# 144: C16 knobs taken for Relative near the middle of their turn

**What to build:** The owner's bug (inbox, 2026-10-31), the C16 over Bluetooth, its layout applied: "Bank A K7 sends CC7 messages. It's apparently linked to OSC 2 Pulse Width but the knob is already at 0 when CC is around 50." The MIDI panel showed CC 1 to 6 as Absolute, CC 7 and 8 as Relative, on the same device.

The cause: the C16 layout's knobs find their Encoder Mode from their first three values (issue 34). Values all within 15 of 64 were taken for a 64-centred Relative encoder, values all within 15 of 0 for a two's-complement one. The owner's C16 sends positions, so a knob that sat near the middle (or the bottom) on its first turn was taken for Relative, and then every message moved its control by the value's distance from 64: around 50, fourteen steps down each time, Osc 2's Pulse Width at 0 at once.

**Blocked by:** none

**Status:** superseded (2026-10-31) by [145](./145-the-c16-layout-strip-by-strip.md): the C16 layout's knobs are declared Relative #1, no longer detected. The fix stands for a stored first layout's knobs, still detected until it is brought to the new one.

## Decisions

1. **Knobs stay detected, more carefully,** rather than the layout declaring them Absolute: the C16's firmware may be set to send Relative, which the detection was built for (PRD story 55). Three values that step one way with no repeat are a knob turning through positions; a Relative encoder repeats its step, or varies it with the turn's speed. Claude's call, open to the owner; profile 17's review ([42](./42-reviews.md)) weighs in on the C16's knob modes.
