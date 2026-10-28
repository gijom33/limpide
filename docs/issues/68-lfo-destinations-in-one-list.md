# 68: The LFO Destinations in one list

**What to build:** From the 1.12.0 code review, codebase health. A new LFO Destination meant editing the type and both CHOICES lists (`patch.ts`), the Tutorials' names (`tutorial.ts`), the picker's labels and stages (`DestinationPicker.tsx`, whose stage type repeats STAGES) and the CSS; the label "Volume" is written twice. One list, each Destination with its label and stage, should feed them all. Along the way: `tremolo()` writes out `lfoOffset`'s sum again rather than calling it (to compute the swings once).

**Blocked by:** none

**Status:** to build; no visible change

- [ ] One list of Destinations (id, label, stage), read by the Patch's types and choices, the Tutorials, the picker and its colours
- [ ] `tremolo()` built on `lfoOffset`
