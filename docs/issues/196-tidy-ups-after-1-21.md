# 196: Tidy-ups after 1.21

**What to build:** The code reviews' smaller findings of 1.20.0 and 1.21.0 (inbox, 2026-11-01 and 2026-11-02), nothing visible changed except one: the plain words overstating a shared swing. As [139](./139-tidy-ups-after-1-18.md) and [148](./148-tidy-ups-after-1-19.md) did. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, not yet released; tried by the owner: "All good."

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

## How it was built

Done, each its own commit; nothing visible changes but the plain words' shared swing:

- **The plain words (123):** each LFO's swing is now the Modulation model's (`destinationSwings`), so two LFOs on one Destination share its room as in the sound; a unit test holds it (Resonance at 0.1, two LFOs at Depth 0.1 each: no "swelling resonance"; one alone: there). An LFO's part carries a flag rather than "and …"/"with …" in its text. Every Preset's words checked unchanged, at 120 and 90 BPM.
- **156:** `formAt` and `SHORTENING_STEPS` removed, with the test lines that alone reached them.
- **Facts written twice:** the plain words take a Note's frequency from `noteToFrequency` and the starting octave from `startingOctave`; the keyboard layout exports the letter keys in pitch order, and the piano counts its 10 white keys from them (`LETTER_WHITES`, Piano's default too).
- **One shape, one place:** the Tutorials' `controlName` reads the Mappings' `CHOICE_LABELS` (word for word the same as `CHOICE_CONTROLS`, now gone).
- **112's leftovers:** `knobTurns` finds an LFO's Rate by `LFO_KEYS`, not by writing the two ids out.
- **Names:** lfo.ts's `Beat` is `BeatGrid`; paramControl's `twins` is `turnedTogether`; the control surface's `thirds` is `partSteps`; the History's `STAGES` is `ENVELOPE_STAGES`.
- **React:** the Timeline's aftertouch ref is written in an effect.
- **Tests:** `BEAD_ON` in startState, used by the four specs that wrote it out; issue 142 gets an acceptance checklist, drawn from its decisions and tests.

Done later the same night (the coordinator lifted the time limit), each its own commit:

- **The engine's `setTempo`:** it and `applyPatch` share one per-LFO loop (`followRate`), the rate worked out once.
- **The beat marks:** built once, by `markedBeats` beside `followsTheBeat`, for the LFO plots and the Timeline.
- **The Geek readouts (167–170):** one table, `GEEK_CONTROLS`, gives each control its readout and its widest side by side; the Destinations' units and where their room is measured from move into the LFO laws (`unit`, `roomFrom`).
- **Bead:** its tail's height over its foot is worked out from its height and the tail's place in the drawing (`TAIL_HEIGHT`, mascotCling), and the page's "two boxes cross" test is `crosses`, beside the cling's overlap.
- **The Controller seam (149):** the C16's tag is written once (`C16_ID`) in c16.ts; the MIDI panel finds a Controller's tips in `CONTROLLER_TIPS`, typed by its id, not by `${id}Layout`.
- **The e2e tests:** read as the tests 129, 132, 154 and 156 added that name no issue, in a describe or their title (found from each issue's commits): nine, each title now ending with its issue.

Answered, not done (Claude's calls, open to the owner):

- **The Escape-or-press-outside effect:** Display, MIDI, the Tutorials and the Tempo already share `useHeaderPanel` (since 189); the Patch bar's stays its own, as its Escape clears the search first. Folding it in means the hook taking an Escape handler: left for a later tidy-up.
- **"A panel is open" written twice:** the Tooltip's `[data-panel]`/`[aria-expanded]` and the Patch bar's `OPEN_ELSEWHERE` ask different questions (a header panel, against anything open but a card); not merged.
- **The Geek readout worked out twice a render:** the first, in `useSyncExternalStore`'s snapshot, is what re-renders a control only when its text changes; computing the parts there would need a cache. Left, as the cost is one small function per render.
- **The `banks` argument:** kept, as the test's seam for how the shared buttons are found (the other way tests only today's layout).
- **The four Geek contexts:** kept apart. Merged into one, every control would re-render on any of them changing (a Note played re-renders the whole panel's knobs, not only those whose readout uses it): a change of behaviour in cost, beyond a tidy-up.
- **tips.ts still imports midi/c16** for the C16 layout tip's words (its banks and shared buttons): they are the C16's own facts, and passing them through the Controller record would put the tip's words in it. Its tips are no longer found by name (below).
- **Still open:** the 2 × 2 Demo test's WebKit cause: it needs GitHub's Linux WebKit to find.
- **Later, not now:** the shared "a player holds a setting" helper, as the issue says.

**Tests:** tsc, the lint; the describe, Presets, shortForms, History, lfo, Viewers, control surface, Tutorials, piano keys, input, patch and hooks unit tests; the about, mascot, piano and midiKeyboard specs in Chromium. Later: the music, modulation, midi and mascot unit tests; the engine's browser tests in Chromium and WebKit (377 each); the tempo spec in Chromium; the mascot spec in Chromium and WebKit (85 passed, 3 skipped by the spec, none failed); the piano, MIDI Learn, C16 card and Geek specs in Chromium (61 passed). Linux's fonts not tried (nothing here measures a width).

**To try:** nothing should look different. A Patch with both LFOs on one Destination at a low knob (Resonance 10 %, both Depths 10 %) no longer says "a swelling resonance" under its name.
