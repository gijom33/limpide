# 241: every Preset reachable by Program Change

**What to build:** The owner's idea (inbox, 2026-11-05): "If it's not the case yet, I think we should make the preset selection controllable by MIDI." It is mostly so already. Since [52](./52-midi-keyboards.md), a Program Change n loads the n-th Preset (0 is Init) while nothing is mapped to it, and the Previous and Next Preset buttons can be learned onto any button (the C16's M1 and M2 by default, [34](./34-c16-bank-layout.md)). The gap: a Program Change carries 0 to 127, and there are 142 Presets, so the last 14 can only be reached by stepping. Bank Select (CC 0) is the usual answer: bank 1 holds Presets 128 onwards. Polish of something in v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's call, open to the owner, 2026-11-05:

1. Bank Select's CC 0 (its MSB) picks a bank of 128 Presets, and the next Program Change loads Preset bank × 128 + n. CC 32 (the LSB) is read and ignored. Bank 0 stays the default, so a keyboard that never sends Bank Select works as today.
2. A Program Change past the last Preset does nothing, as now.
3. CC 0 counts as a keyboard's own control: a Mapping on it takes over, as on the pedal and the mod wheel.
4. The Keyboard tip names Bank Select beside Program Change.

## Agent Brief

**Category:** bug
**Summary:** A keyboard's Bank Select and Program Change reach every Preset, not only the first 128.

**Current behavior:** An unmapped Program Change n loads the n-th Preset. Program numbers stop at 127, so the 14 Presets after it are reachable by MIDI only through the learned Previous and Next Preset buttons. Bank Select (CC 0) is not read.

**Desired behavior:**
- An unmapped CC 0 sets the bank, and the next Program Change n loads Preset bank × 128 + n; with no Bank Select sent, the bank is 0.
- CC 32 is read and ignored, so a keyboard that sends both still works.
- A Program Change past the last Preset does nothing.
- A Mapping on CC 0 takes over from Bank Select, as Mappings do on a keyboard's other own controls.
- The Keyboard tip's sentence on Program Change also names Bank Select.
- Tests: Bank 1 and Program 0 load the 129th Preset; a mapped CC 0 turns its control and leaves the bank at 0; a Program Change past the last Preset leaves the Patch alone.

**Out of scope:** Program Change sent out by Limpide, the Presets' order, a Program number shown in the Patches panel.
