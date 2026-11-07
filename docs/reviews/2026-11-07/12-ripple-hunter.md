# Review 12: the ripple hunter

Read: the whole project at 1.26.2 (HEAD `e25de1a`), not one release's diff: the owner asked for every claim the code has made untrue, wherever it was written. First the two past reports, `CONTEXT.md` and issue 42's "12 to 14"; then, each claim checked against the current code: the tips (`src/ui/tips.ts`) and the words in the other components (Display's button, the MIDI panel, the Patch bar, the Tutorial menu and card, the Tour's card, the Learn bar), About and its welcome, the Tour's six cards, the nine Tutorials' Steps, the Demo's captions and the Preset descriptions' claims about the page (their sound claims are review 13's); the README, CONTRIBUTING.md, SECURITY.md, the PRD, `CONTEXT.md`, the design principles, `docs/bead.md`, `docs/releasing.md` and `docs/agents/`; the 22 ADRs; the 27 open issues' Status lines and the Agent Briefs of 251 to 263, against 1.26.2 (since 1.26.1 only the engine changed, so the briefs' page findings were not re-measured, only their figures and their code claims); the code comments of `src/` and the names, comments and messages of the e2e and unit tests, in three delegated sweeps (engine and logic; the UI and `styles.css`; the tests) whose findings were sampled against the code before going in. Left out: what issues 251 to 263 already hold. Read only: no Playwright, nothing measured in a browser.

## Findings

1. **Display's own tip leaves out half the panel.** `src/ui/DisplayMenu.tsx:20`: "How the Viewers show the sound: Freeze, Snapshot, which Voices the Viewers follow, the Glow, the axes, Scope cycles, the Env Timeline’s length, and which overlays are drawn." The panel also holds Keys, Tips, Bead and Theme (`src/ui/App.tsx:388-458`), and the README ("Switch it off in Display"), Bead's tip and About's Bead card send people there for Bead. The same short list is in `src/styles.css:268-269` ("one panel, three captioned groups (View, Axes, Show)" and "sits in the header line when there is room", when it is a panel behind a button), `e2e/viewerControls.spec.ts:78` ("controls are grouped under View, Axes and Show"), `e2e/tooltips.spec.ts:98` ("every toolbar control explains itself", over a list without Geek, the View group, Keys, Tips, Bead and Theme) and the `openDisplay` docstring in `e2e/helpers.ts:3`. True: the tip ends "…and the page's own settings: the letter keys, the tips, Bead and the theme"; the names say the seven groups, or the test hovers them all.

2. **The Synth Geek Layer's tip on dB.** `src/ui/tips.ts:594`: "the Mixer’s levels and the Amp’s Sustain in dB". The Volume reads dB too, and Ring, a Mixer level, stays in % on purpose (`GAINS`, `src/music/geek.ts:178`; `src/patch/patch.ts:234`). The comment over `GAINS` (`geek.ts:177`) says the same, and `src/music/geek.test.ts:39` is named "Q on Resonance and dB on the Mixer and the Amp’s Sustain, nothing elsewhere" while the layer also reads Osc 2's tuning, both LFOs' Depth and Key Track (`GEEK_CONTROLS`, `geek.ts:270-283`) and its body checks only the Cutoff. True: "the Mixer's levels (Ring's aside), the Sustain and the Volume in dB".

3. **"The LFO", where there are two, and the Timeline's lines without aftertouch's.**
   - `src/ui/tips.ts:176`, the LFO & Envelopes tip: "What changes the sound over time: the LFO, and the Envelope Timeline beside it."
   - `README.md:23`: "The Envelope Timeline draws both Envelopes, the LFO and the Effective Cutoff".
   - `src/ui/EnvelopeTimeline.tsx:15`: "under the signal chain: the LFO beside the Envelope Timeline" (from 1920 px the section is a fourth column beside the stages).
   - `src/engine/synthEngine.ts:1116`: "with one LFO shared" (`lfos: [lfoNodes(), lfoNodes()]`, `:1219`); `:648` "the noise loop" (two, white and pink).
   - `src/styles.css:849`: "as tall as the LFO and Glide controls" (Glide is in the Amp since issue 86).
   - Aftertouch: once a keyboard sends pressure, its Destination gets a line and a key entry (`timelineShows`, `src/viewers/timeline.ts:31-32`; short dashes when aftertouch alone moves it, `:39`), but the Timeline tips (`tips.ts:176`, `:422`), `CONTEXT.md:270` ("Its key lists what LFO 1 moves, what LFO 2 moves, the Cutoff…") and `timelineKey`'s comment (`timeline.ts:61-64`, "With no Filter Envelope and no LFO, the Amp Envelope alone") name only the Envelopes and the LFOs.
   - True: "the two LFOs"; and "what aftertouch moves" beside what the LFOs move.

4. **The engine's opening comment contradicts ADR-0022.** `src/engine/synthEngine.ts:1116-1117`: "The Taps, the Modulation model and Cycle Lock follow the Voice of the newest Note, so the Viewers always show one Note as if it were played alone (ADR-0007)." The Amp Tap carries every Voice by default (`tapSource: 'all'`, `src/viewers/viewerState.ts:27`; ADR-0022; the Viewers follow tip). True: "the Oscillator and Filter Taps, the model and Cycle Lock follow the newest Note; the Amp Tap carries every Voice unless asked otherwise (ADR-0007, ADR-0022)".

5. **The PRD's "In v1, still to do".** `docs/prd.md:158`: "issues 112 (with 136 and 137), 119 and 132; the Synth Geek Layer complete (133), History in the tooltips (134) and a Patch in plain words (123); the polish of 116, 129, 130, 47, 42, 48 and 111". 112, 136, 137, 119, 132, 133, 134, 123, 116, 129 and 130 are all done (2026-11-02 to 11-04); what is left is 47, 42, 48, 111 and 173 for the owner, and 251 to 261 and 263 from the 1.26.1 round (issue 131's checklist). True: the line names what 131 still lists, or points to 131 rather than restating it. Also in the PRD, the module interfaces name functions that do not exist: `:179` "`toJSON` / `fromJSON`, `toURL` / `fromURL`" (they are `patchToJSON`, `patchFromJSON`, `patchToShare`, `patchFromShare`, `src/patch/serialize.ts`) and `:184` "`start()`, … `noteOff()`" (the engine has no `start()`; `noteOff(at?)` releases every Voice, `release(note, at?)` one).

6. **Issue 42's Status line, and the README's count of reviewers.** `docs/issues/42-reviews.md:7`: "Left: … and profile 16's first run once the Tour is released. The ten persona reviews ran on 2026-10-26". Profile 16 first ran on 2026-10-31 (its box at `:237`, and again on 11-02 and 11-07), and there are twenty profiles, every one run. `README.md:70`: "agents playing a dozen kinds of visitor". True: 42's Status left with the LinkedIn tap-through alone; the README "twenty reviewers, seventeen kinds of visitor and Claude's own three".

7. **Three of today's briefs quote figures 1.26.2 no longer shows.** Their asks stand; their numbers do not:
   - Issue 259, item 5: "The README’s “112.3 % of a processor core”". The README now says 107.8 % (`README.md:78`, 1.26.2's row); 112.3 % was 1.26.0's.
   - Issue 257, item 4: "one sample after the suite, 112 % of a core". 1.26.1's row is 103.2 %, 1.26.2's 107.8 % (`docs/statistics.md:288-289`).
   - Issue 261, item 2: "68 of 201 done issues still have unticked boxes". It is 67 of 224 at 1.26.2 (224 done, as the statistics also count).
   - True: "the README's CPU figure (107.8 % at 1.26.2)"; "one sample, swinging 103 to 112 % from release to release"; "67 of 224".

8. **CONTRIBUTING.md:31:** "Every push to `main` runs all of these before it deploys." The table above it holds `npm run dev`, `npm run stats` and `npm run perf`; the workflow runs the types, the lint, the unit, engine and end-to-end tests and the build (`.github/workflows/deploy.yml`), never the statistics or the frame costs. True: "Every push to `main` runs the checks and the three test commands before it deploys."

9. **The design principles, on the layout and on the audit.**
   - `docs/design-principles.md:9`: "Modulation sits below them, because it acts on them." From 1920 px LFO & Envelopes is a fourth column beside the stages (`src/styles.css:504-512`, issue 43).
   - `:40`: "checked on every screen state by `e2e/designPrinciples.spec.ts`", and the spec's own header (`:7-8`), "the page with each Oscillator tab, and each panel open". Its `STATES` (`:111-230`) audit the Osc 1, Osc 2 and Mixer tabs but never the Sub & Noise tab, whose Segmented choices are then never contrast- or target-checked, nor a Tutorial's or the Tour's card.
   - True: "below them, or beside them on a wide screen"; and the Sub & Noise tab and the two cards added to the audit, or the line naming what it covers.

10. **"Init's Resonance" is 5 % in four places; Init's is 20 %** (`PARAMS.resonance.default`, `src/patch/patch.ts:250`). `src/engine/filterDesign.ts:59` and `:61` ("The Resonance the make-up starts to rise from: Init's", over `MAKE_UP_RISES_FROM = 0.05`), `:68-69` ("A fixed part brings Init near the low-pass; above Init's Resonance…"), `src/music/geek.ts:147`, and two test names: `src/engine/filterDesign.test.ts:127` ("up to Init's Resonance", over 0, 0.03 and 0.05) and `src/engine/synthEngine.browser.test.ts:1096` ("within 3 dB of Init's 5 %"). Issue 231's note 2 already says "Init's Resonance is 20 %, not 5 %", so the word was never true. True: "5 %".

11. **MIDI Learn: a Switch cut short, and Tap Tempo's pad.**
    - `src/midi/controlSurface.ts:486-488`: "A button cut short (a click on screen, Quick Setup's Skip) is not guessed: nothing is learned". The branch tests `learn.target.kind === 'action'` alone; a Switch also learns as a button (`learnsAsButton`, `src/midi/mappings.ts:70`), and one cut short goes through `finishListening()`, saved as a toggle (`controlSurface.ts:356-361`). The comments at `:359` and `:392` already say "an Action or a Switch". Either the comment or the test is wrong; more likely the test (`learnsAsButton(learn.target)`).
    - `e2e/midiLearn.spec.ts:345`: "each Action does its own job from its own pad: Next and Previous Preset, Freeze, Snapshot, Hold". There are six Actions, Tap Tempo the sixth (`src/midi/quickSetup.ts:33`). True: a Tap Tempo pad in the test.

12. **The Oscillators stage and the section rows, in `styles.css` and the components.**
    - `src/styles.css:527-529`: "one Oscillator at a time; the Mixer stays visible below" and "the tabs, then the Waveform picker with Pulse Width, then Osc 2's tuning, then the Mixer". The Mixer is the fourth tab (`App.tsx:703-727`), as `:444` says.
    - `:669-671`: "name in a 44 px column … too narrow for the Mixer's four knobs …, the Mixer's name goes above its row (the Tuning row's three knobs…)". The column is 68 px (`:676`), the Mixer is five faders, its name column is hidden when narrow (`:735-737`), and Tuning has four knobs.
    - `:672-673`: "(TUNING, MIXER, FILTER ENVELOPE, AMP ENVELOPE, VOICES; two lines when the name needs them)". The labels are WAVEFORM, PITCH, TUNING, SUB, NOISE, LEVELS, MODE, CUTOFF, ENVELOPE and VOICES, never on two lines (`white-space: nowrap`, `:682`).
    - "On the heading line" for rows that sit under the heading (`App.tsx:88-99`): `src/ui/App.tsx:77`, `src/ui/FilterShape.tsx:22`, `src/styles.css:1066`, and `e2e/voices.spec.ts:6` ("Voices is chosen on the Amp heading line", which the same file's `:34-39` contradicts).
    - `src/styles.css:542`: "A dot on a tab whose Oscillator is mixed in". Sub & Noise carries one too.
    - `src/ui/FilterShape.tsx:8`: "a 24×14 box". Its `viewBox` is 24 × 16.

13. **The piano, the strip, the header's marks and Bead, in comments.**
    - `src/styles.css:861-864`: "The piano is the computer keyboard's 17 keys (10 white)". The same is in `src/ui/Piano.tsx:20`, `src/ui/hooks/usePianoFit.ts:8` and `e2e/header.spec.ts:6-7`. On a phone it is one octave, C to C, 13 keys (`styles.css:1490-1493`, `e2e/piano.spec.ts:303`).
    - `src/ui/sections.ts:12`: the 860 px breakpoint is "where … the section strip sticks". The strip shows only to 600 px.
    - `src/ui/SectionStrip.tsx:47` and `styles.css:1567`: hidden "where every section is on screen at once". In 2 × 2 the page scrolls (`SectionStrip.tsx:179` says so).
    - `src/styles.css:313`: "Icons that stand in for a button's word where room is short (phones); the word shows everywhere else". Hold's icon shows at every width, and its word goes from 861 to 1279 px.
    - `:1155-1156`: the Patch panel "like the Display and MIDI panels". From 601 px the MIDI panel hangs from its own button (`:1326-1340`).
    - The MIDI button's "dot": `src/ui/MidiPanel.tsx:83`, `styles.css:1404` ("its dot pulsing") and `:1010` ("a hollow, struck-through dot"). It is a socket icon (`src/ui/icons.tsx:69-75`).
    - `src/ui/EnvelopeTimeline.tsx:51`: "The key sits on the title line". In one column it moves under the controls (`styles.css:853-858`).
    - `src/styles.css:1620`: "Folded, a card keeps only its top row". The Demo's keeps its name and segments.
    - `:1625`: "Both cards' text". Three cards share it, the Tour's the third.
    - `src/ui/Mascot.tsx:208`: "No focus, no pointer, nothing for a screen reader." Bead takes the pointer (tickled, poked, picked up: `:253-254`, `:551-565`; `pointer-events: visiblePainted`, `styles.css:917-918`).

14. **The engine's and the model's smaller comments.**
    - `src/engine/synthEngine.ts:662`: the tremolo's resting gain is "1 less the LFOs' total swing on Volume". Since issue 62 it is the Volume less the swing (`:1573`).
    - `:606-611`: the `LfoNodes` doc names Pulse Width alone as going through each Voice's gains, but FM does too (`:706`, `:871`). Its Resonance "into the shared curve to each Filter stage's Q" has been each Filter side's curve and make-up since 248 (`:1164-1167`).
    - `src/modulation/passBand.ts:4-5`: "what the Envelope Timeline shades". Nothing outside the tests calls `passBand` since the shading went (`4d20e7f`). Drop the claim, or the function.
    - `src/modulation/reach.ts:57`: the knobs an LFO swings evenly, "(Osc 2 Pitch's Semitone, Detune, Pulse Width, Resonance)". FM's ring comes from the same `evenReach` (`src/ui/modulationRing.tsx:62`).
    - `src/viewers/readoutBox.ts:18-22`: "“23.99 kHz” at the top of the Spectrum" and "up to the 872nd, 24 kHz over 27.5 Hz". The Spectrum stops at 20 kHz (`axes.ts:5-7`), and Harmonics are numbered down to about 21.5 Hz, so the highest is about the 930th. The shapes still hold.

15. **Comments on the Presets, the Tutorials and the Demo.**
    - `src/tutorial/tutorials.ts:13-15`: "Sub Ladder …, then the four first Tutorials (issue 58), then the lessons of issue 109". PWM Bass (issue 234) sits between Wobble and FM Ladder.
    - `src/demo/track.ts:69`: "Every part after the first plays over Am–F–C–G, a bar each". Acid is an A pedal and Self-Oscillation one A2; Sweep Pad and Cathedral take two bars a chord.
    - `src/patch/presets.ts:159`: "The LFO aimed at each destination". No Preset in that group aims at Pulse Width or Volume; those are in Shapes and the sound groups.
    - `src/patch/presets.ts:633`: "What plays when the page opens" sits over `SHARED_NAME`, not over `initialPatch`, which it describes.

16. **Header and window tests that measure a header that changed.**
    - `e2e/header.spec.ts:179-181`: "the keyboard meets Hold 12 px away", checked `≤ 12` (and at `:193`). Since issue 188 it is 8 px at every width (`styles.css:1218`, asserted in the same file at `:118`), so a 4 px drift passes. True: 8 px, within 1.
    - `e2e/fitsScreen.spec.ts:5-6`: "the smaller 1440×900, where the toolbar wraps under the title". No toolbar line remains: Display is a panel.
    - `e2e/piano.spec.ts:16`: "the piano sits at the bottom, below the fold". It is in the header.

17. **E2e test names that claim more than their bodies check.**
    - `e2e/tutorial.spec.ts:374`: "fifteen Steps, each made and checked twice", the reason for 90 s. The loop runs PWM Bass, 19 Steps (`tutorials.ts:418-532`).
    - `e2e/voices.spec.ts:61`: "greyed out until Osc 2 is heard: mixed in, through Ring or by FM". The body tries FM alone.
    - `e2e/modulationRing.spec.ts:58`: "…as with the LFO or both". The body tests the Envelope alone.
    - `e2e/tooltips.spec.ts:127`: "every … fader". The Ring, Noise and Sub faders are skipped.
    - `e2e/patches.spec.ts:337`: the comment `// Bass` after Next Preset. From Init it is Pure Sine (`:23`).
    - `:377`, "every factory name shows in full": 22 of the 142 Presets.
    - `e2e/tour.spec.ts:296`, "each card's two lines": four cards of six.
    - `e2e/tour.spec.ts:427`, "from 2 × 2 up": one size, 860 × 1100.
    - `e2e/displayPanel.spec.ts:98`, "every Display setting is remembered": the Show toggles, Keys, Tips, Bead and Theme are not set there.
    - True for each: the test widened, or its name narrowed.

18. **Unit test names.**
    - `src/viewers/overlays.test.ts:5` and `:9` name four overlays; the bodies expect the Synth Geek Layer's `geek` too.
    - `src/patch/patch.test.ts:13`, "gives the Voice an Oscillator, a Filter and an Amp Envelope". It checks the whole Parameter list.
    - `src/test/edgePatches.test.ts:52`, "has thousands of Patches". There are 1,000 (`SWEEP_SIZE`).
    - `src/music/idealReference.test.ts:63`, "Osc 2 under both". It asserts Osc 2 on the Sub's pitch.
    - `src/ui/mascotTricks.test.ts:38`, "…and ends back as it was". The last pose is never checked.
    - `src/shows/shows.test.ts:381`, "starts the next Tutorial from its last card, giving back what the first changed". It neither reaches the last card nor checks what is given back.
    - `src/ui/mascotGestures.test.ts:19`, "splashes with Volume up". It raises `mixOsc2`.
    - `src/engine/synthEngine.browser.test.ts:215`, "…only Resonance can push the Filter Tap past it (OVER)". The OVER label went (ADR-0006), and the body checks the no-Resonance half.
    - Medium confidence: `src/patch/presets.test.ts:117`'s comment says "the teaching Presets stay on one Voice", but Breathing Bell, a lesson, plays on 4 (`presets.ts:188`). `src/ui/beadFrame.test.ts:172` names "Part 5, Tremolo Keys … Part 3, Poly Pluck" over a `demoPart` that counts from 0, which makes them Self-Oscillation and Strings.

19. **The ADRs.** None needs a superseding ADR: the rule each records still holds, and only a list or a figure in it has moved.
    - ADR-0008's lists (`docs/adr/0008-…:7`) leave out the Volume, a play Parameter on the big knob since issue 62, and FM and Osc 2's Env Amount on the small one. A Status-line note at most.
    - ADR-0015 says "eight shards"; the deploy run has twelve since issue 232 (four Chromium, eight WebKit). No Status change is due: the decision is the gate, not the count.
    - ADR-0007's "the LFO, master level and safety stage are shared", and ADR-0006's "Osc 1 + Osc 2 + Sub + Noise" (Ring), are history of their day.
    - ADR-0020's and 0021's "open to the owner" is issue 261's.

## Checked and still true

- **The tips:** every LFO Destination line (FM's included); the Quick Setup's order, against `QUICK_SETUP`; the Demo's fifteen parts in order; the Song; Hold's rhythm; the Rate's range (0.05 to 20 Hz); the note values; the four Filter Modes and two Slopes; the Sub's and the Noise's choices; Velocity's grey ring and the Filter Envelope's white one; the Ideal's four marks; Glide and Legato with one Voice; the letter keys; Bead's B, E, A, D; the Tempo's and Tap Tempo's (the last four taps).
- **The visitor's other words:** About's welcome and buttons, Bead's card (its "with the mouse" is issue 260's), the Patch bar's, the MIDI panel's notices, the Tutorial menu's and card's, the Tour card's.
- **The Tour and the Tutorials:** the six cards and their moves against `TOUR` and `TOUR_FINDS`; every Step's control, target and Display option, the Ideal and Snapshot Steps against the overlays the Tutorial turns off and gives back; the Wobble's Sync and 1/4 T at 120 BPM; PWM Bass's 19 Steps. The README's list of the nine Tutorials is in their order.
- **The Demo's captions** against their Presets' settings, on what the page shows (Cathedral's three octaves, the piano's blue dot, the blue ring of Double Wobble).
- **CONTEXT.md:**
  - Voices, the Sub, Ring, FM, the Mixer's order and the Filter Modes;
  - Retrigger, Sync, Legato, the Tempo and Tap Tempo;
  - Hold, the Demo, the Welcome, the Tutorial, the Tour (opened from the Welcome and About only), the Song and the Show;
  - Cycle Lock's 1, 2 or 4 cycles and Glow;
  - the C16 layout (M1–M4 and S3, against `c16.ts`), the Action list and Quick Setup.
- **The README's** commands and the CI it names.
- **SECURITY.md** (its "anonymous visit count" is issue 259's).
- **`docs/releasing.md`** and its steps against the workflow and the statistics script.
- **`docs/agents/`:** the triage states, the queries, `.out-of-scope/`.
- **`docs/bead.md`** on where Bead lives and its card.
- **The ADRs:**
  - the master level of 0.45 over √Voices (0001, 0006);
  - the pulse as a saw minus a delayed copy (0001);
  - the Response Curve's twin biquads (0003);
  - the knob sizes 68/52, 60/52 and 52/40 px (0008);
  - the C16's shared buttons (0017);
  - the tempo's range and default (0018);
  - each Status line naming what amends it.
- **The briefs of 251 to 263** against 1.26.2:
  - 251's eight items are all still in the engine after 1.26.2's fix;
  - 256's formula is `detuneBeatsHz` as written;
  - 259's eight night merges without a Co-Authored-By line are still eight;
  - 260's Tour ending and Bead card are as they say;
  - the page findings of 252 to 255 and 258 sit in code 1.26.2 did not touch.

## Seen in passing, not stale words

- **A learned pitch-bend Mapping is dropped on reload.** MIDI Learn stores the bend wheel as CC 128 (`PITCH_BEND`, `src/midi/mappings.ts:27`; `controlSurface.ts:451`), and the stored list is filtered through `isMapping`, which accepts `byte(c.number, 0, 127)` only (`mappings.ts:127`, `:147`). Issue 52's "map it like a knob" lasts one visit. Found by reading, not run.
- Another session's files sit in the checkout, untouched here: `src/engine/zzReview14All.browser.test.ts`, `src/engine/zzReview14Peaks.browser.test.ts`, `docs/reviews/2026-11-07/13-fact-checker.md`, and a staged inbox line.

## For the inbox

- Display's tip lists only the Viewers' settings, though the panel also holds Keys, Tips, Bead and Theme, where the README and Bead's tip send people; a test name, a CSS comment and a helper say the same three groups (review 12).
- The Synth Geek Layer's tip says the Mixer's levels and the Sustain read in dB: the Volume does too, Ring does not, and the layer's unit test is named for less than the layer reads (review 12).
- The LFO & Envelopes tip, the README and two code comments still say "the LFO" where there are two, and the Timeline's tips and CONTEXT.md leave out the line aftertouch draws (review 12).
- The engine's opening comment says every Tap follows the newest Note, against ADR-0022 and the Amp Tap's default of every Voice (review 12).
- The PRD's "In v1, still to do" names issues done since 2026-11-02 and none of 251 to 263, and its module interfaces name functions that no longer exist (review 12).
- Issue 42's Status still waits for profile 16's first run (done 2026-10-31) and counts ten profiles, and the README "a dozen" reviewers, where there are twenty (review 12).
- Issues 257, 259 and 261 quote figures 1.26.2 does not show: the README's CPU is now 107.8 %, not 112.3 %, and 67 of 224 done issues have unticked boxes, not 68 of 201 (review 12).
- CONTRIBUTING says every push to main runs all its commands, but GitHub runs neither the statistics nor the frame costs (review 12).
- The design principles put Modulation below the stages, beside them from 1920 px, and say every screen state is audited, while the audit skips the Sub & Noise tab and the Tour's and Tutorials' cards (review 12).
- "Init's Resonance" is 5 % in the band-pass make-up's code, its comments and two test names, where Init's is 20 % (review 12).
- A Switch learned from a button cut short is kept as a toggle, against its comment that nothing is learned, and the MIDI Learn test of every Action's pad leaves out Tap Tempo (review 12).
- About 50 code comments and test names state an old layout or count (the Mixer under the tabs, a 44 px label column, rows "on the heading line", 17 keys on phones, 12 px to Hold, fifteen Steps, the MIDI "dot", Bead taking no pointer): one sweep to put them right (review 12).
- A learned pitch-bend Mapping is dropped on reload: stored as CC 128, it fails the stored Mappings' 0 to 127 check (review 12).
