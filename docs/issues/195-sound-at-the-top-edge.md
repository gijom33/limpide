# 195: Sound at the top edge

**What to build:** The ear checks of 1.20.0 and 1.21.0 (inbox): since issue 166 holds the Cutoff to 20 kHz, a resonant Preset's top Harmonics on C6 and C7 get louder, not quieter (Screamer's 19.9 kHz Harmonic +20 dB in the attack on C6, Analog Drift Lead +6.9 dB, Glide Slide +2.9 dB at 18.8 kHz on C7); Riser on C7 now plays its last four seconds at −27 dBFS, 65 % of it above 20 kHz, where it fell silent; Growl passes the limiter on B2 and from C#5 to G#5 (up to 1.22, 1.39 at 128 BPM), 4–10 ms after its square drops the resonant Cutoff, as 1.20.0 did. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-02) on night/2026-11-02, for the owner to try

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
- [x] Engine tests: on C7, Screamer's top Harmonics no louder than before 166; Riser's last seconds below −60 dBFS; Growl's peak under 0.8 on B2 and C#5 to G#5
- [x] The Response Curve matches the sound in the engine tests; the edge Patches test passes

**Out of scope:**
- Presets' voicing beyond these

## How it was built

**The Resonance fades at the top.** A low- or high-pass keeps all its Resonance up to half an octave under 20 kHz (14.1 kHz), then loses it along a smooth curve to none at 20 kHz, where its Q is the flat one. The sound does it per Voice: the clamped Cutoff (issue 166) runs through a curve that takes its share off each Filter stage's Q over its flat Q, the knob's Resonance and the LFOs' swing of it alike. The Response Curve draws the same fade (ADR-0003). A band-pass's and a notch's Resonance is a width, not a peak, and does not fade.

**A high-pass at the top falls silent.** Over the last semitone under 20 kHz (18.9 to 20 kHz) a high-pass's output fades to nothing, as it did when its Cutoff passed Nyquist before 166, and the Curve draws it so. Riser on C7 is silent once its Envelope takes the high-pass to the top.

**Growl, retuned:** Resonance 0.6 → 0.5, LFO Depth 0.5 → 0.4, Volume 0.45 → 0.42. Its square still jumps the Filter between two places, a little closer together and a little less resonant, so the ring after each drop stays under the limiter's knee. Its loudest 100 ms on C4 is about −16.0 dBFS (−14.6 before).

**Rendered before and after** (decision 1), every Preset on C2, C4, C6 and C7 held for its Attack and 1.2 s, through the tip before this issue and after it. Anything that changed by more than −60 dB of difference:
- Screamer, Analog Drift Lead, Glide Slide, Portamento, Flute: only on C6 and C7, their top Harmonics no longer lifted by a peak at 20 kHz. The tests hold Screamer, Analog Drift Lead and Glide Slide on C7 (attack and held) and C6 (attack): their Harmonics from 15 to 20 kHz are no louder than through a flat Filter wide open, which passes no more than the Filter past Nyquist did.
- Riser: C7 silent from its high-pass reaching the top (its last four seconds under −60 dBFS in the test); C6 nearly unchanged.
- Ride on C7: its high-pass sits at 17.4 kHz, inside the Resonance's fade, and plays 1.9 dB quieter.
- Snare, Piano, Honky-Tonk, Pick Pluck, Poly Pluck, Harp, Vibes, Marimba, House Organ: differences of −24 to −49 dB, on the strikes whose Envelope takes the Cutoff into the top half octave.
- Growl: on every Note, by its retune. At 97, 120 and 128 BPM, no Note from A1 to C7 reaches 0.8 (it was 1.20 at 120 BPM and 1.48 at 128 on F5 before); the test plays all three.

### Calls made (Claude's call, open to the owner)

- **Half an octave for the Resonance's fade:** wide enough that the fade is smooth as a Cutoff sweeps through it, narrow enough that a resonant Cutoff under 14 kHz rings as it always has.
- **A semitone for a high-pass's fall to silence**, not the half octave: at first both faded together, and Ride on C7 (its high-pass at 17.4 kHz) lost 11 dB; above 18.9 kHz a high-pass passes little anyone hears.
- **Growl through its Preset,** not the Filter's response to a fast drop: the ring after a square's drop is the Web Audio biquad's own, and Resonance and Depth lowered together kept most of its talk (Resonance alone had to fall to 0.35). It is 1.4 dB quieter on C4, inside its group's level. On C7 it is 8 dB quieter, its top hardly a bass's range.
- **"No louder than before 166" measured against a flat Filter wide open** (Resonance 0 at 20 kHz), not a render of 1.19.0's engine: past Nyquist the old low-pass passed everything at 0 dB, the flat one a little less, so the test is as strict or stricter.
- **The Geek layer's Q readout stays the knob's,** as before: it shows the Resonance knob's Q, not the faded one at the Cutoff of the moment; and the model's Resonance stays the knob's with its LFOs, the fade being the Filter's.
- **Issue 166's test of the top** now swings a low-pass past 20 kHz (the clamp still has to hold it there, a little off the top Harmonics); the high-pass it swung there is now silent, held by its own test.

### What to try and hear

- **Screamer on C6 and C7, played hard:** the top should no longer fizz at the edge of hearing in the attack; the bite lower down is unchanged.
- **Riser on C7, held through its six seconds:** it should thin out and fall silent as the high-pass reaches the top, as it did before 1.20.0; on C5 it rises as before.
- **Growl from C2 to G#5, at 120 and 128 BPM:** the limiter light should not come on; listen to whether it still talks enough.
- **A low-pass at full Resonance, the Cutoff swept up past 14 kHz:** the Response Curve's peak should flatten as it reaches the top, and the sound with it.

### Run

`npx tsc` and `npm run lint` clean. Unit: filterDesign and geek, 50 passed. Engine: the engine's and the Presets' browser tests, 473 passed; the edge sweep, 7 passed. Playwright (filterMode, limiting, patches): 33 passed in Chromium, 33 in WebKit.
