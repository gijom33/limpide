# 107: Words that 1.16 made untrue

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 1, 5 and 12, [curious contact](../reviews/2026-10-30/1-curious-contact.md), [learner](../reviews/2026-10-30/5-learner-teacher.md), [ripple hunter](../reviews/2026-10-30/12-ripple-hunter.md)):

- 19 places still state what 1.16.0 changed, listed one by one in review 12's report: tips (the LFO Destination's seven Destinations without FM, the Oscillators section, the Filter Envelope, the Noise fader, the Osc 2 tab), the styles' header comments, issues 15, 36, 44 and 63, the design principles' greyed-out examples, the Demo's "dots" now segments, a half-deleted Timeline comment, a Preset test's hand-written Destination list, and issue 82 still open on a look since replaced.
- The FM tip: on Init, FM barely changes the Spectrum (its sidebands land on the Harmonics), and the way out (Sine on both) is deep in a 120-word tip.
- The Demo's captions turn to jargon after its first four parts (Tremolo Keys, Double Wobble, Split Octave Bass) for someone who knows no music.

**Blocked by:** none

**Status:** done (2026-10-30). The tips, comments, test names and issues review 12 named say what the app does today, the FM tip opens with Sine on both, and the Demo's captions from Tremolo Keys on speak everyday words first. Words only: nothing the app does changed.

## Agent Brief

**Category:** bug
**Summary:** Every tip, comment, test name and doc listed by the review says what the app does today, and the Demo's captions speak to someone who knows no music.

**Current behavior:** as listed above; review 12's report gives each place and what is now true.

**Desired behavior:**
- **Tips:** each one review 12 names states today's behaviour (eight LFO Destinations with FM; the Sub one or two octaves down and Ring a fifth Mixer source; the Filter Envelope also moving Osc 2's pitch by its Env Amount; the Noise fader for both colours; Osc 2's Env Amount).
- **The FM tip** leads with what to do to see FM clearly (Osc 1 and Osc 2 on Sine), in its first lines.
- **Comments and test names** say what the code and the tests do now; a test listing the LFO Destinations by hand reads the one list instead.
- **Done issues** get a "Since then" line where they state what is no longer true (15, 36, 44, 63); their Status lines are left as they are. Issue 82 closes with a "Since then" line saying the 2026-10-29 header replaced its look, and its owner check is no longer due.
- **The design principles' examples** of greyed-out controls match today's rule.
- **The Demo's captions**, from Tremolo Keys on: each in everyday words first (what you hear, where to look), the synth word after it if at all, as the Kick's and Acid's are.

**Acceptance criteria:**
- [x] Every item in review 12's findings is fixed or answered in this issue's notes
- [x] The LFO Destination tip names all eight Destinations, by reading the one list or by a test that fails when the list grows
- [x] Each changed tip and caption is checked against the engine (rendered or measured) before the push, as review 13 did
- [x] Every test passes, with renamed tests checking what they did

**Out of scope:**
- The README's screenshot and sections ([111](./111-the-repository-front-page-and-community-files.md))
- Preset descriptions ([108](./108-preset-claims-and-levels.md))
- Frozen ADRs: ADR-0006's source list is left, Ring being a fifth source noted only if an ADR supersedes it

## How it was built

Review 12's nineteen items, each checked against today's code first (issues 99 to 106, 108, 124 and 125 had landed since 1.16.0):

