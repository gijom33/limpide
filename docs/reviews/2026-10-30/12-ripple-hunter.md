# Review 12: the ripple hunter

Read: `git diff v1.15.1...HEAD` (no v1.16.0 tag yet; HEAD is `a4eac17`, 60 commits), then searched the tips, the Presets, the Tutorials, `CONTEXT.md`, the README and its screenshot, the PRD, the design principles, the ADRs, the open issues and the issues' "Since then" notes, the code comments, the e2e and unit test names, and the Demo card. Each finding below was checked against the current code.

## Findings

1. **`src/ui/tips.ts:149`, the LFO Destination tooltip, lists seven Destinations and leaves out FM.** "What the LFO moves, at full Depth. Pitch: … Osc 2 Pitch: … Detune: … Pulse Width: … Cutoff: … Resonance: … Volume: …". Now there are eight, with FM after Pulse Width (`LFO_DESTINATIONS` in `src/patch/patch.ts:76`; `e2e/lfoDestination.spec.ts:9` steps through "the eight"). The tooltip is shown on both LFOs' Destination pickers (`src/ui/LfoControls.tsx:63`). Issue 97 changed the FM knob's tip but not this one. FM's line should say how far it swings: up to its whole range, only as far as the FM knob leaves room each way (`LFO_LAWS.fm`).

2. **The header's "one order", on phones and in 2 × 2.** Three places say the order on screen is the order in the DOM, and that is no longer true at 860 px and below:
   - `src/ui/App.tsx:227-228`: "One order at every width (issue 44): the Wordmark and the Patch, the keyboard, then playing and learning (Demo, Tutorial, Song) and set-up (Hold, MIDI, Display, About)". The DOM now has set-up first: `.header-set` (line 260) comes before `.header-play` (line 355), both inside `.header-right`.
   - `e2e/header.spec.ts:3-4` says "The same order at every width (… Hold, MIDI, Display, About; Demo, Tutorial, Song …)". The test name at `:37`, "one order at 390×844 (phone): Hold, MIDI, Display, About, then Demo, Tutorial, Song", is generated for the phone and foldable sizes too. At those sizes the grid puts the play group left of set-up: `'play set'` at `src/styles.css:1157` (≤ 860 px) and `'identity play set'` at `:1210` (601–860 px). The test checks no left-to-right order between the two groups there, so it passes while its name is false.
   - `docs/issues/44-header-across-layouts.md:32`: "[x] The header's order the same at every width, in the DOM as on screen (focus order follows)". On phones and in 2 × 2, Tab now reaches Hold, MIDI, Display and About before Demo, Tutorial and Song, which sit to their left. That is a focus-order mismatch (WCAG 2.4.3), not just stale wording.

3. **`docs/issues/82-top-row-centres-the-piano.md` is open and describes a header that has been replaced.** Its Status line (`:7`) reads "ready-for-human … its stacking of the logo approved … in main for the next release, the owner to judge the look once live". Decision 4 (`:42`) is "the logo over the Patch picker, and Demo and Tutorial over Song". How it was built (`:57-58`) names `.header-identity` "a column (the logo over the Patch picker)", `.header-play` "a two-column grid", and tests that no longer exist ("Song under Demo at 1440", "the name over the Patch picker"). The acceptance criteria say "within 80 px". Commit `9e34d4e` replaced all of this: the Patch picker sits beside the logo, Demo, Tutorial and Song moved right of the keyboard under set-up, and the bound is 100 px (`e2e/toolbarLayout.spec.ts:138-147`; `e2e/brand.spec.ts`, "the Patch picker beside it on the header line"). The owner would be asked to judge a look that has not shipped.

4. **`src/ui/tips.ts:219`, the Oscillators section's tooltip:** "Two Oscillators, a Sub an octave down and Noise are mixed here". The Sub is now one or two octaves down (`subOctave: -1 | -2`, `src/patch/patch.ts:86`), and Ring is a fifth source in the Mixer (`mixRing`, `src/ui/App.tsx:548`). This is the first tip a newcomer meets on the section.

5. **`src/ui/tips.ts:126`, the Filter Envelope's tooltip:** "An Attack–Decay–Sustain–Release shape, like the Amp's, that moves the Cutoff instead of the loudness. Envelope Amount sets how far." Since issue 93 it also moves Osc 2's pitch, by Osc 2's own Env Amount (`osc2Cents`, `src/modulation/modulationModel.ts:153`; the glossary's "Env Amount (Osc 2)"). Its faders now stay lit when only that Amount is set (`src/ui/App.tsx:584`), and nothing in the tip says why.

6. **`src/styles.css:953-955` and `:961`, the header breakpoint comments:** "below 1300 px its buttons show their icons and drop their words … keys of 30 px or more down to 1000 px" and "With their words (1300 px up)". The words now drop only from 861 to 1099 px (`@media (min-width: 861px) and (max-width: 1099px)` at `:970`; `e2e/about.spec.ts` checks "the word About from 1100 px up"). The comment at `:90-92` also contradicts itself: "Laptop and wide windows: one row in the header's one order … in two rows up to 1919 px".

7. **The issues' "Since then" notes still describe the issue 82 header.**
   - `docs/issues/44-header-across-layouts.md:40`: "in three across (861 to 1919 px) the logo sits over the Patch picker and Song under Demo and Tutorial … the order left to right is otherwise the same".
   - `:35`: "below 1300 px the header's buttons drop their words".
   - `docs/issues/15-ui-polish.md:48`: "in three across it sits over the Patch picker rather than on the header's line".
   - All three are now untrue (see 3 and 6). The Patch picker is beside the name at every width (`e2e/brand.spec.ts`), and Demo, Tutorial and Song come after About from 861 px up.

