# 149: One seam for what a Controller is

**What to build:** The 1.19.0 review's finding (inbox, 2026-10-31), polish of v1's code ([131](./131-v1.md)): being a C16 is now decided in six modules (the C16 module, the Mappings, the inputs, the control surface's "from a C16" flag and two "not a C16" checks, the MIDI hook, the MIDI panel). One module that says what a Controller is (its name, whether it is a C16, which Mappings answer it, its built-in layout) would gather that knowledge behind one interface, so a second known Controller, or the plugin's MIDI, adds one place and not six. Nothing a player sees or hears changes.

**Blocked by:** none. Best built after [148](./148-tidy-ups-after-1-19.md), which touches the same modules (Claude's call, let stand by the owner in 1.20.0)

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; approved by the owner: "Okay, I trust you."

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
- [x] One module decides whether an input is a C16 and whether a Mapping answers an input; a search finds no other C16 name test or device-tag comparison
- [x] Unit tests at the new seam: a C16 by its USB and its Bluetooth name, another Controller, a Mapping for every Controller and one for the C16 only
- [x] The MIDI, C16 and control-surface tests pass unchanged, and the MIDI panel's e2e specs (the control-surface tests' assertions unchanged; their 15 calls that said "from a C16" with `true` pass the C16's record instead, below)
- [x] A visitor's stored Mappings (with or without the device tag) load as before

**Out of scope:**
- A second known Controller, or any change to the C16 layout
- The MIDI Learn mode bug ([147](./147-midi-learn-tells-toggle-from-momentary.md)) and the small tidy-ups ([148](./148-tidy-ups-after-1-19.md))

## How it was built

- **The seam** (`src/midi/controller.ts`), the one module the rest of the MIDI code asks:
  - `knownController(name)`: which known Controller an input is, by the name it gives (the C16 over USB or Bluetooth), or undefined for any other; `knownAmong(names)`: the known Controllers connected, each once.
  - `answers(mapping, from)`: a layout's Mapping answers its own Controller only, any other every Controller (ADR-0017); `answeredBy(mapping)`: the known Controller a Mapping answers alone, for the panel's "C16 only".
  - `takeLayout(id, storage)`: a known Controller's layout, recorded as in place (the panel's button); `pluggedIn(names, mappings, storage)`: what the Mappings become as inputs connect (the layout by itself the first time, with nothing mapped; a stored earlier layout brought to today's, once), or null.
- **Behind it, the C16's record** (`C16` in `src/midi/c16.ts`): its id and label, its name test, its layout, where its layout's version is recorded (`limpide.c16Layout`, `'3'`) and the upgrades from earlier layouts, its banks as Sections (the bank follow), and the third of a step its fast turn's 66 counts for. These moved out of the MIDI hook and the control surface.
- **The callers:** the control surface's `handle(message, from)` takes the input's known Controller instead of a "from a C16" flag; the MIDI hook asks the module on each message and on each plug-in; the MIDI panel draws a layout button and a card link for each known Controller connected (``TIPS[`${id}Layout`]``, `#${id}-card`), so the C16's read as before. The inputs module still gives each message its input's name.
- **Claude's call, let stand by the owner in 1.20.0:** the known Controllers' tags (`CONTROLLER_IDS`, `'c16'`) stay with the Mapping's stored shape in `mappings.ts`, so reading stored Mappings needs nothing of a layout (the Controller module imports the C16's layout, which imports the Mapping: the tags there would make an import cycle). TypeScript holds the Controller module to one record per tag. A second known Controller ([173](./173-a-circuit-tracks-layout.md)) is then a tag, a record beside the C16's, its two tips and its card.
- **Claude's call, let stand by the owner in 1.20.0:** "the tests pass unchanged" read as their assertions: the control-surface tests' 15 calls that said a message came from a C16 with `true` now pass the C16's record, as the flag is gone.
- **Claude's call, let stand by the owner in 1.20.0:** the pitch bend wheel's control number (`PITCH_BEND`) moved to the Mapping module, beside the Control it numbers, so describing a Mapping no longer imports the control surface (another import cycle).
- **Tests:** `src/midi/controller.test.ts` at the seam (the C16 by its USB and Bluetooth names, another Controller, a Mapping for every Controller and one for the C16 only, the plug-in rule's cases); a stored Mapping with the C16's tag, none, or an unknown one (dropped) in `mappings.test.ts`; two specs in `e2e/c16Card.spec.ts`, written before the change and passing on both sides of it: a C16 plugged in with nothing mapped gets its layout, each Mapping "C16 only", which "C16 layout" puts back after Remove all; another Controller gets no layout, button or card.
- **CONTEXT.md** names a known Controller.
- **To try:** nothing a player sees or hears changed. With the C16 (USB or Bluetooth), nothing mapped: the layout comes in; "C16 layout" and "Print C16 card" in the MIDI panel; each layout Mapping "· C16 only"; a bank's knob brings its section into view on a phone; a fast knob turn moves a third of a step; another keyboard's sustain pedal and mod wheel still do their own.
