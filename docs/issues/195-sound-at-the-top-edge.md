# 195: Sound at the top edge

**What to build:** The ear checks of 1.20.0 and 1.21.0 (inbox): since issue 166 holds the Cutoff to 20 kHz, a resonant Preset's top Harmonics on C6 and C7 get louder, not quieter (Screamer's 19.9 kHz Harmonic +20 dB in the attack on C6, Analog Drift Lead +6.9 dB, Glide Slide +2.9 dB at 18.8 kHz on C7); Riser on C7 now plays its last four seconds at −27 dBFS, 65 % of it above 20 kHz, where it fell silent; Growl passes the limiter on B2 and from C#5 to G#5 (up to 1.22, 1.39 at 128 BPM), 4–10 ms after its square drops the resonant Cutoff, as 1.20.0 did. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the inbox's lines of the 1.20.0 and 1.21.0 reviews and checks.

1. **Rendered before and after** with the ear stand-in's method, on the Presets named and every Preset's top Notes.

## Agent Brief

**Category:** bug
**Summary:** At the top of the range a held Cutoff puts a Resonance peak near 20 kHz, a high-pass Riser hisses in ultrasound, and Growl overshoots the limiter.

**Current behavior:** The Cutoff held at 20 kHz keeps a Resonance peak there that the low-pass past Nyquist never had; resonant Presets' top Harmonics rise up to +20 dB on C6 and C7. Riser's Filter Envelope takes the high-pass to its top, leaving faint hiss mostly above 20 kHz. Growl peaks at 1.22 to 1.39 just after its square drops the resonant Cutoff.

**Desired behavior:** Near the top the Resonance fades out as the Cutoff nears 20 kHz (as an analogue Filter's does past its range), so the top Harmonics are no louder than before 166; a high-pass at its top falls silent; Growl stays under the limiter's knee (its Preset or the Resonance's behaviour on a fast Cutoff drop).

**Key interfaces:**
- The Filter's Cutoff and Resonance near the top, in the engine and the Response Curve (ADR-0003: the model and the sound agree)
- The Presets Screamer, Analog Drift Lead, Glide Slide, Riser, Growl

**Acceptance criteria:**
- [ ] Engine tests: on C7, Screamer's top Harmonics no louder than before 166; Riser's last seconds below −60 dBFS; Growl's peak under 0.8 on B2 and C#5 to G#5
- [ ] The Response Curve matches the sound in the engine tests; the edge Patches test passes

**Out of scope:**
- Presets' voicing beyond these
