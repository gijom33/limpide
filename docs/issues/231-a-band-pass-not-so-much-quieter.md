# 231: A band-pass not so much quieter

**What to build:** The owner's idea (inbox, 2026-11-04): "Choosing different filter type, should not impact dB loss so much. Bandpass seems to lower volume too much." The Filter's band-pass passes 0 dB at its centre, but a saw's power is in its low Harmonics, which the band cuts; nothing makes the level up. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** needs-info · enhancement. Waiting on the owner's answers to the questions below; polish for v1.

## What was measured

From the Filter's own response (the biquads' magnitudes over a saw's Harmonics, Resonance 5 %, as Init), each Mode's level against no Filter, in dB:

| Cutoff, Note | Low-pass 12 / 24 | High-pass 12 / 24 | Band-pass 12 / 24 | Notch 12 / 24 |
| --- | --- | --- | --- | --- |
| 3.5 kHz, C3 | 0 / 0 | −15.9 / −15.9 | −12.3 / −15.3 | −0.3 / −0.4 |
| 3.5 kHz, A3 | −0.1 / 0 | −13.7 / −13.6 | −10.1 / −13.0 | −0.4 / −0.7 |
| 3.5 kHz, C5 | −0.2 / +0.1 | −9.8 / −9.8 | −6.5 / −9.2 | −1.1 / −1.7 |
| 1 kHz, A3 | −0.4 / 0 | −7.7 / −7.7 | −5.1 / −7.5 | −1.6 / −2.6 |

So switching Init from low-pass to band-pass costs 10 to 15 dB at its Cutoff, more at 24 dB and on low Notes; a high-pass costs as much, by design (it takes the fundamental away); a notch costs little. The loss depends on the Note and the Cutoff, not on the Mode alone. 7 Presets use the band-pass, 7 the high-pass, 2 the notch: their levels were set by ear and the ear check's group medians, with the loss as it is.

## Questions for the owner

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
