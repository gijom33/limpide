# Review 12: the ripple hunter

Read: `git diff v1.19.0...HEAD` (HEAD `f309907`, version 1.20.0, 176 commits, 26 issues: the release log's 1.20.0 line and `docs/night/2026-10-31.md`). Then searched the tips, the Presets, the Tutorials and the Tour, `CONTEXT.md`, the README, the PRD, the design principles, the ADRs, the open issues and the issues' "Since then" notes, `docs/bead.md`, the code comments, and the e2e and unit test names, for what the release changed: the synced Rate's readout, the Curve toggle's name, Bead out by default, the tip link, the arrow steps, the Guides, the C16 layout's places, the header's words, and the rest of the night's issues. I checked each finding below against the current code. Findings already in the inbox from the 1.20.0 code review and fact-check are left out: issue 112's body still showing "1/8 · 4 Hz" and decision 11's "buttons 8 and 9", issue 131's tick of the coffee link, the Wobble Tutorial's "3 Hz" Step with Sync on, the Tempo tip on the phone's BPM button, and the Guides' tip against a chord.

## Findings

1. **The header's words from 1100 to 1365 px, in three issues.** Issue 44's last "Since then" (`docs/issues/44-header-across-layouts.md:44`) said "The header's buttons drop their words only from 861 to 1099 px". Issue 106's Status (`:7`) and issue 81's "Since then" (`:9`) said a header button is an icon alone, and so shows its name alone with Tips off, "861 to 1099 px". Since issue 112 the tempo sits beside Hold, and Hold, MIDI, Display and About show their icons alone up to 1365 px (`src/styles.css`, `@media (min-width: 1100px) and (max-width: 1365px)`; `e2e/about.spec.ts:36`). The Tooltip names any header button whose word is hidden (`iconAlone`, `src/ui/Tooltip.tsx:69`), so with Tips off those four show their names up to 1365 px too. **Fixed:** a "Since then" line on 44 and 106, and the range in 81's (`0f4cb4b`).

2. **`src/ui/tips.ts:61`, the Quick Setup tip:** "then a button for Hold, Freeze, Snapshot and the Preset arrows". Issue 112 added Tap as its last Action step (`src/midi/quickSetup.ts:33`). **Fixed:** "Hold, Freeze, Snapshot, the Preset arrows and Tap" (`0f4cb4b`).

3. **The header's comments name set-up without the tempo:** "set-up (Hold, MIDI, Display, About)" in `src/ui/App.tsx:494`, `src/styles.css:94` and `:1389`, and the groups in `e2e/header.spec.ts:4-5`. The BPM (and Tap from 861 px) sits in set-up beside Hold (`App.tsx:351`). **Fixed** (`0f4cb4b`).

4. **A C16 knob's step, in the PRD and issue 145.** `docs/prd.md:216` said "the layout moves a control 1 % for a 65 and a third of that for a 66 (issue 145)", and `docs/issues/145-the-c16-layout-strip-by-strip.md:43` "a 65 moves a control 1 %". Since issue 160 a 65 moves one step of the control's Grid, in its own unit (a semitone of the Cutoff, 1 % of a level), and a 66 a third of one (`src/midi/controlSurface.test.ts:658`; issue 145's `:113` already had the line). **Fixed** (`079d6e6`).

5. **`docs/prd.md:156`, "In v1, still to do",** listed 145 among the polish. Issue 145 is done (2026-10-31, the owner on the real C16: "All fine for C16") and ticked in issue 131. **Fixed** (`079d6e6`).

6. **`docs/bead.md:85`, the Demo's surf:** "With no LFO on, or none in view, it conducts or plays air guitar instead." Since issue 164 a plot must also be clear of the cards (`src/ui/Mascot.tsx:441-450`), and in three across at 1440 × 900 the Demo's own card covers the plots' feet, so Bead does not surf there unless the card is dragged aside (the night's note on 164). **Fixed** (`b600d15`).

7. **Three Presets read "the beat" and "Sync" for Retrigger, now that Sync is a switch beside it.** Wobble: "every Note starts its wobble at the Cutoff and opens from there, so it lands on the beat" (`src/patch/presets.ts:232`). Stutter: "every Note starts its stutter open, on the beat" (`:596`). The Preset named Key Sync (`:195`) is a lesson in Retrigger. None uses Sync; since issue 112 "the beat" is the Tempo's, and the LFO with Sync on is the one that lands on it. Stutter's 8 Hz is 1/16 at 120 BPM. A question of words and maybe of Presets: **to the inbox.**

8. **Issue 123, open, plans its line on an about line that issue 153 changed.** It puts the generated phrase "under the Patch name, where 109 shows a Preset's about line: after the first knob is turned" (`docs/issues/123-a-patch-in-plain-words.md:16`), and ticks "a Preset shows its own about line until a knob is turned" (`:24`). Since 153 the about line shows only for a Preset picked in the Patches panel, in a box with a ×, closing on Escape, a knob or another load, and never for the arrows, a Controller's pads or a Program Change (`e2e/patches.spec.ts:39`). What an arrow load shows there, and whether the phrase shares the box, is for 123's grilling: **to the inbox.**

9. **The README's "What you can do" (`README.md:17-27`) says nothing of the tempo, LFO Sync or Legato,** two of the three features v1 holds for the plugin (issue 131, decision 5), both in 1.20.0. Nothing in the list is untrue: **to the inbox,** as a line to add.

Checked and still true:
- `CONTEXT.md`'s Sync, Tempo, Grid, Legato, Retrigger, Mapping, Action, Encoder Mode, C16 layout, Known Controller, Guides, Nominal Level, Response Curve ("Display's Filter toggle"), Mascot, Step and Snapshot entries.
- The tips for Sync, the Rate (free and synced, its Hz in the tip), the LFO plot and the Timeline (the beat lines), Retrigger and Legato, Bead, the Guides, the Filter toggle, the C16 layout and card. Each knob's and fader's steps line is built from its Grid.
- The Tutorials' and the Tour's "Curve" is the drawn line, never the toggle. Bass Step 4's words fit issue 158. The Tour's Amp card is described as it plays (`src/tutorial/tour.ts:101-102`).
- The coffee link: gone from About (`e2e/about.spec.ts:19`) and the README; issue 146's dated line, `.out-of-scope/tip-link.md`.
- Bead out by default: the README line, `docs/bead.md`, the Display tip, About's card, `CONTEXT.md`, `e2e/startState.ts` and the mascot spec's opening comment.
- The arrow steps: issues 51's and 53's "Since then" lines, `e2e/knob.spec.ts:300-301`, `e2e/keyboardAccess.spec.ts:40`; no "2 %" left outside the history.
- The Guides: `CONTEXT.md`, the tip, `src/viewers/guides.ts`, `e2e/overlays.spec.ts:67`, ADR-0006 (which names no Guide level).
- The C16 layout's places: `C16_BANKS` (Sync on bank D's R2 and R4, Legato on bank C's R2), issue 145's bank lists, issue 34's "Since then" lines, the tips and the card built from the data. ADR-0009 and ADR-0017 call bank D "the LFOs" where the layout and its tips (issue 148) say "LFO & Envelopes": the same section, not untrue, and an accepted ADR changes only in its Status line, so left.
- The synced Rate: issue 112's "Since then" for 176; `CONTEXT.md`'s Sync; `e2e/tempo.spec.ts:78`.
- ADR-0018 and the PRD's tempo, Legato and Voices lines; the design principles' greyed-out and no-overlap rules.

Seen in passing, not caused by this release:
- The README's statistics line (`:76`) still stops at 1.17.0; the release's `npm run stats` step fills it.
- `docs/releasing.md:16` says the deploy run takes "about 6 minutes"; GitHub's runs have taken about 10 since 1.19.0.