8. **`docs/screenshot.png`, the README's first image (last retaken 2026-10-26),** shows three Oscillator tabs (OSC 1, OSC 2, MIXER), Demo and Song left of the piano, and no Tutorial button. Now there are four tabs (Osc 1, Osc 2, Sub & Noise, Mixer; `e2e/oscTabs.spec.ts:3`), and Demo, Tutorial and Song sit right of the keyboard. It is the repository's front page.

9. **`src/ui/tips.ts:190`, the Noise fader's tooltip:** "An unpitched hiss with energy at every frequency: in the Spectrum it fills the gaps between Harmonics." It is shown whatever the Noise colour (`PARAM_TIPS.mixNoise`). Pink Noise (issue 92) is "a softer rush", falling 3 dB an octave, by the Noise colour tip itself (`:213`). The fader's tip describes white alone.

10. **`docs/design-principles.md:20`:** "(Osc 2's tuning while Osc 2 is silent, the Filter Envelope at Amount 0) greys out". Osc 2's tuning now stays awake while Osc 2 is heard through Ring or through FM on a heard Osc 1, even with its fader at 0 (`osc2Heard`, `src/patch/patch.ts`; `e2e/voices.spec.ts:61`). The Filter Envelope's faders stay lit at Amount 0 while Osc 2's Env Amount is set (`src/ui/App.tsx:584`).

11. **The Demo card's "dots" are now segments that fill.** `src/ui/DemoBar.tsx:14` says "(a dot)". `src/ui/hooks/usePlayers.ts:96` says "a dot on its card". `src/demo/player.ts:59` says "card's dots". `src/styles.css:1330` says "a dot per part", and `:1332-1333` says "the dots after it … each dot's part". `e2e/demo.spec.ts:272` is named "a dot on the Demo's card plays on from its part", and `:300` says "The name never runs under the dots". Since `a82f4b4` each part is a `.demo-bar-segment`, as wide as the part is long, the one playing filling (`DemoBar.tsx:44-60`, `e2e/demo.spec.ts:307`).

12. **The Timeline's removed setting lines left two traces.**
    - `src/viewers/timeline.ts:180-181` reads "in its stage's colour: the where it is now in its pattern". This is a half-deleted "the knob's setting faint, where it is now in its pattern".
    - `docs/issues/63-showing-combined-modulation.md:45` (decision 24: "with the knob's setting faint and dashed") and `:58` ("the knob's setting on the Timeline is faint and solid") still say the setting is drawn. Issue 71 got a "Since then" line (`:9`) for the removal; issue 63 did not.
    - Now: "The knob's own setting is not drawn" (`timeline.ts:170`), and `e2e/envelopes.spec.ts:113` checks that no faint stroke is drawn.

13. **`CONTEXT.md:74`, the Mixer:** "(Osc 1, Osc 2, Ring, Sub, Noise)". The Mixer's faders and the Quick Setup's Mixer step run Osc 1, Osc 2, Ring, Noise, Sub (`src/ui/App.tsx:546-550`, `src/midi/quickSetup.ts`). The list order differs from the page.

14. **`src/engine/synthEngine.ts:580`:** "Every Oscillator follows the Note: Osc 2's offsets ride on top, through its detune; the Sub an octave down." This leaves out Osc 1's Octave, which also rides on the detune and moves the Sub. It also leaves out that the Sub can sit two octaves down, which its own comment states elsewhere ("It runs an octave down; its detune takes it the second").

15. **`src/styles.css:413`:** "The Oscillators stage: Osc 1, Osc 2 and the Mixer stacked". The stage is now four tabs, one shown at a time.

16. **`src/ui/tips.ts:177-178`, the Osc 2 tab's tip:** "shifted by whole Octaves and Semitones and fine-tuned by Detune … Raise Osc 2 in the Mixer to hear it." Its tuning row now has Env Amount too (`App.tsx:467`). Ring and FM also use Osc 2 with its fader at 0, which the Tuning tip (`:61`) and the Osc 2 fader's tip (`:262`) already say.

17. **`docs/adr/0006-shared-scope-scale-with-nominal-level.md:14`:** "Several sources at full level (Osc 1 + Osc 2 + Sub + Noise)". Ring is a fifth source that can add to the peak. The ADR is frozen, so this is for a superseding note at most.

18. **`docs/issues/36-demo-track.md:7`:** "Status: done; lengthened to about two minutes by issue 60". The Demo is now about three minutes, 15 parts (`src/demo/track.test.ts:20`, 165–180 s). Low: a done issue, but its Status line states the current length.

19. **`src/patch/presets.test.ts:28-30`:** "Every LFO destination" over a hand-written list that has FM but not Volume. The list was updated for FM in this change and is still one short of `LFO_DESTINATIONS`, the one list it could read instead.

Seen in passing, not caused by this change:
- `docs/inbox.md:23` proposes "Another Filter mode: a notch or a peak". Notch already exists (`CHOICES.filterMode` includes `'notch'`, `src/patch/patch.ts:207`).
- The Quick Setup tip (`src/ui/tips.ts:43`) says "in the page's order from the Oscillators to the LFOs", but `QUICK_SETUP` starts with the Filter.

## Three for the inbox

- The LFO Destination tooltip (`src/ui/tips.ts:149`) lists seven Destinations and leaves out FM, the eighth since issue 97.
- On phones and in 2 × 2 the header's DOM order (set-up, then Demo, Tutorial, Song) no longer matches the screen (Demo, Tutorial, Song left of set-up). Focus order no longer follows the screen, while `App.tsx:227`, the `e2e/header.spec.ts` test name and issue 44 still claim "one order".
- Issue 82 is still open "for the owner to judge the look once live", describing the logo stacked over the Patch picker, which the Patch-beside-the-logo header has replaced.
