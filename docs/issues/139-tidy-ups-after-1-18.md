# 139: Tidy-ups after 1.18

**What to build:** The 1.18.0 review's, fact-check's and ripple hunt's small findings (inbox, 2026-10-31), polish for v1 ([131](./131-v1.md)): one shell for the docked cards, sums worked out once, a few names, the remembered settings in one module, a missing test and two Preset descriptions made exact. Nothing a player hears changes.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try

## Agent Brief

**Category:** enhancement
**Summary:** Tidy what 1.18.0's checks found: duplicated code, loose names, settings remembered outside their module, a missing test and two loose Preset descriptions.

**Current behavior and desired behavior:**
- **One docked-card shell.** The Tour's card copies the Tutorial card's shell (the top row, the tap-to-show words with the same two lint waivers, the actions row), and its classes say "tutorial" though the Tour is not a Tutorial. Both cards use one shell, with class names that fit both; the waivers are written once.
- **Each sum once.** Osc 2's Envelope term is worked out twice (beside the pitch in cents, which issue 100 made the one answer); FM's index (the FM index constant times FM) is written out in four places. Each has one home that the others call.
- **Names.** The engine tests call the Pulse Width "duty" (a word CONTEXT.md avoids); the Tour card's type shares its component's name; a phrase and its BPM travel together without a name; the Ideal Reference's cache is keyed by a string. Each gets a name in the glossary's words, or a type.
- **The remembered settings.** The cards' folds and the bend range are still remembered outside the one module issue 87 made for the Display settings; they move into it, and what a visitor has saved still loads.
- **A missing test.** When the Tour's "Build a Bass" opens the Bass Tutorial, the focus lands on its Start button; the test that checked it went with the Welcome's Tutorial button (issue 104). A test checks it again.
- **Two Preset descriptions.** FM Bass's "the sidebands jump wide and settle back" and Poly Mod Zap's "laser zap" are true to the ear but loose: the strike is FM's thinnest moment, and the zap is Osc 2's own fall. Their words say so; their sounds do not change.

**Key interfaces:**
- The docked cards (the Tutorial's and the Tour's)
- The engine's Osc 2 pitch and FM terms, and the Modulation model's
- The Display settings module and the stored settings
- The Presets' descriptions

**Acceptance criteria:**
- [ ] The Tour and the Tutorial cards look and behave as before (their e2e specs and the design audit pass unchanged)
- [ ] Osc 2's Envelope term and FM's index each have one definition; the engine and model tests pass unchanged
- [ ] "duty" is gone from the tests; the names follow CONTEXT.md
- [ ] A visitor's stored folds and bend range load after the move
- [ ] A test: the Tour's "Build a Bass" puts the focus on the Tutorial's Start
- [ ] The two descriptions pass the facts check
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Any change to a sound or a layout
- The Tour's Amp card words ([130](./130-the-tour-freezes-to-show-adsr.md))

## How it was built

Built 2026-11-01, at night, on `night/2026-11-01` (commits `Issue 139: …`). Nothing heard or seen changes. None of tonight's other issues had done any of it.

