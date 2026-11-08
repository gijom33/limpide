# 269: words and a level after 1.27.0

**What to build:** What 1.27.0's word checks found that the release did not fix (the inbox, 2026-11-08; reports [12](../reviews/2026-11-07/12-ripple-hunter-1.27.0.md), [13](../reviews/2026-11-07/13-fact-checker-1.27.0.md) and [14](../reviews/2026-11-07/14-ear-stand-in-1.27.0.md)). Polish for v1 ([131](./131-v1.md)).

1. **Fast Beats' "the beating is so fast it becomes roughness"** sits beside Detune's readout, 6.12 Hz beats on C4, where the formula calls it roughness past 20 a second; its upper Harmonics beat faster (fact-checker).
2. **Clang drops 6.4 dB from C4 down to C2,** over the 6 dB 258 holds the others to; a Key Track of about 0.5 untried (ear stand-in).
3. **CLAUDE.md's "Every commit" line** leaves out the issues' record check 261 added to the hook, nothing there says to run `npm run issues` after editing an issue, and its "Before a push" leaves out `npm run issues:check` (ripple hunter, finding 10).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish; Claude's call, open to the owner (2026-11-08). Item 3 changes the owner's instructions to Claude, so it waits for the owner's yes.

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
- [ ] Fast Beats' claim test
- [ ] Clang in 258's level test, within 6 dB from C2 to C6
- [ ] CLAUDE.md's lines, on the owner's yes

**Out of scope:** Zap Pluck's words and level (267's check by ear); Vowel, within its bound.
