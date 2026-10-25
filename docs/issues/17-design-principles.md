# 17: Design principles

**What to build:** The rules the new look is judged against ([design-principles.md](../design-principles.md)), and the checks that keep them true: contrast and target sizes measured in both themes, so later issues cannot quietly break them.

**Blocked by:** none

**Status:** done. The checks are `e2e/designPrinciples.spec.ts` (the audit itself is `e2e/audit.ts`). Where look B departs from a rule on purpose, a waiver in the spec covers it down to a floor (see the design principles' Waivers): a new failure fails the suite, and so does a waived element that gets worse.

- [x] `docs/design-principles.md` written: structure, controls, motion, accessibility, sources
- [x] e2e: text contrast ≥ 4.5:1 and control boundaries ≥ 3:1 in both themes, sampled from computed colours of every knob, fader, button and label
- [x] e2e: every interactive element ≥ 24 × 24 px at 1440×900, ≥ 44 × 44 at 375×812
- [x] e2e: every knob and fader works from the keyboard and shows a focus ring
- [x] Today's failures listed here, each assigned to the issue that fixes it

## Today's failures (2026-10-25)

Measured on the page as loaded, each Oscillator tab, and each panel (Patches, Display, MIDI, About).

| Rule | What fails | Measured | Outcome |
| --- | --- | --- | --- |
| Control edges 3:1 | Buttons, pickers, fields and Patch items: their border (`--border`) and the selected segment's fill (`--control-on`), both themes | 1.1 to 1.5:1 | waived ([27](./27-contrast.md)); a selector's chosen option is brighter now (1.5 to 2.1:1) |
| Control edges 3:1 | A knob's groove and a fader's track (`--groove`), both themes | 1.3:1 | waived ([27](./27-contrast.md)) |
| Text 4.5:1 | Light theme: muted text on buttons, pickers and the section strip (`--muted`) | 4.1 to 4.4:1 | waived ([27](./27-contrast.md)) |
| Text 4.5:1 | Light theme: the Oscillators heading and its strip tab, in the stage green | 3.3 to 3.5:1 | waived ([27](./27-contrast.md)) |
| Text 4.5:1 | The Space hint on Freeze, at 60 % opacity, both themes | 2.3 to 2.9:1 | waived ([27](./27-contrast.md)) |
| Targets 24 px (laptop) | Segmented pickers (22 px tall); piano keys (white 20 px, black 12 px wide) | | waived ([28](./28-target-sizes.md)) |
| Targets 44 px (phone) | Controls at the toolbar height (28 px): Patch bar, Display, tabs, pickers, destination selectors, the panels' buttons and fields; header icon buttons (34 to 40 px wide); Preset arrows (18 px wide); the logo (24 px tall); black piano keys (27 px wide) | | waived ([28](./28-target-sizes.md)) |
| Keyboard | Osc 2's Octave and Semitone did not move with the arrow keys (a 2 % step rounded back to the same whole number) | | fixed here: a stepped Parameter moves a whole step per key |

What passes: every other text, the value arcs and modulation rings, the faders' fill, every knob and fader reached with Tab with a focus ring (none after a click), and the knobs and fader pads at both sizes.
