# 226: Two Presets high up

**What to build:** From the inbox (2026-11-03, the 1.23.0 ear check): two Presets that behave less well on high Notes, neither holding the release. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Claude's calls, open to the owner (2026-11-03, triage):

1. **The ear check's fixes first,** measured as it measured: Talking Filter with Key Track about 0.5 on its band-pass (or a Cutoff near 1 kHz), Riser with Key Track 0.5; whichever keeps each Preset's sound in its usual range and mends the top.
2. **Each Preset's words still true after,** the fact-checker's method.
3. **The owner tries them by ear** before the issue is done.

## Agent Brief

**Category:** enhancement
**Summary:** Talking Filter pulses between a near-sine and a vowel on C5, and Riser held on C6 falls silent before its Attack ends.

**Current behavior:**
- Talking Filter on C5: the fundamental takes over 90 % of the sound in about a third of its 40 ms windows, in runs up to 220 ms, as its band-pass dips toward 523 Hz (as in 1.22.0).
- Riser, Key Track 1, held on C6: its rising high-pass reaches 20 kHz and falls silent after about 5 s (C7 2.5 s) under issue 195's fade at the top; on release it swells back.

**Desired behavior:**
- Talking Filter talks on C5 as on C4: no window where one Harmonic holds over 80 % for more than 60 ms.
- Riser held on C6 rises through its Attack without falling silent; its low Notes sound as now.

**Key interfaces:**
- The two Presets' settings
- The Preset tests that measure their sound

**Acceptance criteria:**
- [ ] Talking Filter measured on C3, C4 and C5 against the rule above; C3 and C4 within 1 dB of now
- [ ] Riser measured on C2, C4, C6 and C7 held through its Attack: never silent before its release on C6
- [ ] Their descriptions still true; the Preset tests pass
- [ ] Tried by the owner by ear

**Out of scope:**
- Other Presets; the Filter's answer at the top (issue 195)
