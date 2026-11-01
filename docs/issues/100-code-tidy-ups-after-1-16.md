# 100: Code tidy-ups after 1.16

**What to build:** The 1.16.0 review's code findings (the inbox, 2026-10-30), nothing visible changed, as [70](./70-code-tidy-ups-after-1-14.md) did after 1.14.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-10-30) on night/2026-10-30, for the owner to try

## Agent Brief

**Category:** enhancement
**Summary:** Close the gaps the review found in the Oscillator work's code, behaviour unchanged.

**Current behavior and what to change:**
- **Model against sound (ADR-0003):** no test compares the engine with the Modulation model for an LFO on FM or for the Filter Envelope on Osc 2's pitch; add one each, as the other Destinations have.
- **One place for Osc 2's tuning:** Osc 2's cents are worked out in three places (the Modulation model, the engine, the Ideal), and the model's Envelope term is reached only by its test. One answer, which the others call.
- **FM's name:** the glossary says FM and to avoid Cross Mod; the code says `crossMod`, `cross`, `crossDepth`, `tuneCross`. Rename what is internal; the Patch field stays as it is, since saved Patches and Share links carry it (say so beside it).
- **FM's index** belongs beside FM's Parameter, not in the Ideal's module.
- **The Ideal:** its description still says Osc 1 and the Sub only; Ring's and FM's partials share one shape (whole-octave cycles, else a power map) written twice; the Spectrum lists the Ideal's sources and picks each mark's shape by hand rather than from one list.
- **Written twice:** the knob's and the fader's release handling; the Demo bar's fill and its segments' fill in the styles.
- **Names:** each Oscillator's pitch over the Note is `ratios`; a style selects on an accessible name.

**Acceptance criteria:**
- [x] The two new model-against-sound tests pass
- [x] Osc 2's tuning has one source; the others call it
- [x] No internal name says Cross Mod; the Patch field's name is explained where it is defined
- [x] Every existing test passes, unchanged in what it checks

**Out of scope:**
- Any change to how anything sounds or looks
- Renaming the Patch field (it would break saved Patches and Share links)

## Added in triage (2026-10-30)

From the fourteen reviews of 1.16.0 (review 8, [report](../reviews/2026-10-30/8-oss-sceptic.md)), in the same spirit, behaviour unchanged:

- **Refs kept in step by hand:** the hooks split from the App still assign 12 refs during render and carry 7 lint waivers on effect dependencies, four with the same "rebuilt each render, the same each time" claim the coding standards say went wrong in issue 77. Use React 19's effect events where they fit, and drop the waivers they make unneeded.
- **Hooks without tests:** the MIDI and players hooks get unit tests of their own.
- **A guard no test holds:** removing the legato fix's one-Voice condition (issue 94) leaves every engine test green; add a test that fails without it.

Acceptance, added:
- [x] No ref is assigned during render where an effect event can do its work, and each remaining lint waiver says why
- [x] The MIDI and players hooks have unit tests
- [x] An engine test fails if the legato fix applies with several Voices

## Added in triage (2026-10-30, the 1.16.1 code review)

From the release review's standards axis, judgement calls, behaviour unchanged (Claude's call, open to the owner):

- **One place each:** the Patch's keyboard octave is left out by hand in three places (the choices, the sanitizer, the differences); the 860 px breakpoint is written in the styles and the App; the Demo card's keys are listed again in the stop rule.
- **Caches:** the Oscillators' waves, the LFO waves and the Ideal keep three caches with three eviction policies; one small cache shape for all three.
- **Names and shapes:** the wave cache's size named `CUT_WAVES`; the wheel hook taking three of a control's fields rather than the control; the step buttons choosing their glyph from their label's words; a Preset group's shared fields overriding each Preset's own, for one field; the Patch file format importing from the keyboard's layout; "No effect while the Sub is silent" written inline twice.

From the 1.17.0 release review (2026-10-30), its standards axis, behaviour unchanged (Claude's call, open to the owner):

- **One place each:** the right-column test (`rightmost - right < 4`) and the in-view test (`top - HEIGHT - HEADROOM >= 0`) each written twice in Bead's component; `WAVE_NAMES` in the Synth Geek Layer a third copy of the Waveforms' names (the picker's labels, the Tutorials').
- **Shapes:** `choosePerch` takes seven positional arguments (an options object, as the standards ask); Bead's component, over 800 lines, does its line, visits, throwing, surfing, leaving and drawing in one render loop (split by what changes together); it reaches into the LFO plot's private `PAD` and `SPAN` to find the plot's line (the plot could give "the line's y at x").
- **Names and types:** App's `mascot` (`'off' | 'up' | 'leaving'`) and `bead` (`'unmet' | 'on' | 'off'`), where `'off'` means two things (`beadPresence`, `beadSwitch`); the Bead switch's stored value cast unchecked from storage (a named type and a parse); the theme handler in Bead's component assigning `themeSwitched` above its declaration (safe, as it runs later, but reads like an error); the comment "The Tutorials, from the Patches panel…" now above the Preset about line's code.
- **Fragile:** a Preset's about line is found by comparing `JSON.stringify` of the Patch, which depends on key order (safe while `load` keeps the Preset's own object).

