# 269: words and a level after 1.27.0

**What to build:** What 1.27.0's word checks found that the release did not fix (the inbox, 2026-11-08; reports [12](../reviews/2026-11-07/12-ripple-hunter-1.27.0.md), [13](../reviews/2026-11-07/13-fact-checker-1.27.0.md) and [14](../reviews/2026-11-07/14-ear-stand-in-1.27.0.md)). Polish for v1 ([131](./131-v1.md)).

1. **Fast Beats' "the beating is so fast it becomes roughness"** sits beside Detune's readout, 6.12 Hz beats on C4, where the formula calls it roughness past 20 a second; its upper Harmonics beat faster (fact-checker).
2. **Clang drops 6.4 dB from C4 down to C2,** over the 6 dB 258 holds the others to; a Key Track of about 0.5 untried (ear stand-in).
3. **CLAUDE.md's "Every commit" line** leaves out the issues' record check 261 added to the hook, nothing there says to run `npm run issues` after editing an issue, and its "Before a push" leaves out `npm run issues:check` (ripple hunter, finding 10).

**Blocked by:** none

**Status:** ready-for-human · bug. Items 1 and 2 built (2026-11-08) on night/2026-11-08 and merged into main on 2026-11-08, approved by the owner: "All good! Go for it."; ships with the next release. Left: item 3, waiting for the owner's yes. In v1 as polish; Claude's call, open to the owner (2026-11-08). Item 3 changes the owner's instructions to Claude.

## Agent Brief

**Category:** bug
**Summary:** Fast Beats' words worded to hold, Clang kept within 6 dB across the keyboard, and CLAUDE.md naming the issues' record check.

**Current behavior:** As the three items above say.

**Desired behavior:**
- Fast Beats' description true of what the engine plays, in the short-words rule of [156](./156-one-line-shorter-words.md), with a claim test as the Presets' others have.
- Clang within 6 dB from C2 to C6, octave by octave, its C4 and its character kept; added to 258's list of Presets so held.
- CLAUDE.md's Tests lines name the issues' record check and `npm run issues`, once the owner says yes.

**Key interfaces:**
- The factory Presets and their claim and level tests
- CLAUDE.md's Tests section

**Acceptance criteria:**
- [x] Fast Beats' claim test
- [x] Clang in 258's level test, within 6 dB from C2 to C6
- [ ] CLAUDE.md's lines, on the owner's yes (waits for the owner's yes)

**Out of scope:** Zap Pluck's words and level (267's check by ear); Vowel, within its bound.

## How it was built

Built on 2026-11-08, on night/2026-11-08: items 1 and 2. Item 3 is not built: CLAUDE.md is untouched, and its box waits for the owner's yes.

1. **Fast Beats' words** now read "Two saws 40 cents apart: their upper Harmonics beat so fast they blur into roughness. Compare with Slow Beats." Rendered on C4, its 1st Harmonic beats 6.1 times a second (Detune's readout: 6.12), its 4th 24.5 and its 6th 36.7, past the 20 a second where Detune's formula says beats blur into roughness. A claim test holds the words and the render (`src/patch/presets.browser.test.ts`, issue 269's block).
2. **Clang's high-pass follows the Note** at Key Track 0.5, as review 14 suggested (Cowbell has 0.6). Its levels on C2, C3, C4, C5, C6 and C7: −23.1, −22.0, −20.2, −20.5, −21.5 and −22.4 dBFS, within 2.9 dB from C2 to C6, where they were −26.6, −23.7, −20.2, −21.2, −21.2 and −19.8 (6.4 dB). On C4, Key Track's centre, nothing changes: its level and its share above 1, 2 and 4 kHz are 1.27.0's to the hundredth of a dB. Clang is in 258's levelled list, and a test holds its C4 within 0.5 dB of 1.27.0's level and brightness.

Tests: `npx tsc` and `npm run lint` clean; the unit tests of the files importing the Presets (11 files, 252 tests) and their browser tests (`presets`, `synthEngine`, `patchesAtTheEdges`, `writesOnlyChanges`, `cycleLock`: 589 tests) pass; Playwright's `patches.spec.ts` and `tour.spec.ts` pass in Chromium (64) and WebKit (64, one Tour test red beside the others and green alone: a load flake, load about 4.8).

**Calls made (Claude's call, open to the owner):**

1. **The words** follow review 13's suggestion and borrow Detune's formula's "blur into roughness", so the Preset and the readout say the same thing. They are a sentence, which issue 156 lets wrap; they are one clause longer than before.
2. **Key Track 0.5 for Clang,** the middle of what holds: 0.3 already keeps C2 to C6 within 4.2 dB, 0.7 within 1.8. At 0.5 a low Clang keeps some of its thinning and its C7 sits 2.2 dB under its C4. Away from C4 its high-pass moves (about 300 Hz on C2, 1.2 kHz on C6), so a low Clang is fuller and a high one a little thinner than before; on C4 it is the same sound.

**What to try in the app:** play Fast Beats on C4 beside Slow Beats, with Detune's readout open: the words and the readout agree. Then play Clang from C2 up to C6: its low Notes should no longer drop away, and its C4 should sound as in 1.27.0.
