# Review 12: the ripple hunter

Read: `git diff v1.18.0...HEAD` (HEAD `ff59240`, version 1.19.0, 52 commits). Then searched the tips, the Presets, the Tutorials and the Tour, `CONTEXT.md`, the README, the PRD, the design principles, the ADRs, the open issues and their "Since then" notes, `docs/bead.md`, the code comments, and the e2e and unit test names. I checked each finding below against the current code. Findings already in the inbox from the 1.19.0 code review are left out: issue 34's table, the `'detect'` leftovers in code, and the C16 tip's "D the LFOs".

## Findings

1. **`docs/issues/25-releases.md:39`, the 1.19.0 release line, which becomes the GitHub Release's notes (`docs/releasing.md:16`).** It says "its knobs set to Relative #1 move a control 1 % a step at any speed". The speed does change the step. A 65 moves 1 %, and a 66 moves a third of that (`C16_BURST_STEP`, `src/midi/controlSurface.ts:22`; issue 145's last "Since then" under decision 18). Turned slowly, a bit of turning sends one 65, which is 1 %. Turned fast, the same bit sends a burst of eight 66s, which is about 2.7 %. The release is not pushed yet, so this can still be fixed before its notes go out.

2. **`docs/issues/143-bluetooth-midi.md:9`** still reads "needs-triage · enhancement" and "Blocked by: the owner's answers below". `:5` still says a paired C16 "may already play Limpide". That has been confirmed: issue 34 (`:22`) records "Synido TempoPAD C16 BT Bluetooth", and so do the PRD (`:214`), `isC16`'s comment (`src/midi/c16.ts:120`) and its test (`src/midi/c16.test.ts:101`). The release line also says "The C16 plays over Bluetooth MIDI too (143)". Issue 143 is missing from issue 131's v1 list.

3. **`docs/prd.md:154`, "In v1, still to do",** lists "the polish of 116, 129, 130, 47, 34, 42, 48 and 111". Issue 34 has been superseded, and it is ticked in issue 131 (`:47`). Issue 145, still open in issue 131 (`:48`), is not listed.

4. **`src/ui/MidiPanel.tsx:47`:** "No MIDI Controller connected. Plug one in (USB) and it is picked up straight away." A controller paired over Bluetooth MIDI is picked up too (issue 143; ADR-0017: "over USB or Bluetooth").

5. **`docs/issues/34-c16-bank-layout.md:24`, its Known limits.**
   - "(the layout's own buttons are toggles)": the layout's Action buttons are now momentary (`buttonMode`, `src/midi/c16.ts`).
   - "a bank's section is followed from the CC alone, so another Controller sending channel-1 CCs in the C16's ranges moves it too": the bank follow now runs only for messages from a C16 (`fromC16 &&`, `src/ui/hooks/useMidi.ts:229`).
   - `:29` says the layout "is to be replaced", but it has been replaced.

6. **Bead under a phone's tabs (issue 142), with no "Since then" in issue 115.**
   - Decision 18 (`docs/issues/115-an-easter-egg.md:35`): "when no section edge has room for it in view … it hangs under the header", taking "the one it is on while the drop fits under the header".
   - How it was built (`:68`): "while the drop fits between that edge and the header (and the section strip) … else hangs it".
   - Now, under the section strip, it stands on any edge that shows at least 2 px below the strip, drawn over the strip (`EDGE_SHOWING`, `src/ui/Mascot.tsx:102`; `choosePerch`'s `overlap`).
   - The same stale words appear in `src/ui/Mascot.tsx:216` ("hanging under the header when none has room") and in `e2e/mascot.spec.ts:6-7`.
   - `:72` also says the frame-cost check runs in "both browsers". Since issue 138 it runs in Chromium only (`e2e/mascot.spec.ts:198-202`).

7. **Bead's droplets and fishing line stay under the tabs it now stands over.** `.mascot` moved to z-index 9 (`src/styles.css:798`), the section strip's own (`:1331`). `.mascot-spray` (`:807`) and `.mascot-fishing` (`:839`) are still at 5, and they are siblings of the strip inside `main`. A splash or a click while Bead stands over the tabs sends droplets up behind them. I checked this in the code only and have not seen it on screen.

8. **The C16 layout's knobs are declared, not detected.**
   - `src/midi/encoderMode.ts:26` still says `detectKnobMode` is for knobs "known to be an endless encoder … (the C16 layout's)".
   - The test name at `src/midi/encoderMode.test.ts:24` reads "reads a C16 knob's first turn".
   - Today's layout maps its knobs `relative-centred` (`c16Layout`). Detection serves only a first-layout Mapping that has not been brought over yet.

9. **`docs/prd.md:104`, story 53:** "its buttons the Actions … (issue 34)". The layout's buttons now also step the Waveforms and switch the two-way choices (the R row, S4). Issue 145 and ADR-0017 are not cited.

10. **`docs/issues/42-reviews.md:177`, profile 17's "Where":** it sends the next MIDI-mapping review to "ADR-0009, issue 34's table". The layout now lives in ADR-0017, issue 145, `C16_BANKS` and the card (`#c16-card`, `docs/c16-card.pdf`).

Checked and still true:
- The C16 layout and C16 card tips, and `CONTEXT.md`'s Mapping, C16 layout and Encoder Mode entries.
- ADR-0009's Status line and ADR-0017's corrected Status line.
- The MIDI panel's Momentary, Toggle and "C16 only" labels. No "Press" mode label is left; the Tutorials' "Press" is for an Action step.
- Issue 112's "buttons 8 and 9" (decision 11), which its `:58` "Since then" covers, and issue 119's R2.
- About's credits: the Support row sits under "Made by", and `e2e/about.spec.ts` checks its link. The README's coffee line.
- `docs/bead.md`. The Tutorials, Tour and Presets, which say nothing about the C16.

Seen in passing, not caused by this release:
- The README (`:75`) and `docs/statistics.md` stop at 1.17.0, with no row for 1.18.0.
- `docs/prd.md:18` says the C16 "is mapped in seconds with Quick Setup", but since 1.5.0 it maps itself.
