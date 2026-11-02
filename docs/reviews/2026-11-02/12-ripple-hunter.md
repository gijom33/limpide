# Review 12: the ripple hunter

Read: `git diff v1.20.0...HEAD` (HEAD `6fd42d6`, version 1.21.0, 85 commits: the release log's 1.21.0 line and `docs/night/2026-11-01.md`). Then searched the tips, the Presets, the Tutorials and the Tour, `CONTEXT.md`, the README and its screenshot, the PRD, the design principles, the ADRs' Status lines, the open issues and the issues' "Since then" notes, `docs/bead.md`, the code comments, and the e2e and unit test names, for what the release changed: the Synth Geek Layer's name and its numbers, aftertouch per Note, the MIDI clock, tempo sync taught, the header's arrangement C and its words, the 2 × 2 header, the piano grown by whole keys, Bead pointing the way and facing its way, the plain words, the Tutorials' words, the short forms, History, Bluetooth MIDI and the tidy-ups. Each finding below was checked against the current code.

## Findings

1. **The header's words up to 1279 px, in six places.** Since issue 154 every header button is an icon alone from 861 to 1099 px; Hold, MIDI and Display stay so up to 1279 px, About keeping its word from 1100 px with Demo, Tutorial and Song; the BPM shows its number alone up to 1279 px too (`src/styles.css`, `@media (min-width: 1100px) and (max-width: 1279px)`). Still saying otherwise: issue 106's last "Since then" (Hold, MIDI, Display and About "up to 1365 px", so their names alone with Tips off up to there), issue 81's "Since then" (the same), issue 44's line for 154 (silent on the words, under 112's "861 to 1365 px"), `src/ui/Tooltip.tsx:29` ("861 to 1099 px"), `e2e/midiClock.spec.ts:86` and the MIDI mark's CSS comment (the BPM its number alone, and so only the green edge marking the clock, "from 861 to 1099 px"). Issue 136 itself has the right Since then. **Fixed** (`45d7e07`).

2. **The header's order, from 861 px.** `src/ui/App.tsx:552` said the header holds "the keyboard, set-up (Hold, the tempo, MIDI, Display, About) and playing and learning (Demo, Tutorial, Song), in the order each layout shows them"; from 861 px it is Hold, the tempo, then Demo over Song, Tutorial over About, MIDI over Display. The test at `e2e/header.spec.ts:48`, named "Demo, Tutorial, Song and Hold, MIDI, Display, About each read left to right", is generated for the laptop and wide sizes too, where Song sits under Demo and Display under MIDI; its body checks the row order only up to 860 px. **Fixed:** the comment, and the test's name says what it checks at each layout (`f3a216a`).

3. **ADR-0018, a consequence:** "The header's set-up row holds the BPM and Tap". From 861 px they are a column of their own beside Hold (arrangement C, decided by the owner). **Fixed** in its Status line only (`ca73e32`).

4. **Issue 131's checklist** listed "[132]: channel aftertouch"; its decision 9 has the Since then for per-Note aftertouch, the PRD and CONTEXT.md say both. **Fixed** (`d17c495`).

5. **Issue 176, "A synced Rate shows its note value alone",** said "The Synth Geek Layer's period waits for 169". 169 is built: with the layer on, a synced Rate reads its period in the note value's place ("0.50 s" for 1/4 at 120 BPM, `e2e/geek.spec.ts:163`), so the title holds with the layer off only. **Fixed:** a Since then line (`c504a94`).

6. **Issue 14, the Maths Layer's own issue (done),** still said "'Maths' is a fifth toggle in the Display panel's Show group", with no pointer to the rename. **Fixed:** a Since then line for 165 (`48b0f00`). The other "Maths" left are history: done issues' records (40, 59, 62, 109 with its `src/music/maths.ts`, 161 by 165's call, the release log), the owner's quotes in 133 and 134, 133's file name (kept by 165's call), and CONTEXT.md's Avoid. No visitor-facing word, test name or code name says Maths.

7. **The Synth Geek Layer's own tip** (`src/ui/tips.ts:555`) listed what the layer showed in 1.20.0 and History: none of 167–170's numbers (Osc 2's multiples and Detune's beats, each LFO's period and swing, the Cutoff under Key Track, the Scopes' period and frequency) nor the formulas under the hood in the tips. Issue 109 set the habit of the tip naming the layer's new lines; CONTEXT.md's entry was updated, the tip was not. **Fixed** (`6d41c51`); the tips and History unit tests pass (119).

8. **The glossary now avoids "rung, spike, bar" for a Harmonic** (issue 129, decision 7: "partials, rungs, spikes and bars go"), but only the Tutorials and the Tour were rewritten and are held by the words test. Still saying them: 8 tips (`src/ui/tips.ts`: the Sub fader's "rung"; the Sub's options', FM's, Ring's, the Waveform's, Osc 1's Octave's and both Spectrums' "spikes"), 11 Preset descriptions (Pure Sine, Hollow Square, Sub Ladder, Sub Two Down, Deep Breath, FM Ladder, 808 Boom, Organ, Sub Drop among them; Thin Pulse's and Pluck Shape's "spike" are the Scope's and the Timeline's) and two Demo captions (Cathedral, FM Bell, `src/demo/track.ts`). Whether decision 7 reaches the tips and Presets, and the Preset descriptions' box tests: **to the inbox.**

9. **The README's screenshot** (`docs/screenshot.png`, last taken 2026-10-31) shows the header before issue 112: one row, Hold, MIDI, Display, About, Demo, Tutorial, Song in a line, no BPM or Tap, a centred piano of ten white keys; and the LFOs without Sync. Since 154 the header is arrangement C and the piano grows by whole keys. It is the repository's front page: **to the inbox,** a retake at the release.

Checked and still true:
- CONTEXT.md: the Synth Geek Layer, History, Aftertouch (per Note added, "one for the whole keyboard" meaning one pressure), the Tempo with the MIDI clock, the Tutorial's and the Tour's first and last cards, the Step's exact step, Short forms, the Effective Cutoff with Aftertouch, the Mascot ("everything it does is in docs/bead.md").
- The PRD: the Synth Geek Layer everywhere, stories 103 and 104, the aftertouch lines, "In v1, still to do" (every issue there is ready-for-human, not done).
- The design principles: the Synth Geek Layer, One line, shorter words, the audit's wrap rule. The waivers are held by the audit's "unused" check.
- `docs/bead.md`: About at its own size (178), facing its way (179), the Tutorial and Tour section (151), reduced motion.
- Aftertouch: the MIDI panel's tip, the Timeline's line tip, the parser, control surface and `useMidi` comments, `e2e/midiKeyboard.spec.ts` (its first test is the channel's, named so), issue 132's Since then lines.
- The MIDI clock: the Tempo's clock tip, CONTEXT.md, the PRD, ADR-0018's line on issue 136.
- Tempo sync: the five synced Presets' descriptions, the Demo's synced moves (`src/demo/track.test.ts` holds that no synced Rate's Hz is turned), the Wobble Tutorial's intro (3 Hz, then tied to the beat), the Rate tips.
- The header from 601 to 860 px (152): the CSS comments, `App.tsx`'s, the header spec's, issues 44, 105, 112, 157's Since then lines.
- The piano grown (154): no doc counts its keys; issue 82's and 105's Since then lines.
- The Tutorial card's words, the Tour's "Build a Bass", the words test's scope; Bluetooth MIDI's tip and test; 139's renamed names (no old one left outside issues' records); `docs/releasing.md` and `docs/night-shift.md`.

Seen in passing, not caused by this release:
- `e2e/fitsScreen.spec.ts:90` fails "Display button is not on the title line" only if Display starts below the Wordmark's foot; since 154 Display is the lower of its column, so the message no longer means "beside the title". It passes.
