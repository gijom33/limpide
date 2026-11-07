# 231: A band-pass not so much quieter

**What to build:** The owner's idea (inbox, 2026-11-04): "Choosing different filter type, should not impact dB loss so much. Bandpass seems to lower volume too much." The Filter's band-pass passes 0 dB at its centre, but a saw's power is in its low Harmonics, which the band cuts; nothing makes the level up. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-06). Built at night (2026-11-05), set back for the owner's answers, and applied to main on 2026-11-06 once the owner had given them ("Yes to all four"); approved by the owner by ear: "Sounds fine". Ships with the next release.

## Decisions

Decided by the owner (2026-11-05, "Yes to all three"), each the recommendation below:

1. **The band-pass only is made up.** A high-pass's loss is what it is chosen for; the notch loses little.
2. **A fixed make-up plus a part that follows the Resonance, with a ceiling.** The fixed part is about +9 dB at 12 dB and +12 dB at 24 dB, bringing Init's A3 at 3.5 kHz near the low-pass; above Init's Resonance the band narrows and the make-up rises with it, as a classic constant-skirt band-pass does (research, [231-band-pass-level](../research/231-band-pass-level.md)), but never past the ceiling.
3. **The 7 band-pass Presets' Volume is taken down by as much as their make-up,** so each sounds as now.

Claude's calls, open to the owner (2026-11-05):

4. **The ceiling is 12 dB above the fixed part,** so the make-up is at most +21 dB at 12 dB and +24 dB at 24 dB; the limiter and the ear check keep a loud Patch under the knee.
5. **The make-up follows the Resonance as it is modulated,** not only the knob, so an LFO or envelope on Resonance does not pump the level.
6. **The Viewers and the words follow the sound:** the Filter's drawn response, the Viewers' ideal and the Geek tip's band-pass formula and line ("the gain is 1 right at the Cutoff") show the make-up, so what is seen is what is heard.

Decided by the owner (2026-11-06, "Yes to all four"), on the night's questions below, each the recommendation:

7. **The make-up rises as √Q above Init's Resonance,** not as the Q itself, so the level stays within 3 dB of its level at 5 %; the ceiling is reached at about 80 % Resonance rather than 40 %. This replaces decision 2's "rises with it, as a classic constant-skirt band-pass does".
8. **The click when leaving a loud band-pass is accepted:** the criterion holds up to 50 % Resonance, and a short crossfade on every Mode change is its own issue, [248](./248-a-crossfade-on-a-change-of-filter-mode.md).
9. **Talking Filter's Volume is matched on its loudest moment** over its 4-second cycle, as built, and judged by ear.
10. **The Response Curve keeps its scale:** past +20 dB it runs off the Spectrum's top, as a low-pass's peak already does.

## What was measured

From the Filter's own response (the biquads' magnitudes over a saw's Harmonics, Resonance 5 %, as Init), each Mode's level against no Filter, in dB:

| Cutoff, Note | Low-pass 12 / 24 | High-pass 12 / 24 | Band-pass 12 / 24 | Notch 12 / 24 |
| --- | --- | --- | --- | --- |
| 3.5 kHz, C3 | 0 / 0 | −15.9 / −15.9 | −12.3 / −15.3 | −0.3 / −0.4 |
| 3.5 kHz, A3 | −0.1 / 0 | −13.7 / −13.6 | −10.1 / −13.0 | −0.4 / −0.7 |
| 3.5 kHz, C5 | −0.2 / +0.1 | −9.8 / −9.8 | −6.5 / −9.2 | −1.1 / −1.7 |
| 1 kHz, A3 | −0.4 / 0 | −7.7 / −7.7 | −5.1 / −7.5 | −1.6 / −2.6 |

So switching Init from low-pass to band-pass costs 10 to 15 dB at its Cutoff, more at 24 dB and on low Notes; a high-pass costs as much, by design (it takes the fundamental away); a notch costs little. The loss depends on the Note and the Cutoff, not on the Mode alone. 7 Presets use the band-pass, 7 the high-pass, 2 the notch: their levels were set by ear and the ear check's group medians, with the loss as it is.

## Questions for the owner (answered, above)

1. **Which Modes are made up?**
   - (a) The band-pass only, as the owner names it.
   - (b) The band-pass and the high-pass: both lose 10 to 16 dB on a saw.
   - (c) Every Mode, each to the low-pass's level.

   Recommended: (a). A high-pass is chosen to thin the sound, and its loss is what it does; a band-pass is chosen for a voice or a nasal tone, and the loss only gets in the way.

