# 267: A click, a fold-back and a bite

**What to build:** Three of review 14's findings over all 142 Presets on 1.26.2 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/14-ear-stand-in.md)), beyond levels (those are [258](./258-preset-levels-across-the-keyboard.md)'s):

1. **Trance Gate clicks on a strummed chord:** each Note joining a chord already sounding bends 0.06 to 0.17 about 4 ms after its start, three to seven times the gate's own switches (0.024), for Notes 5 to 40 ms apart; a chord struck at once bends no more than the gate.
2. **Ring Lead folds back on C6 alone:** LFO 2's vibrato swings the top partial its Ring keeps past 24 kHz, −57 dB at 192 kHz, just over [103](./103-fm-and-ring-fold-back-at-the-top.md)'s −60 dB line, where B5, C#6, D6 and C6 without the vibrato measure −116 or lower.
3. **Zap Pluck is harsh on C6:** 72 % of its energy above 5 kHz (0 % on C4), where the rest of Plucks & Mallets keeps 5.4 % or less, its FM sidebands climbing with the Note past a Cutoff fixed at 8 kHz.

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes to both"). Then ready-for-human: the owner's ear on Trance Gate, Ring Lead and Zap Pluck.

## Agent Brief

**Category:** bug
**Summary:** A click when a Note joins Trance Gate's chord, Ring Lead's vibrato folding back on C6, and Zap Pluck's bite on high Notes.

**Current behavior:** As the three items above say; review 14's report gives the renders.

**Desired behavior:**
- A Note joining a chord on Trance Gate starts with no bend above the gate's own switches, whatever the gap between Notes; if the cause is in the engine (a gate or an LFO restarting for all Voices), it is fixed there for every Preset.
- Ring Lead under −60 dB of fold-back on every Note to C7 with its vibrato, by the engine's own guard or the Preset.
- Zap Pluck's high Notes in line with its group above 5 kHz, its character on C4 kept.

**Key interfaces:**
- The engine's Note start under an LFO on Volume
- The FM and Ring guard against fold-back
- The three Presets

**Acceptance criteria:**
- [ ] A test: Trance Gate's chord strummed 5 to 40 ms apart, no bend over the gate's
- [ ] The fold-back test covers Ring Lead with its vibrato on C6 and C7
- [ ] Zap Pluck's share above 5 kHz on C6 measured in a test
- [ ] The owner listens to the three (a human check)

**Out of scope:** levels across the keyboard (258).