- **One shell for the cards.** `CardShell` (`src/ui/CardShell.tsx`) is the frame both the Tutorial's and the Tour's cards use: the top row (name, progress, +, the fold, ×, the row it is dragged by), the words that a tap opens on a phone, with their two lint waivers written once, and the actions row, the way forward going to the top row when the card is folded. It also docks the card, places it and moves the focus to the way forward (`useCardFocus` moved into it from the Tutorial's card). Each card brings only its own words, buttons and rings. The classes fit both: `card-shell`, `card-top`, `card-name`, `card-progress`, `card-more`, `card-words`, `card-then`, `card-actions`, `card-spacer`. `tutorial` and `tour` stay on each card's section, and `tutorial-say` on a Step's instruction, which only a Tutorial has.
- **Each sum once.** Osc 2's Envelope term is `osc2EnvelopeCents` in the Modulation model. `osc2Cents` adds it, the Ideal rests Osc 2 on it at the Sustain (its `osc2Rest`, no longer exported, now a ratio), and the engine's gain on the Filter Envelope is the term at full. FM's index is `fmIndex` beside `FM_INDEX`. The engine's FM depth, the Ideal's FM partials, `fmDepthKept`'s peak and the Synth Geek Layer's β all call it.
- **Names.** The engine test's "duty" is the Pulse Width (`pulseWidths`, `pulseWidth`). The Tour's type `TourCard` is now `TourSection`, as its comment said ("One Section of the page, in the signal's order"). The component keeps `TourCard`, as `TutorialCard` and `C16Card` do. A phrase and its BPM are a `PhraseAtTempo` (`src/demo/phrase.ts`): a Tutorial, a Tour Section and the Song extend or are one, and Listen takes one. The Ideal's cache is keyed by an `IdealKey`, a typed text made by `idealKey` from the Note's `IdealNote`. It stays a text because the cache compares keys as a `Map` does.
- **The remembered settings.** The cards' folds (`cardFolded.demo`, `.tutorial`, `.tour`), the bend range and the aftertouch Destination are kept with the Display settings, under their old keys and in their old forms (`'1'`/`'0'`, the digits, the Destination's id). Each is read back through the one check, which now matches a single setting's text against its values written out, so a number is kept as its digits. The module now keeps more than the Display's, so it is named for what it holds: `src/app/rememberedSettings.ts`, with `RememberedSetting`, `RememberedValue` and `useRememberedSetting` (issue 87 has a Since then line). The App and the MIDI panel use `useRememberedSetting`, and the fold uses `recall` and `remember`. `BEND_RANGES` moved there from the MIDI panel. A unit test loads each as a browser saved it before the move, falls back on an unknown value, and writes the same form back.
- **The missing test.** `e2e/tour.spec.ts`: from the Tour's last card, "Build a Bass" puts the focus on the Bass Tutorial's Start.
- **Two Preset descriptions.** FM Bass: at the strike FM is at its thinnest, a few sidebands spaced wide, because the Envelope raises Osc 2 an octave while FM's depth stays the knobs', which halves the index. As Osc 2 falls back onto the Note, the sidebands close in and fill every Harmonic. This matches the fact-check of 2026-10-30 (`docs/reviews`), which measured 2f going from −19 dB at the strike to +1.8 dB at 0.5 s. Poly Mod Zap: the zap is Osc 2's own two-octave dive, heard in the Mixer. Its FM, a quarter as deep at the strike (Osc 2 four times higher), brightens the held Note. The Patches are unchanged.
- **The two descriptions shortened (a slip found after the build).** At 294 and 267 characters (now 247 and 237) they broke issue 153's rule in `e2e/patches.spec.ts` (FM Bass reached the Osc tabs at 375 px, and a description took three lines at 1440 and 2000 px). FM Bass drops "onto the Note" and its closing "a rubbery, punchy attack"; Poly Mod Zap says the dive is "heard in the Mixer" and "the laser zap", without "Osc 2’s own" and "each Note starts with". What each says about FM is unchanged. The spec passes at every width in Chromium and WebKit, and the Presets' unit tests pass (117).

Calls made without the owner (Claude's call, open to the owner):

1. **The e2e specs' class selectors were renamed with the classes** (`.tutorial-words` to `.card-words`, and so on, nine lines in three specs). Their assertions are unchanged. The criterion's "pass unchanged" is read as "check the same things".
2. **The aftertouch Destination moved too,** though the issue names only the folds and the bend range. Issue 132 added it tonight beside the bend range, remembered the same loose way.
3. **The names:** `TourSection` for the Tour's data and `PhraseAtTempo` for a phrase with its tempo; the glossary had no word for either. `CardShell` and `card-*` for the shared frame, as "guide" is the Display's Guides.
4. **A stored bend range other than 2, 7 or 12** (which the panel never offered) now loads as 2, where any number loaded before.
5. **The settings module renamed** `rememberedSettings`, as it holds the tempo, Bead's switch, the folds and the MIDI settings besides the Display's (the code review's call on the names rule).
6. A Tutorial's card is placed afresh when its Tutorial changes, not its Preset's name. Each Tutorial is one constant, so this is the same moment.

Tests: `npx tsc` and `npm run lint` clean. Vitest, the unit tests of every folder touched, 772 passed, and the engine's browser tests (`synthEngine`, `patchesAtTheEdges`, `presets`, `usePlayers`), 440 passed. Playwright ran `tour`, `tutorial`, `dockedCards`, `demo`, `midiKeyboard`, `designPrinciples` (the design audit), `patchSearch` and `mascot`. Chromium passed 170 of 170 (`dockedCards`, `midiKeyboard` and `tour` ran again after the review's renames, 31 of 31). WebKit passed 165, with 5 skipped because they run in Chromium only. None of this ran in Linux's fonts here: GitHub's run checks that criterion. No class change moves a layout: each rule moved with its class.

What to try in the app: nothing should look or sound different. Worth a pass: a Tutorial's card and the Tour's (fold them, drag them, reload and see the fold kept; on a phone, tap the words and +; the Tour's last card, "Build a Bass", then Enter starts the Bass Tutorial); the MIDI panel's Bend and Aftertouch, kept over a reload; FM Bass and Poly Mod Zap, and their new words in the Patches panel.
