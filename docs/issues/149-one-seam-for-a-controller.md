# 149: One seam for what a Controller is

**What to build:** The 1.19.0 review's finding (inbox, 2026-10-31), polish of v1's code ([131](./131-v1.md)): being a C16 is now decided in six modules (the C16 module, the Mappings, the inputs, the control surface's "from a C16" flag and two "not a C16" checks, the MIDI hook, the MIDI panel). One module that says what a Controller is (its name, whether it is a C16, which Mappings answer it, its built-in layout) would gather that knowledge behind one interface, so a second known Controller, or the plugin's MIDI, adds one place and not six. Nothing a player sees or hears changes.

**Blocked by:** none. Best built after [148](./148-tidy-ups-after-1-19.md), which touches the same modules (Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** Gather what a Controller is, and whether it is a C16, into one deep module, so the rest of the MIDI code asks it rather than checking the C16 itself.

**Current behavior:** Each of six modules knows something of the C16: its name test, the Mappings marked as answering a C16 only, which input a message came from, the control surface skipping or using those Mappings, the hook applying the layout when a C16 is plugged in with nothing mapped, and the panel's C16 layout button and "C16 only" tag.

**Desired behavior:** A Controller module answers, for a connected input: its name as shown, whether it is a known Controller and which (the C16 for now), whether a given Mapping answers it, and its built-in layout if it has one. The control surface, the hook and the panel ask that module; no other module tests for the C16 by name or by its device tag. Behaviour is unchanged: the same Mappings answer the same inputs, the layout is applied on the same plug-in, the panel shows the same buttons and tags. Use the deep-module vocabulary (`/codebase-design`): a small interface, the C16's facts behind it, and tests at the seam.

**Key interfaces:**
- The C16 module's name test and layout
- The Mapping's device tag and its guard
- The inputs module, the control surface's message handling, the MIDI hook's plug-in rule
- The MIDI panel's C16 layout button and "C16 only" tag

**Acceptance criteria:**
- [ ] One module decides whether an input is a C16 and whether a Mapping answers an input; a search finds no other C16 name test or device-tag comparison
- [ ] Unit tests at the new seam: a C16 by its USB and its Bluetooth name, another Controller, a Mapping for every Controller and one for the C16 only
- [ ] The MIDI, C16 and control-surface tests pass unchanged, and the MIDI panel's e2e specs
- [ ] A visitor's stored Mappings (with or without the device tag) load as before

**Out of scope:**
- A second known Controller, or any change to the C16 layout
- The MIDI Learn mode bug ([147](./147-midi-learn-tells-toggle-from-momentary.md)) and the small tidy-ups ([148](./148-tidy-ups-after-1-19.md))
