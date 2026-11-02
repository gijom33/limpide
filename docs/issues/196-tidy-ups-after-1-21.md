# 196: Tidy-ups after 1.21

**What to build:** The code reviews' smaller findings of 1.20.0 and 1.21.0 (inbox, 2026-11-01 and 2026-11-02), nothing visible changed except one: the plain words overstating a shared swing. As [139](./139-tidy-ups-after-1-18.md) and [148](./148-tidy-ups-after-1-19.md) did. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the inbox's lines of the 1.20.0 and 1.21.0 reviews and checks.

## Agent Brief

**Category:** enhancement
**Summary:** Small code findings: duplicated shapes and facts, names, a seam that leaks, test hygiene, and one wording bug in the plain words.

**The items:**
- **The plain words (123):** `swingOf` re-derives the Destinations' swings and ignores two LFOs sharing a Destination's room, so the words can overstate a shared swing; parts are told apart by their text ("and …", "with …") rather than a flag.
- **156:** `formAt` and `SHORTENING_STEPS` reached only by a test.
- **167–170:** the Geek readouts' and their widest's twin cascades → one table per control; their rooms and units kept apart from the LFO laws → beside them; four Geek contexts always provided together.
- **Facts written twice:** a Note's frequency and the starting octave in the plain words; Bead's tail height and box overlap; the piano's letter keys and white count.
- **One shape, one place:** the tempo panel's Escape-or-press-outside effect is the fifth copy (Display and Tutorial menus, MIDI panel, Patch bar); the Tutorials' CHOICE_CONTROLS repeats the Mappings' CHOICE_LABELS; "a panel is open" written twice.
- **112's leftovers:** knobTurns hard-codes the Rates' note-value twins ParamDef.knob declares; the beat marks built twice (LfoPlot and the Timeline); the engine's setTempo repeats applyPatch's per-LFO rate loop; the `banks` argument only a test passes.
- **Names:** lfo.ts's Beat holds a tempo; paramControl's `twins` already means the Response Curve's filter twins; the control surface's `thirds` holds any fast-turn share; `STAGES` in the History means the Envelope's stages.
- **The Controller seam (149):** the C16 record still compares tags in c16.ts and mappings.ts, and tips.ts imports midi/c16 and finds tips by `${id}Layout`.
- **React:** the Timeline's aftertouch ref written while rendering; the Geek readout worked out twice a render.
- **Tests:** e2e tests outside a describe naming their issue (132, 156, 129, 154); `'limpide.bead': 'on'` written out four times where startState could hold a BEAD_ON; issue 142 has no acceptance checklist; the 2 × 2 Demo test skipped in WebKit since 1.21.0, its cause on GitHub's Linux WebKit to find (the first scroll reads the Filter still 60 px under the header).
- **Later, not now:** a shared "a player holds a setting until touched" helper (112, 130, 158), if a fourth comes.

**Acceptance criteria:**
- [ ] Each item done or answered in this issue; nothing visible changes but the plain words' shared swing (a unit test)
- [ ] tsc, the lint, every unit and engine test; the specs touched pass; every test passes in Linux's fonts too

**Out of scope:**
- Bead's frame logic (issue 184)
