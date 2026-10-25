# 27: Contrast

**What to build:** Every control's edge stands out from the panel at 3:1 and every text at 4.5:1, in both themes, as the design principles require (issue 17 measured today's failures).

**Blocked by:** none

**Status:** done: waived, but for the selectors. The owner's decision (2026-10-25), after the prototype: look B's quiet edges and the light theme's text stay as they are, and each departure is a waiver with a floor in `e2e/designPrinciples.spec.ts` (listed in the design principles). The one change: a selector's chosen option (Waveform, Filter Mode, Slope, Voices, LFO shape, the Display panel's toggles) has a brighter fill, `--segment-on` (24 % text in the panel, against 14 % before): 2.1:1 on its track in the dark theme, 1.5:1 in the light.

The prototype is kept, never merged, on branch `prototype/27-contrast` (latest `69f21f8`): today and three variants on the real page, switched with `?variant=0|A|B|C` (A: edges at 3.1:1, B: at 4.6:1 with the chosen option inverted, C: borderless buttons), with an audit of each (`e2e/proto27.spec.ts`); A, B and C each cleared every contrast failure. `npm run proto` serves it on the local network.

- [x] Control edges (`--border`, `--control-on`): waived, floor 1.1:1
- [x] A selector's chosen option: brighter (`--segment-on`), floor 1.45:1
- [x] A knob's groove and a fader's track (`--groove`): waived, floor 1.2:1
- [x] Light theme: `--muted` text: waived, floor 4:1
- [x] Light theme: the Oscillators green as text: waived, floor 3.25:1
- [x] The Space hint on Freeze: waived, floor 2.25:1