## How it was built

Nothing visible or audible changes; every existing test checks what it checked.

- **Model against sound (ADR-0003):** two engine tests. An LFO on FM, square, at each end of its swing: the sound has the sidebands the Ideal draws for the FM the model gives. The Filter Envelope on Osc 2's pitch, through a two-second Decay: Osc 2 sounds within 5 cents of `osc2Cents` at three moments. A third test fails without the legato rule's one-Voice condition (issue 94): on 2 Voices a held Voice taken by a new Note, or its key struck again, dips and restarts; on 1 Voice the same Note is legato. Each was checked by breaking the engine and seeing it fail.
- **Osc 2's tuning:** one answer, `osc2Cents` in the Modulation model; the engine and the Ideal's `osc2Ratio` call it. Each Oscillator's pitch over the Note is `pitchOverNote`.
- **FM's names:** the engine's `fm`, `fmLfos`, `fmDepth`, `tuneFm`; tests say FM. `FM_INDEX` lives beside FM's Parameter. The Patch field `crossMod` keeps its name, explained at `ParamId`.
- **The Ideal:** `idealReference`'s description says what it holds; Ring's and FM's partials share `inOctaves`, `cyclePartials` and `powerSum`; the Spectrum's marks come from one list, `IDEAL_MARKS`.
- **Written once:** the knob's and fader's press (`usePress`); the Demo bar's fills; the keyboard octave left out of the sound (`soundFields`, `sameSound`, `samePatch`, `isKeyboardOctave` beside the Patch, so the file format no longer imports the keyboard's layout); the stacked breakpoint (`STACKED`, read by the App and the Bead, a test checking the stylesheet has it); the arrow keys (`ARROW_STEPS`, for the radio groups, the Demo card and its stop rule); the Waveforms' names (`WAVEFORM_NAMES`); "No effect while the Sub is silent"; the Bead's room-above and right-column tests; the LFO plot's line, which the Bead now asks of the plot (`lineAt`).
- **One cache shape** (`createCache`, the most recently asked for kept) for the Oscillators' waves (`KEPT_WAVES`, was `CUT_WAVES`), the LFOs' waves, the Harmonic series and the Ideal's.
- **Effect events:** React's `useEffectEvent` replaces the refs kept with each render wherever an effect, or a listener or loop an effect starts, reads the latest props: the Patch panel, the tooltip, the Destination menu and the section strip (their four "rebuilt each render" waivers gone), the Song ending on a Note (its waiver gone), the Demo's stop rule, the Tour, a Controller's Note, the C16 layout, Quick Setup's Escape, the calling phrase, the Hold rhythm, the rings and the Bead. The refs left say why: the MIDI control surface calls back between renders outside any effect, the octave moves between renders, the wheel's listener comes from a ref callback. The remaining waivers name their trigger.
- **The hooks' tests:** `useMidi` and `usePlayers` are rendered in the browser test project (`renderHook` and `testSession` in `src/test`), through a fake Controller and a session that writes down what it plays.
- **Names and shapes:** `choosePerch` and `lineAt` take options objects; the step buttons take their step; the App names the Bead's presence (away, up, leaving) apart from its switch; Patches are compared field by field, not by `JSON.stringify`; a Preset group's shared fields no longer override a Preset's own; the stale Tutorials comment moved back.

Calls (Claude's call, open to the owner):

1. **The Bead's component is not split.** Its render loop still does its line, visits, throwing, surfing, leaving and drawing in one place. The split is large, and done without the owner watching the Bead it risks changing how it moves; it deserves its own issue.
2. `idealReference()` is kept although only the engine's tests read it: it is the reference they hold the sound to, Harmonic by Harmonic.
3. The 860 px breakpoint is one constant in the code, but the stylesheet cannot read a constant, so it still writes 860 px itself; a unit test checks the two agree.
4. Every Note from a Controller, a mapped pad's too, still tells the page a Note came (so a pad mapped to Hold stops the Demo); the new hook test pins that as it is.
5. The caches now let go of the one asked for longest ago instead of clearing at their limit, and the LFOs' waves are capped at 32 (they were unbounded). Nothing compares cached objects, so nothing heard or drawn changes.

Tests: `npx tsc`, `npm run lint` and `npx vitest run` (1,149) green; the whole Playwright suite in Chromium and WebKit green but for the Tour's "closed at card N" cases, which fail on main too, and the Bead's throw, which fails now and then under load on main as well.

What to try in the app: nothing should look or sound different. Worth a pass: the Demo (and touching a knob, then the piano, while it plays), the Song, a Tutorial's Listen, the Tour, MIDI (a keyboard's Notes, pedal and mod wheel; a C16's layout), the knobs and faders (drag, click, wheel), the Patch panel and a tooltip's Escape, and the Bead (call it with B, E, A, D; throw it; watch it surf an LFO during the Demo).
