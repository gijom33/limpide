# 258: Preset levels across the keyboard

**What to build:** Review 15's findings on 1.26.1, two with review 2 (the inbox, 2026-11-07; [15](../reviews/2026-11-07/15-sound-designer.md), [2](../reviews/2026-11-07/2-synth-enthusiast.md)):

1. **Vowel, Breathing Pad, Two Speeds and Sweep Pad swing 12 to 18 dB between C2 and C6;** Vowel sits 12.9 dB under the Filter Presets on C4 and sounds broken when stepping through Presets (reviews 15 and 2; renders of a fix in review 15's report).
2. **The Drums sit 9 dB under the Basses** (median −25.6 dBFS against −16.4), the Kick at full Volume already at −27.2 against 808 Boom's −15.5 (review 15).
3. **Felt Piano says a harder Note is brighter;** soft over hard measures 0.99, the last of 1.16.0's seven unheard Velocity claims (review 15).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues). Then ready-for-human: the owner's ear on the changed Presets.

**Added in triage (2026-11-07, from [review 14](../reviews/2026-11-07/14-ear-stand-in.md) over all 142 Presets, decided by the owner (2026-11-07, "Yes to both")):** its full table is this issue's baseline.

4. **Resonance Swell passes the limiter,** the one Preset that does: 1.48 on D6, 1.11 on D#6, 0.90 on D5, 2.5 s into a held Note when its LFO's Resonance peaks on a Harmonic at its fixed 1.2 kHz Cutoff; D6 at 0 dBFS, 16 dB over its C4, with jumps up to 6.6 dB between neighbouring semitones.
5. **Three Filter lessons swing across the keyboard:** High-pass Buzz climbs 12.8 dB from C2 to C6, 12 vs 24 falls 8.2 dB (21 dB to C7), Resonant Ring rises 16 dB around E6 and F6, where its fundamental meets the 1.4 kHz resonant Cutoff.
6. **Seven sounds swing 6.5 to 9 dB from C2 to C6:** Cowbell, Dark Drone, Talking Filter, Wah, Deep Sweep, Laser and Clav (whose C2 plays at −36.1 dBFS through its high-pass).
7. **Three Pads fade in the top octave:** from C6 to C7 Sweep Pad loses 33 dB, Breathing Pad 28, Dark Drone 28, a fixed Cutoff leaving little of a C7.

## Agent Brief

**Category:** bug
**Summary:** Resonance Swell passes the limiter, some fourteen Presets swing too much in level across the keyboard or fade in its top octave, the Drums are too quiet beside the Basses, and Felt Piano's words claim a Velocity brightness nobody hears.

**Current behavior:** As the seven items above say.

**Desired behavior:**
- Vowel, Breathing Pad, Two Speeds and Sweep Pad within the swing the other Presets keep from C2 to C6, Vowel level with the Filter Presets on C4, each keeping its character (review 15's renders are a start).
- Resonance Swell under the limiter on every Note, its neighbouring semitones without jumps; the Filter lessons, the seven sounds and the three Pads within the swing the others keep, each lesson still showing what it teaches.
- The Drums' median within a few dB of the Basses', the Kick at full Volume near 808 Boom.
- Felt Piano either brighter on a harder Note, heard and measured, or its words no longer saying so.
- The Presets' level tests hold every changed Preset where it now sits.

**Key interfaces:**
- The factory Presets' settings and words
- The Presets' level tests

**Acceptance criteria:**
- [ ] The level tests cover C2 to C6 for the four Presets and the Drums against the Basses
- [ ] Felt Piano's Velocity claim measured or gone
- [ ] A test: Resonance Swell's peak under the limiter's 0.8 from C2 to C7, held 4 s
- [ ] A list of every changed Preset for the owner's ear, with what changed

**Out of scope:** Presets not named here (review 14's table lists them all); the band-pass's make-up ([231](./231-a-band-pass-not-so-much-quieter.md)'s, done).
