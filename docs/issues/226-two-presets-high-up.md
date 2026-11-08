# 226: Two Presets high up

**What to build:** From the inbox (2026-11-03, the 1.23.0 ear check): two Presets that behave less well on high Notes, neither holding the release. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, released in 1.24.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

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
- [x] Talking Filter measured on C3, C4 and C5 against the rule above; C3 and C4 within 1 dB of now
- [x] Riser measured on C2, C4, C6 and C7 held through its Attack: never silent before its release on C6
- [x] Their descriptions still true; the Preset tests pass
- [ ] ~~Tried by the owner by ear~~ (not checked at the time)

**Out of scope:**
- Other Presets; the Filter's answer at the top (issue 195)

## How it was built

**Talking Filter:** Cutoff 800 Hz → 1 kHz and Key Track 0 → 0.5; the rest as issue 205 left it. Its band now follows the Note half way (on C4 it sits at 1 kHz, on C5 at about 1.4 kHz, on C3 at about 700 Hz), so on C5 LFO 1's sweep no longer takes it down onto the fundamental.

**Riser:** Key Track 1 → 0.5. On C4 nothing changes (Key Track's centre); higher up its rising high-pass tops out at 12.8 kHz on C6 and 18.1 kHz on C7, short of issue 195's fade at the top, where at Key Track 1 it reached 20 kHz.

Measured as the 1.23.0 ear check measured, on this branch (with 218 and 219 in): rendered offline in Chromium through the engine, 48 kHz, velocity 1, the limiter's curve straight; for Talking Filter 40 ms windows every 20 ms over a 4 s held Note, the strongest of the first 30 Harmonics' share of each; levels as the loudest 100 ms.

| Talking Filter | Loudest 100 ms, before → after | Strongest Harmonic, at most | Longest run over 80 % |
|---|---|---|---|
| C3 | −24.20 → −23.76 dBFS | 60 % → 65 % | none → none |
| C4 | −21.90 → −22.62 dBFS | 79 % → 82 % | none → 40 ms (3 lone windows) |
| C5 | −20.96 → −21.55 dBFS | 99 % → 80 % | 200 ms (85 windows of 193 over) → none |

| Riser, held 7 s | Loudest 100 ms, before → after | Silent (under −60 dBFS) before release | Peak |
|---|---|---|---|
| C2 | −22.01 → −22.53 dBFS (at 1 s −24.4 → −26.2, at 2 s −22.8 → −24.1) | never → never | 0.37 → 0.38 |
| C4 | −21.48 → −21.48 (identical) | never → never | 0.41 |
| C6 | −21.87 → −19.55 | from 5.3 s → never (−20 to −22 dBFS throughout) | 0.34 → 0.38 |
| C7 | −22.65 → −18.01 | from 2.65 s → never (thins to −28.6 dBFS in its last half second) | 0.27 → 0.44 |

On release both still swell back and fade, as before. Riser's C6 sits 2.5 dB over its group's median (the group's level test allows 3).

The tests: a new one, "two Presets high up (issue 226)", holds both rules: Talking Filter on C3, C4 and C5 never has one Harmonic over 80 % for more than 60 ms, C3 and C4 within 1 dB of the levels above; Riser on C6 and C7 never under −40 dBFS from half a second after the Note to its release, C2 within 1 dB and C4 within 0.1 dB of before, every Note under the limiter's knee. Issue 205's band-pass check now asks the fundamental and everything above 8 kHz to be more than 6 dB under the open saw at the band's widest (13.3 and 9.3 dB), as above 4 kHz the 1 kHz band is only 3.4 dB short (6.3 at 800 Hz). Issue 195's check of a high-pass falling silent at the top now plays Riser at Key Track 1, where it still reaches it. Issues 125, 195 and 205 have a dated line.

### Calls made (Claude's call, open to the owner)

- **Both of the ear check's fixes for Talking Filter, not one:** Key Track 0.5 alone still left C5 one Harmonic for up to 100 ms (34 windows over 80 %); a Cutoff of 1 kHz alone up to 120 ms. Key Track 1 cleared C5 but made C3 2.3 dB louder (0.75: 1.8 dB), past the 1 dB the issue keeps. Key Track 0.5 with 1 kHz clears C5 with the most room of those tried (0.55 with 950 Hz is about as good), C3 +0.4 dB, C4 −0.7 dB. The vowels on C4 sit a little higher, about a third.
- **Riser at Key Track 0.5, as the ear check proposed:** its low Notes move a little: C2's high-pass now rises from 100 Hz rather than 50, so C2 is 0.5 dB quieter at its loudest and up to 1.8 dB quieter early in its rise. Issue 125 chose Key Track 1 to keep C6 within its family; at 0.5 it is 2.5 dB over, inside the 3 dB the level test allows.
- **"Silent" read as under −40 dBFS** in the test (−60 in issue 195's); the quietest moment measured on C6 or C7 is −28.6 dBFS.
- **The descriptions unchanged:** Talking Filter's names no frequency; Riser's "from 200 Hz past 5 kHz" stays true on C4, as it was only true near C4 before.

### What to try

- **Talking Filter on C5,** then C6 and a phrase from C3 up: it should mumble as on C4, no beat of near-sine between the vowels. On C4, whether the vowels a third higher still sound like its mumble.
- **Riser held on C6 and C7 for its whole six seconds:** it should keep rising and thin out toward the top, not vanish; then on C2, whether its low rise still sounds as full.

### Run

`npx tsc` and `npm run lint` clean. Unit and engine: the Presets' tests (browser and unit), the words test and the edge Patches test, 134 passed. Playwright patches: 28 passed in Chromium, 28 in WebKit. The code review (standards and spec, since `1cd1612`) found the docs of issues 125, 195 and 205 left untrue, comments telling history, duplicated helpers and a weakened band-pass check: all fixed in the second commit.