2. **How is it made up?**
   - (a) A fixed make-up gain for the Mode, the same at every Cutoff and Note: simple and predictable, but right only on average (about +9 dB at 12 dB and +12 dB at 24 dB brings Init's A3 at 3.5 kHz near the low-pass; C5 would then be about 3 dB louder, C3 about 3 dB quieter).
   - (b) A make-up that also follows the Resonance: a narrower band (more Resonance) loses more, so it is made up more, capped for headroom.
   - (c) A level that follows the Cutoff against the Note, so switching Mode keeps the loudness the same everywhere: the closest to "not so much", but the hardest to keep true, and it would change as the Cutoff moves.

   Recommended: (b). It answers the owner's case at Init, keeps a Mode's level independent of what is played, and covers the band-pass's own Resonance, which narrows the band; the limiter and the ear check keep it under the knee.

3. **The 7 band-pass Presets** (or the 14 with the high-pass) would get louder by the make-up.
   - (a) Their Volume taken down by as much, so each sounds as now.
   - (b) Left louder, each checked by the ear stand-in against its group.

   Recommended: (a). The Presets were balanced by ear; the change is about switching Mode, not about them.

## Agent Brief

**Category:** enhancement
**Summary:** Switching the Filter to band-pass no longer drops the level by 10 to 15 dB: the band-pass gets a make-up gain, fixed plus a part that follows the Resonance, with a ceiling.

**Current behavior:** The band-pass passes 0 dB at its centre at every Resonance; a saw's power lies in its low Harmonics on the band's skirts, so the band-pass is 10 to 15 dB quieter than the low-pass at Init's settings, and quieter still as Resonance narrows the band and at 24 dB.

**Desired behavior:**
- In band-pass Mode only, the Filter's output is raised by a make-up gain: about +9 dB at 12 dB and +12 dB at 24 dB at Resonance up to Init's 5 %, rising with the Resonance above that, never more than 12 dB above that fixed part.
- The make-up follows the Resonance as modulated per Voice, without clicks or zipper noise when the Resonance or the Mode changes.
- The low-pass, high-pass and notch are unchanged.
- The 7 Presets that use the band-pass have their Volume lowered so their output level is as before.
- The Filter's drawn response, the Viewers' ideal and the Geek tip's band-pass formula and words include the make-up.

**Key interfaces:**
- The Filter's stage design by Mode, slope and Resonance, and the Resonance curve that maps a modulated Resonance onto the stages.
- The pass-band reading the Viewers use for their ideal.
- The Geek tips' per-Mode formula and line.
- The Presets' Volume.

**Acceptance criteria:**
- [ ] On Init at A3 and Cutoff 3.5 kHz, the band-pass is within 3 dB of the low-pass, at 12 and at 24 dB.
- [ ] From 5 % to the Resonance where the ceiling is reached, that band-pass level stays within 3 dB of its level at 5 %; past it, the make-up stays at the ceiling.
- [ ] Each of the 7 band-pass Presets' output level is within 0.5 dB of before, measured as the engine tests measure Presets.
- [ ] The other three Modes measure as before.
- [ ] The Viewers' ideal for a band-pass includes the make-up, so its level matches the sound's.
- [ ] Switching Mode and sweeping Resonance while a Note holds gives no click.

**Out of scope:**
- A make-up for the high-pass or the notch (decision 1).
- A level that follows the Cutoff against the Note.
- Any other Preset's level.

## How it was built

Built at night (2026-11-05), test-first.

**What was built:**

- The band-pass's level is raised after the Filter by a make-up gain: +9 dB at 12 dB and +12 dB at 24 dB up to 5 % Resonance, rising with the Resonance above it, at most 12 dB over that (+21 dB and +24 dB, reached at 80 %). The other three Modes are as they were.
- The make-up follows the Resonance as it is moved: the knob, aftertouch and both LFOs reach it the way they reach the Filter's Q, through a curve from the Resonance itself, so an LFO on Resonance does not pump the level.
- The Response Curve, and the Ideal drawn from it, include the make-up, so the Filter Tap and the drawn curve still agree within half a dB.
- The Geek tip of the band-pass shows it: `|H| = G · …`, the line now says the gain is G at the Cutoff, and G is named with its dB.
- The 7 band-pass Presets' Volume is taken down by their make-up: Vowel 10 %, Sync-ish Lead 32 %, Cowbell 22 %, Wind 32 %, Wah 22 %, Talking Filter 27 %, Robot 35 %. Each plays on C4 within 0.5 dB of its level before.

**Measured** (Init, the Cutoff at 3.5 kHz, A3): the band-pass is now within about 1.5 dB of the low-pass at both Slopes (it was 12.8 dB under at 12 dB and 15.8 dB under at 24 dB). From 5 % to 80 % Resonance its level stays within 3 dB of its level at 5 %.

**Claude's calls, open to the owner:**

1. **The rise follows the square root of the Q, which departs from decision 2:** the decision says it rises as a classic constant-skirt band-pass does, that is with the Q itself; it rises half as many dB. Measured on a saw, what a narrowing band lets through falls as √Q, at both Slopes and at every Cutoff and Note tried, so √Q keeps the level flat. Following the Q itself made it up to 6 to 9 dB louder at 20 to 40 % Resonance, which breaks the level criterion. So the ceiling is reached at 80 % Resonance, not about 40 %. The decision and the criterion disagree, and this keeps the criterion: the owner's to confirm.
2. **Init's Resonance is 20 %, not 5 %,** and its Cutoff is 2 kHz (the issue's table took 5 % for Init). The make-up starts rising at 5 % as the decisions say; at Init's real 20 % it is +11.3 dB at 12 dB. The acceptance checks were run on Init with its Cutoff set to 3.5 kHz, so at 20 %.
3. **The make-up is not smoothed.** It changes at the same sample as the Filter's stages when the Mode or Slope changes. A smoothed make-up made switching from a band-pass to a low-pass worse: for a few milliseconds the old band-pass gain was applied to the low-pass's sound. Measured with the knob stepped 1 % every 4 ms, the Resonance sweeps without zipper noise.
4. **Talking Filter misses the Presets' criterion by the usual measure, and meets it over a whole cycle of its LFO 2.** Its level is taken (4 seconds, as issue 226's test measures it), because its LFO 2 moves the Resonance and so the make-up. Before, its narrow moments were quieter. Now its level holds through the cycle: its loudest moment on C4 is as before (−22.6 dBFS), and over the first second, the Presets' usual measure, it is 1.5 dB louder than it was. No Volume meets both, as the make-up evens out what LFO 2 used to swing.
5. **The no-click criterion is met only up to about 50 % Resonance.** The Filter's stages swap at one sample. From a narrow, now loud, band-pass back to the low-pass, that swap steps 1.4 times the wave's own steepest step at 60 % Resonance and 3.3 times at 80 % (on A3 at 1 kHz). Before, it stepped about as much as the wave. At Init's Resonance, and anywhere up to about 50 %, switching both ways stays inside the wave's own steps, and sweeping the Resonance by the knob never clicks. The cure would be a short crossfade whenever the Mode changes, which is a change to the Filter, not to the make-up: left for the owner to make an issue of or drop.

