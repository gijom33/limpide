# 258: Preset levels across the keyboard

**What to build:** Review 15's findings on 1.26.1, two with review 2 (the inbox, 2026-11-07; [15](../reviews/2026-11-07/15-sound-designer.md), [2](../reviews/2026-11-07/2-synth-enthusiast.md)):

1. **Vowel, Breathing Pad, Two Speeds and Sweep Pad swing 12 to 18 dB between C2 and C6;** Vowel sits 12.9 dB under the Filter Presets on C4 and sounds broken when stepping through Presets (reviews 15 and 2; renders of a fix in review 15's report).
2. **The Drums sit 9 dB under the Basses** (median −25.6 dBFS against −16.4), the Kick at full Volume already at −27.2 against 808 Boom's −15.5 (review 15).
3. **Felt Piano says a harder Note is brighter;** soft over hard measures 0.99, the last of 1.16.0's seven unheard Velocity claims (review 15).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues). Then ready-for-human: the owner's ear on the changed Presets.

## Agent Brief

**Category:** bug
**Summary:** Four Presets swing too much in level across the keyboard, the Drums are too quiet beside the Basses, and Felt Piano's words claim a Velocity brightness nobody hears.

**Current behavior:** As the three items above say.

**Desired behavior:**
- Vowel, Breathing Pad, Two Speeds and Sweep Pad within the swing the other Presets keep from C2 to C6, Vowel level with the Filter Presets on C4, each keeping its character (review 15's renders are a start).
- The Drums' median within a few dB of the Basses', the Kick at full Volume near 808 Boom.
- Felt Piano either brighter on a harder Note, heard and measured, or its words no longer saying so.
- The Presets' level tests hold every changed Preset where it now sits.

**Key interfaces:**
- The factory Presets' settings and words
- The Presets' level tests

**Acceptance criteria:**
- [ ] The level tests cover C2 to C6 for the four Presets and the Drums against the Basses
- [ ] Felt Piano's Velocity claim measured or gone
- [ ] A list of every changed Preset for the owner's ear, with what changed

**Out of scope:** Presets not named here; the band-pass's make-up ([231](./231-a-band-pass-not-so-much-quieter.md)'s, done).
