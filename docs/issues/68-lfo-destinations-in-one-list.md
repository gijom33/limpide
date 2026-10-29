# 68: The LFO Destinations in one list

**What to build:** From the 1.12.0 code review, codebase health. A new LFO Destination meant editing the type and both CHOICES lists (`patch.ts`), the Tutorials' names (`tutorial.ts`), the picker's labels and stages (`DestinationPicker.tsx`, whose stage type repeats STAGES) and the CSS; the label "Volume" is written twice. One list, each Destination with its label and stage, should feed them all. Along the way: `tremolo()` writes out `lfoOffset`'s sum again rather than calling it (to compute the swings once).

**Blocked by:** none

**Status:** done (2026-10-28). One list of LFO Destinations feeds the Patch's type and choices, the lookup, the Tutorials' names, the picker and its colours; `tremolo()` is built on `lfoOffset`. Nothing visible changed.

- [x] One list of Destinations (id, label, stage), read by the Patch's types and choices, the Tutorials, the picker and its colours
- [x] `tremolo()` built on `lfoOffset`

## How it was built

- `LFO_DESTINATIONS` in `src/patch/patch.ts` (id, label, stage, the knob it moves), beside `STAGES` (the three stages with their sections' names): `LfoDestination` is its ids, both LFOs' `CHOICES` read them, `DESTINATIONS` (`src/modulation/destinations.ts`) is the same list by id, the Tutorials' `CHOICE_NAMES` take its labels, and `DestinationPicker.tsx` lists it under `STAGES`. The menu's dot and group colours already followed `data-stage`, so a new Destination needs no CSS. "Volume" as a Destination's name is written once.
- `tremolo()` in `src/modulation/modulationModel.ts` is `1 + lfoOffset(…)` with each LFO's value less one, so the swings are computed once.
- Test: `destinations.test.ts`, the choices, the lookup and the Tutorials' names read the one list in one order.