6. **The Response Curve runs past the top of the Spectrum** when a narrow band-pass is made up past +20 dB (from about 70 % Resonance). This is where a low-pass's resonant peak already goes at full Resonance, so the view's scale was left as it is.

**Acceptance criteria, as built:** the first, second, fourth and fifth are met. The third is met for six Presets, and for Talking Filter over a whole LFO cycle (call 4). The sixth is met up to about 50 % Resonance (call 5).

**What to try in the app:**

- Init, held Note: switch from low-pass to band-pass and back. The level should stay about the same, with the tone going nasal.
- In band-pass, turn Resonance from 0 to 100 %: the band narrows and the level holds. Past 80 % it starts to fall, because the ceiling has been reached.
- Switch the Slope to 24 dB in band-pass: about as loud as at 12 dB.
- Play Vowel, Wah, Talking Filter and Robot: they should sound as before. Talking Filter should pump less with its Resonance LFO.
- In the Synth Geek Layer, the Filter Mode's tip on band-pass shows G.
- With high Resonance (above about 60 %), switch from band-pass to low-pass while a Note holds and listen for a tick (call 5).

## Questions for the owner, from the night (2026-11-06; answered, above)

1. **Decision 2 and the level criterion disagree: which wins?** A make-up that rises with the Q itself (decision 2's constant-skirt band-pass) is 6 to 9 dB too loud at 20 to 40 % Resonance and fails "within 3 dB of its level at 5 %"; one that rises with √Q keeps the level flat and reaches the ceiling at 80 % instead of about 40 %. Recommended: √Q, as built, so the level holds.
2. **The click when leaving a loud band-pass:** above about 50 % Resonance, switching from band-pass to low-pass while a Note holds steps up to 3.3 times the wave's own steepest step. Recommended: accept 231 with the criterion met up to 50 %, and a new issue for a short crossfade on every Mode change (a change to the Filter itself).
3. **Talking Filter's level:** its LFO 2 moves the Resonance, so the make-up evens out its swing; its loudest moment over a 4-second cycle is as before, but over the first second (the Presets' usual measure) it is 1.5 dB louder. No single Volume meets both. Recommended: keep the Volume matched on the loudest moment, as built, and judge it by ear.
4. **The Response Curve past +20 dB** runs off the top of the Spectrum from about 70 % Resonance, as a low-pass's peak already does at full Resonance. Recommended: leave the scale as it is.
