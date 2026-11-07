# 265: Words and comments that lag 1.26

**What to build:** Review 12's findings over the whole app on 1.26.2 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/12-ripple-hunter.md)), words and comments the code has made untrue:

1. **Display's tip lists only the Viewers' settings,** though the panel also holds Keys, Tips, Bead and Theme, where the README and Bead's tip send people; a test name, a styles comment and a helper say the same three groups.
2. **The Synth Geek Layer's tip says the Mixer's levels and the Sustain read in dB:** the Volume does too, Ring does not; the layer's unit test is named for less than the layer reads.
3. **"The LFO" where there are two:** the LFO & Envelopes tip, the README and two code comments; the Timeline's tips and the glossary leave out the line aftertouch draws.
4. **The engine's opening comment says every Tap follows the newest Note,** against ADR-0022 and the Amp Tap's default of every Voice.
5. **The PRD's "In v1, still to do"** names issues done since 2026-11-02 and none of 251 to 264, and its module interfaces name functions that no longer exist.
6. **The README's "a dozen" reviewers,** where there are twenty.
7. **CONTRIBUTING says every push to main runs all its commands,** but GitHub runs neither the statistics nor the frame costs.
8. **The design principles put Modulation below the stages** (beside them from 1920 px), and say every screen state is audited, while the audit skips the Sub & Noise tab and the Tour's and the Tutorials' cards.
9. **"Init's Resonance" is 5 %** in the band-pass make-up's code, its comments and two test names, where Init's is 20 %.
10. **About 50 code comments and test names state an old layout or count** (the Mixer under the tabs, a 44 px label column, rows "on the heading line", 17 keys on phones, 12 px to Hold, fifteen Steps, the MIDI "dot", Bead taking no pointer): one sweep.

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes to both").

## Agent Brief

**Category:** bug
**Summary:** Ten groups of words, docs and comments that say what the code no longer does: put each right, and the audit's missing screens either audited or the principle worded to match.

**Current behavior:** As the ten items above say; review 12's report gives each one's place and quote.

**Desired behavior:**
- Each item's words true of the code; where a word is the code's (a test name, a constant's meaning, "Init's Resonance"), the word changes and the behaviour stays.
- The design audit covers the Sub & Noise tab and the Tour's and the Tutorials' cards, or the principle says what it covers.
- An accepted ADR is not edited; ADR-0022 is right and the comment is wrong.

**Key interfaces:**
- The tips and the glossary
- The README, CONTRIBUTING, the PRD and the design principles
- Code comments and test names

**Acceptance criteria:**
- [ ] Each item done, the report's quotes no longer found
- [ ] The design audit's states listed, the new ones passing
- [ ] Every test passes, renamed tests included

**Out of scope:** the Preset and tip claims about sound ([266](./266-preset-and-tip-words-that-hold.md)); the two MIDI Learn bugs review 12 found ([255](./255-midi-learn-and-the-c16-say-what-they-do.md)).
