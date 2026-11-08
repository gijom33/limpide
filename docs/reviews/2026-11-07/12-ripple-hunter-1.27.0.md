# Review 12: the ripple hunter, on 1.27.0

Read: `git diff v1.26.2...main` (77 commits at `d23a055`: issues 251 to 261 and 263 to 267, then the 1.27.0 code review's triage into 268), and, for each thing the release changed (the Tour's seventh card, Glow on the Scopes, the pulse high for its width, the Presets' levels and words, MIDI Learn beside the C16, Detune's beats, the e2e helpers `steady()` and `frames()`, the issues' index and open calls, Display Steps closing the panel on a phone, the Song's line, the Tour's card standing aside, Escape on the cards, the Voices unwired), searched the tips, the Preset descriptions, the Tour's and the Tutorials' words, the Demo's captions, `CONTEXT.md`, the README, the PRD, the design principles, CONTRIBUTING.md, CODING_STANDARDS.md, CLAUDE.md, `docs/bead.md`, the ADRs, the open issues and the closed issues' "Since then" lines, the code comments and the unit and e2e test names. Each finding was checked against the code at `main`. Left out: what the inbox (2026-11-07, the 1.27.0 code review) and issue 268 already hold, such as Felt Piano's Velocity, Zap Pluck's fall across the keyboard and 257's figures measured with Glow Off. Read only: no Playwright.

Other sessions had uncommitted edits in the checkout while this ran (`src/tutorial/tour.ts`, `src/ui/tips.ts`, `e2e/tour.spec.ts`, issue 265). Where one of them already touches a finding, the finding says so.

## Findings

1. **The Tour's last card offers "a tune to play over", and a Note ends the Song.** `src/tutorial/tour.ts:195`, the "Your turn" card's first line (all a folded phone card shows): "Now play the piano’s keys, or press the ringed Song for a tune to play over." But a Note played by hand stops the Song: `src/shows/shows.ts:374-377` ("A Note played by hand (keyboard, piano or MIDI) ends the Song: the person has taken over"), the Song's tip ("Play a Note, or press Song again, to stop it", `src/ui/tips.ts:138`) and the glossary's Song ("A Note, the Demo or the Song button stops it", `CONTEXT.md:192`). A newcomer who follows the card's words loses the tune on their first key. The card's second line has it right: flip the Presets or turn a knob as the Song plays. Issue 260 quotes the line at `:50`. An uncommitted edit in the working tree already changes it to "press the ringed Song and shape its sound".

2. **"The Tour's last card opens the first Tutorial", in three places.** Since issue 260 the Tutorials card is the sixth of seven: it offers "Build a Sub Ladder" beside Next, and the last card, "Your turn", has "Play the Song" (`TOUR_FINDS`, `src/tutorial/tour.ts:184-202`).
   - `src/tutorial/tutorials.ts:15` (edited in this release): "the Tour's last card opens the first (issue 128)".
   - `src/tutorial/tutorials.test.ts:9`: "start with Sub Ladder, the one the Tour’s last card opens, …".
   - `CONTEXT.md:180`, the Tutorial: "Opened from … the header's Tutorial button, or the Tour's last card".
   - True: "the Tour's Tutorials card".

3. **The glossary's Tour: "Each card waits for Next", "nothing moving or playing".** `CONTEXT.md:184`. The last card has no Next: its way out is "Play the Song", which ends the Tour and starts the Song, beside Back and Done (`src/ui/TourCard.tsx:269-297`; `e2e/tour.spec.ts:492`, Next hidden on 7 of 7). True: "Each card waits for Next, the last for Play the Song or Done."

4. **`docs/bead.md:85`, where Bead points in the Tour:** "in the Tour, the first control each card turns, or the one it names (the Display button, the Tutorial button)". The seventh card names the Song button, and Bead goes there (`tourGuide`, `src/ui/TourCard.tsx:56-60`, from `shows: { kind: 'header', name: 'Song' }`). True: "(the Display button, the Tutorial button, the Song button)".

5. **Issue 128's notes on the Tour's end are a card behind.**
   - `docs/issues/128-how-a-synth-works.md:100`: "the Patch coming back closed is checked in the browser at cards 1 and 6". The test closes at cards 1 and 7 now (`e2e/tour.spec.ts:166`, `for (const at of [1, 7])`, Done on 7).
   - `:34`: "the Tour's last card's button names the first Tutorial, "Build a Sub Ladder"". 260 added Since-then lines to 210 (`:85`) and 233 (`:58`), but not to 128, the Tour's own issue.
   - True: "at cards 1 and 7"; and a Since-then line for 260 there, as in 210.

6. **Issue 230's decision 5 is changed by 254, and 230 does not say so.** `docs/issues/230-the-demos-card-small-in-the-corner.md:20`: "the Tour's and a Tutorial's cards point at controls and Viewers and keep their place and room as now". Issue 254's call 1 says it "changes [230]'s decision 5 … for the Tour's card on wide windows". The card now moves along the bottom where it would cover what it shows (`cardAside`, `src/ui/cardAside.ts`; `standAside`, `src/ui/TourCard.tsx:70`), 347 px on the Filter's and the Amp's cards at 1920 × 1080. 230 has no Since-then line for it. Nearby, `src/ui/cardPlacement.tsx:15-16` says the card "opens where the stylesheet docks it each time (the bottom's middle …). A double-click on the top row puts it back". It still opens there, but on the Tour the double-click puts it back where the Tour placed it on that card (254, "The person's place wins").

7. **"A learned Mapping answers every Controller", after issue 255 narrowed it.** One learned from another input on a control the C16 layout had now answers every Controller but the C16 (`except: 'c16'`; `answers`, `src/midi/controller.ts:78-79`; ADR-0017's Status line; `CONTEXT.md:296`).
   - `src/midi/mappings.ts:80-81`, the `Mapping` docstring: "A Mapping of a known Controller's built-in layout … answers that Controller alone; any other answers every Controller". The `except` field just below (`:88-92`) says otherwise.
   - `src/midi/controller.ts:71`, `answeredBy`: "undefined when it answers every Controller". It is also undefined for a Mapping with `except`, which does not answer every Controller (the panel's "· not the C16" comes from `except`, not from this).
   - `src/midi/controller.test.ts:39`: "a Mapping made by MIDI Learn or Quick Setup answers every Controller". `src/midi/controlSurface.test.ts:750`: "lets a Mapping learned from any Controller answer every Controller". Both test a Mapping without `except`; their names claim it for every learned one.
   - `docs/issues/145-the-c16-layout-strip-by-strip.md:45` ("Mappings made with MIDI Learn or Quick Setup answer any input, as today") and `:60` ("a MIDI-Learned Mapping still answers any input") have no Since-then line. ADR-0017's Status line records the change; the issue whose decision it was does not.
   - True: "any other answers every Controller, but the one it was learned away from (issue 255)".

8. **"The Filter self-oscillates", in the plain words' code, after 266 measured that it does not.** `src/patch/describe.ts:47`: "Resonance at its top (98 % and up): the Filter self-oscillates." And `:216`: "the Filter sings a tone of its own at the Cutoff (the Self-Oscillation Preset)". Issue 266, item 8, rewrote the Self-Oscillation Preset because "the Filter sings only on a Harmonic, the one nearest the Cutoff boosted 8.5 dB; nothing sounds between Harmonics, and with no input the Preset is silent". `src/patch/presets.browser.test.ts:788` now checks "nothing at the Cutoff between them". The words the code produces, "through a singing Filter", still hold: on Noise (the Kick, the Tom) it does sing at the Cutoff. Only the comments claim a tone of its own. True: "Resonance at its top: the Harmonic nearest the Cutoff rings out over the rest; on Noise, a tone at the Cutoff."

9. **Two Viewer-store tests prove nothing about Glow since it starts on Scopes.** `src/viewers/viewerStore.test.ts:38` ("changes by its actions") and `:53` ("saves every Display setting, Glow included (issue 180), …") dispatch `setGlow` to `'scopes'` and expect `'scopes'`. That has been the default since issue 264 (`src/app/rememberedSettings.ts:59`), so both pass with the Glow action or its save broken. 264 changed the first test's name and value (`:26`) but not these two. True: set `'all'` or `'off'`, as `e2e/displayPanel.spec.ts:102` sets All.

10. **CLAUDE.md on the hook and the push, after issue 261.**
    - `CLAUDE.md:17`: "Every commit: the pre-commit hook runs the inbox checks, `tsc` and the lint". It now also runs the issues' record check (`.githooks/pre-commit:4`, `issueRecord.ts check --staged`). That check fails a commit of the issues, the inbox or the ADRs while `docs/issues.md` or `docs/open-calls.md` is stale, or while a done issue has an unticked box (`docs/agents/issue-tracker.md:11`).
    - Its Inbox and Issues lines (`:9-10`) never say to run `npm run issues` after editing an issue, which the hook now requires.
    - Its "Before a push" (`:19`) lists `npx tsc`, `npm run lint`, `npx vitest run` and the Playwright specs. The release steps add `npm run issues:check` (`docs/releasing.md:7`). CLAUDE.md defers to `docs/releasing.md` for a release, but a push is a release here.
    - True: "the inbox checks, the issues' record (`npm run issues` after editing an issue), `tsc` and the lint".

11. **The design audit's "Glow on" state, now that Glow is always on.** `e2e/designPrinciples.spec.ts:8` and `:149-151` (the state named 'Glow on'), and `docs/design-principles.md:40` ("Glow on"). Since 264, every state is seen with Glow on the Scopes, and the state's own close goes "Back to Scopes, the default" (`:165`). What this state adds is Glow on All, the Spectrums glowing too. True: name it "Glow on All".

12. **Small names and comments behind the seventh card.**
    - `e2e/tour.spec.ts:442-443`: "after the Sections, the Tour tells of the Synth Geek Layer and its History, then the Tutorials". The test at `:457` ("…, then the Tutorials, each ringing where it is (issue 210)") also walks "Your turn" (`:486-495`).
    - `src/ui/CardShell.tsx:78`: "The way forward (Next, Start, Finish)". The Tour's last card's is "Play the Song" (`TourCard.tsx:271`).
    - An uncommitted edit already fixes the comment at `e2e/tour.spec.ts:608` ("The last two cards ring a button of the header").

## Checked and found holding

- **Glow on the Scopes:** `CONTEXT.md`, the design principles, the tip, and Since-then lines on 180, 199 and 229.
- **The pulse high for its width:** the engine and Ideal Reference comments, the Geek formula, the glossary, and the PWM and Sub Ladder notes ("stays up a quarter of the time" is now true).
- **Detune's beats:** the glossary, the formula, the e2e and unit test names, and Since-then lines on 167 and 207. The unison comments (`geek.test.ts:70`, `synthEngine.browser.test.ts:940`) still hold.
- **Init's 2 kHz Cutoff:** `TOUR_PATCH`'s comment, and no "open" claim left.
- **The Hold rhythm's beat of rest.**
- **The Resonance LFO's room.**
- **The Display panel closing on a phone:** `DisplayMenu`'s and `TutorialCard`'s comments.
- **The Song's line:** the PatchBar comments.
- **The e2e waits:** 63 `waitForTimeout`, each with its reason on its line or the one before. Nothing in CONTRIBUTING.md or CODING_STANDARDS.md contradicts `steady()` or `frames()`.
- **The issues' index and open calls:** the issue tracker's guide, the README and the release steps.
- **The Preset words:** the changed Presets' words against the Tutorials and the Demo. None of the nine Tutorials' Presets changed. The Kick's caption holds on Pink Noise.
- **The C16:** the Relative #1 notice and the Pickup cue, against the glossary and the PRD.
- **Escape on the cards and Safari's Tab:** no comment left saying WebKit's Tab skips buttons.
- **Issue 131's checklist** and the Status lines of 251 to 268.