1. **The LFO Destination tip:** fixed. `src/ui/tips.ts` builds it from `LFO_DESTINATIONS` and a `Record<LfoDestination, string>` of words, so a ninth Destination fails `tsc` until it has words; FM's says it swings as far each way as the FM knob leaves room, none at 0. `src/ui/tips.test.ts` checks every label appears, in the picker's order (it failed on 1.16.0's tip, which had no FM).
2. **The header's "one order":** already fixed by [104](./104-keyboard-and-screen-readers-after-1-16.md): the DOM follows the screen at every width, `App.tsx`'s comment and `e2e/header.spec.ts` say so, and issue 44 has its Since then line.
3. **Issue 82:** closed, with a Since then line: the header of 2026-10-29 replaced its look before it shipped, so the owner's check is no longer due.
4. **The Oscillators tip:** fixed: Ring as a source, the Sub one or two octaves down.
5. **The Filter Envelope tip:** fixed: it bends Osc 2's pitch by Osc 2's Env Amount, and its faders stay lit while either Amount is set.
6. **The header's breakpoint comments** in `src/styles.css`: fixed (words dropped from 861 to 1099 px only; "one row in the header's one order" now "the header on one line").
7. **Issues 44 and 15's Since then notes:** each gets a later Since then line: the Patch picker beside the logo at every width, Demo, Tutorial and Song right of the keyboard, the words dropped only from 861 to 1099 px.
8. **The README's screenshot:** left to [111](./111-the-repository-front-page-and-community-files.md), out of scope here.
9. **The Noise fader's tip:** fixed: a hiss in White, a softer rush in Pink.
10. **The design principles' greyed-out examples:** fixed: Osc 2's tuning greys only when no fader, Ring or FM on a heard Osc 1 uses it; the Filter Envelope's faders while both Amounts are 0.
11. **The Demo's dots:** `DemoBar.tsx` and the styles were already fixed by [99](./99-demo-segments-as-targets.md); `src/demo/player.ts`, `src/ui/hooks/usePlayers.ts` and `e2e/demo.spec.ts` (the test name "a segment on the Demo's card plays on from its part", and its variables) now say segments.
12. **The Timeline's traces:** the half-deleted comment in `src/viewers/timeline.ts` fixed; issue 63 gets a Since then line (decision 24's faint setting is no longer drawn).
13. **CONTEXT.md's Mixer:** fixed to the page's order, Osc 1, Osc 2, Ring, Noise, Sub.
14. **The engine's comment on following the Note:** fixed: Osc 1's Octave, Osc 2's offsets and the Sub's second octave ride on the detunes.
15. **The Oscillators stage's style comment:** fixed: four tabs, one shown at a time.
16. **The Osc 2 tab's tip:** fixed: its Env Amount, and Ring and FM using Osc 2 at fader 0.
17. **ADR-0006's source list:** left, as the brief says: the ADR is frozen and nothing supersedes it.
18. **Issue 36's length:** a Since then line: about three minutes, 15 parts (its Status left as it is).
19. **The Preset test's hand-written list:** `src/patch/presets.test.ts` reads `LFO_DESTINATIONS`; Volume, the one it lacked, is used by four Presets, so it passes.

Seen in passing by review 12: the Quick Setup tip's "in the page's order" is fixed (the Filter's knobs come first), with the comment in `src/midi/quickSetup.ts` and the name of the test in `e2e/quickSetup.spec.ts`; the inbox's notch idea is no longer in the inbox.

**The FM tip** now opens with what to do: Osc 1 and Osc 2 on Sine, FM up, a ladder of partials from one spike; then why Init shows no new spikes. **The Demo's captions** from Tremolo Keys on say what you hear and where to look first, the synth word after, each no longer than the longest before (about 160 characters, so the card is no taller). Self-Oscillation's "No Oscillator at all" was untrue (the saw is mixed in), and Brass Section's last chord is held a bar rather than left to ring.

**Checked against the engine**, in a temporary engine test (deleted), at A3 unless said: on Init, FM at 0, 0.5 and 1 leaves everything between the Harmonics under −87 dB while their levels move by up to 12 dB; on two Sines FM 0.4 raises the 2nd to 5th Harmonics from under −120 dB to +3, −5, −15 and −29 dB; with Osc 2 a fifth up the partials at 2.5f sit at +2 dB, off the ladder. FM Bell at A4: its 2.56f and 4.56f partials −10 dB at FM 0.15, +8 dB at 0.5. Self-Oscillation on A2: the loudest frequency above 200 Hz is within 5 % of the Effective Cutoff from 330 Hz to 2.5 kHz, about 3 to 12 dB over the Note up to 1.3 kHz and 3.5 dB under it at 2.5 kHz (so "over a low buzz"; the caption commit's message rounds this too far). The other claims (rates, depths, octaves) were read from the parts' moves and Presets.

**Tests:** `npx tsc`, `npm run lint`, the whole Vitest suite (986 passed), and Playwright's `demo`, `quickSetup`, `lfo`, `tooltips` and `keyboardAccess` specs in Chromium and WebKit (113 passed, 1 skipped), then `demo` again in Chromium on the final captions (24 passed). The other specs were not run here; the release runs the full suite.

Claude's calls, open to the owner: the captions' wording; closing 82 as done (its goal, the piano centred from 1200 px, holds) rather than superseded.
