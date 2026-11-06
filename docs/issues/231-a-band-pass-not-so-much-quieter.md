# 231: A band-pass not so much quieter

**What to build:** The owner's idea (inbox, 2026-11-04): "Choosing different filter type, should not impact dB loss so much. Bandpass seems to lower volume too much." The Filter's band-pass passes 0 dB at its centre, but a saw's power is in its low Harmonics, which the band cuts; nothing makes the level up. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1; the owner's answers below (2026-11-05).

## Decisions

Decided by the owner (2026-11-05, "Yes to all three"), each the recommendation below:

1. **The band-pass only is made up.** A high-pass's loss is what it is chosen for; the notch loses little.
2. **A fixed make-up plus a part that follows the Resonance, with a ceiling.** The fixed part is about +9 dB at 12 dB and +12 dB at 24 dB, bringing Init's A3 at 3.5 kHz near the low-pass; above Init's Resonance the band narrows and the make-up rises with it, as a classic constant-skirt band-pass does (research, [231-band-pass-level](../research/231-band-pass-level.md)), but never past the ceiling.
3. **The 7 band-pass Presets' Volume is taken down by as much as their make-up,** so each sounds as now.

Claude's calls, open to the owner (2026-11-05):

4. **The ceiling is 12 dB above the fixed part,** so the make-up is at most +21 dB at 12 dB and +24 dB at 24 dB; the limiter and the ear check keep a loud Patch under the knee.
5. **The make-up follows the Resonance as it is modulated,** not only the knob, so an LFO or envelope on Resonance does not pump the level.
6. **The Viewers and the words follow the sound:** the Filter's drawn response, the Viewers' ideal and the Geek tip's band-pass formula and line ("the gain is 1 right at the Cutoff") show the make-up, so what is seen is what is heard.

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
