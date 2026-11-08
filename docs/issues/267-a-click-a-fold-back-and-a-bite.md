# 267: A click, a fold-back and a bite

**What to build:** Three of review 14's findings over all 142 Presets on 1.26.2 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/14-ear-stand-in.md)), beyond levels (those are [258](./258-preset-levels-across-the-keyboard.md)'s):

1. **Trance Gate clicks on a strummed chord:** each Note joining a chord already sounding bends 0.06 to 0.17 about 4 ms after its start, three to seven times the gate's own switches (0.024), for Notes 5 to 40 ms apart; a chord struck at once bends no more than the gate.
2. **Ring Lead folds back on C6 alone:** LFO 2's vibrato swings the top partial its Ring keeps past 24 kHz, −57 dB at 192 kHz, just over [103](./103-fm-and-ring-fold-back-at-the-top.md)'s −60 dB line, where B5, C#6, D6 and C6 without the vibrato measure −116 or lower.
3. **Zap Pluck is harsh on C6:** 72 % of its energy above 5 kHz (0 % on C4), where the rest of Plucks & Mallets keeps 5.4 % or less, its FM sidebands climbing with the Note past a Cutoff fixed at 8 kHz.

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; ships with the next release. Left: the owner's ear on Trance Gate, Ring Lead and Zap Pluck. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes to both").

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
- [x] A test: Trance Gate's chord strummed 5 to 40 ms apart, no bend over the gate's
- [x] The fold-back test covers Ring Lead with its vibrato on C6 and C7
- [x] Zap Pluck's share above 5 kHz on C6 measured in a test
- [ ] The owner listens to the three (a human check)

**Out of scope:** levels across the keyboard (258).

## How it was built

1. **The click, in the engine, for every Preset.** Every Voice shares the two LFOs, so a Note joining others still sounding restarts theirs too; the new LFO oscillator took over at one sample, stepping the Notes already sounding, and a restarted square or saw started on its jump, at its middle, for a sample (Trance Gate's gate dipped to half for a sample at each joining Note). Now each LFO oscillator reaches the LFO through its own gain, and at a restart the old one fades out over half a millisecond while the new one fades in; a restart called off (issue 102) calls its fade off too. Notes asked within that half millisecond of each other restart the LFO once, as a chord's Notes asked at once already did. The model still restarts at the Note: the sound gets there half a millisecond later, before anything compares the two. Review 14's "about 4 ms after its start" is the safety limiter's 4x oversampling, which delays the whole output by that much; the click was at the Note's start.
2. **The fold-back, in the engine.** Ring's cut of Osc 1's and Osc 2's Harmonics (issue 103) is now worked out at the top of the LFOs' swing of each one's pitch (Pitch for both; Osc 2 Pitch and Detune for Osc 2), so a vibrato no longer takes the top product past 24 kHz. Ring Lead on C6 drops its saw's 20th Harmonic (20.9 kHz). Other Ring Presets with an LFO on a pitch (Glass Pad's Detune) lose at most their top Harmonic high up.
3. **The bite, in the Preset.** Zap Pluck's FM index is the same on every Note, so its sidebands climb with the Note; no knob scales FM with the key, and Key Track opens the Filter as the Note climbs, the wrong way here. So its Filter now sits between C4's sidebands and C6's: 24 dB at 2.5 kHz, Resonance 15 %, Volume 81 % (taking back the 1.8 dB the Resonance adds on C4). Its words gain "A 24 dB Filter at 2.5 kHz keeps the high Notes from biting."

**Measured** (offline at 48 kHz, velocity 1, the limiter straight; fold-back at 192 kHz), before → after:

| | before | after |
|---|---|---|
| Trance Gate, a Note joining its chord 5 to 100 ms after the last, its bend against the gate's own switches | ×2.2 to ×7 | ×0.21 to ×0.38 |
| A sine LFO on Volume restarted at its top under a Note sounding, the gain's largest move in a sample | 0.5 | 0.02 |
| Ring Lead on C6, fold-back at the top of its vibrato (the worst 85 ms window) | −56 dB | under −60 dB |
| Zap Pluck on C6, the largest share above 5 kHz over 85 ms windows (the rest of its group: 11 % at most, Pick Pluck's pick; FM Bell 5 %) | 92 % | 6.0 % |
| Zap Pluck on C4, its share above 1.5 kHz over its first 170 ms | 11.4 % | 12.0 % |
| Zap Pluck's loudest 100 ms, C2 / C3 / C4 / C5 / C6 / C7 (dBFS) | −29.1 / −29.0 / −29.0 / −29.1 / −29.8 / −31.5 | −30.7 / −30.2 / −29.0 / −30.8 / −37.2 / −37.2 |

Review 14 measured 72 % for Zap Pluck and 5.4 % for its group, with windows not given; the test measures the largest share over 85 ms windows, which gives 92 % before.

**Tests:** `src/patch/presets.browser.test.ts`, "a click, a fold-back and a bite (issue 267)": Trance Gate's chord strummed 5, 10, 20, 40, 70 and 100 ms apart, each joining Note's first 25 ms bending no more than the gate's own switches held; Zap Pluck on C6 no more above 5 kHz than the rest of Plucks & Mallets on C2, C4 and C6; Zap Pluck on C4 within 1 dB of 1.26.2's share above 1.5 kHz and 0.5 dB of its level. `src/engine/synthEngine.browser.test.ts`: Ring Lead on C6 and C7 under −60 dB at the top of its vibrato (in issue 103's fold-back tests), and "a retriggered LFO hands over to its new cycle without a step (issue 267)": a sine on Volume restarted at its top, and a square restarted twice within half a millisecond on its upper half, which stays at 1. Each failed before its change (the Zap Pluck C4 test is a guard and passed). Whole engine project: 623 passed in two full runs; in a third, issue 248's Mode-switch test failed once at a load of 16 to 20 and passed alone three times (a load flake). Playwright: `patches.spec.ts` (which caught Zap Pluck's longer words at 375 px), `patchSearch.spec.ts` and `lfo.spec.ts`, in Chromium and WebKit.

**Calls made (Claude's call, open to the owner):**

1. **The fix for the click is in the engine, a fade of half a millisecond**, not a change to Trance Gate: every retriggered LFO under Notes already sounding now hands over without a step (Zap Pluck's, Square Lead's, the wobbles'). Longer would hide more of a sine's restart step but leave the sound behind the model for longer.
2. **A joining Note still restarts the gate for the whole chord**, as Retrigger said before: strummed, the gate starts again at each Note, now without a click. Restarting only on the first Note of a chord would keep the gate's rhythm through a strum, but would lose Zap Pluck's zap on Notes played over a ringing one.
3. **Zap Pluck's high Notes are quieter.** Most of C6's strike lay above 5 kHz; taking it off costs C6 and C7 their loudest 100 ms, about 7 dB under C4 (C2 1.6 dB under). Its steady sine after the strike is as loud as before. That is a fall across the keyboard of the kind issue 258 levels; Zap Pluck was not in 258. A Filter at 2.8 kHz would keep 13 % on C6 and lose about the same level.
4. **Ring's cut counts the LFOs, not the pitch bend, aftertouch on Pitch, or a Glide from a higher Note**, which can still take a top product past the top for a moment.

**To try in the app:** Trance Gate, a chord rolled slowly then quickly across the keys: no click as each Note comes in. Ring Lead held on C6 and C7: no partials sweeping the wrong way as the vibrato swings. Zap Pluck from C4 up to C7: C4's zap as it was, C6 and C7 no longer harsh, and whether they are now too quiet or too dull.

