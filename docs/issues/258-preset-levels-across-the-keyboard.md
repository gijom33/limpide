# 258: Preset levels across the keyboard

**What to build:** Review 15's findings on 1.26.1, two with review 2 (the inbox, 2026-11-07; [15](../reviews/2026-11-07/15-sound-designer.md), [2](../reviews/2026-11-07/2-synth-enthusiast.md)):

1. **Vowel, Breathing Pad, Two Speeds and Sweep Pad swing 12 to 18 dB between C2 and C6;** Vowel sits 12.9 dB under the Filter Presets on C4 and sounds broken when stepping through Presets (reviews 15 and 2; renders of a fix in review 15's report).
2. **The Drums sit 9 dB under the Basses** (median −25.6 dBFS against −16.4), the Kick at full Volume already at −27.2 against 808 Boom's −15.5 (review 15).
3. **Felt Piano says a harder Note is brighter;** soft over hard measures 0.99, the last of 1.16.0's seven unheard Velocity claims (review 15).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; ships with the next release. Left: the owner's ear on the changed Presets (the list below), Felt Piano's among them: its Velocity on the Cutoff went from 0.8 to 0.2, where call 5 says its sound stays (the 1.27.0 code review, 2026-11-07). In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

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
- [x] The level tests cover C2 to C6 for the four Presets and the Drums against the Basses
- [x] Felt Piano's Velocity claim measured or gone
- [x] A test: Resonance Swell's peak under the limiter's 0.8 from C2 to C7, held 4 s
- [x] A list of every changed Preset for the owner's ear, with what changed

**Out of scope:** Presets not named here (review 14's table lists them all); the band-pass's make-up ([231](./231-a-band-pass-not-so-much-quieter.md)'s, done).

## How it was built

Built at night (2026-11-07), test-first, in the Presets' level tests (`src/patch/presets.browser.test.ts`): every new test failed before the Presets changed, and passes after.

**What was built:**

- **Key Track on the fourteen Presets whose fixed Cutoff the Notes climbed into or away from.** Its centre is C4, so each plays on C4 as it did; from C2 to C6 each now keeps within 6 dB, octave by octave, where the other Presets keep theirs. The three Pads' C7 is within 6 dB of their C4.
- **Resonance Swell at full Key Track:** its Cutoff stays the same distance above every Note, so the swelling peak never lands on a Harmonic. On every semitone from C2 to C7, held 4 s, its peak is 0.38 at most (1.48 before, on D6), and neighbouring semitones are within 0.1 dB of each other.
- **Vowel level with the Filter lessons on C4:** Volume 0.45, no longer kept apart by 12.5 dB.
- **The Drums brought up to the Basses:** the Kick and the Tom sing on Pink Noise, whose weight lies low where their Filters ring; the rest of the kit plays at full Volume (Cowbell at 0.42), some with its mix raised. The kit's median on C4 is −20.0 dBFS, against the Basses' −16.4 on C2 (−25.6 before). The Kick is at −17.6, 2.1 dB under 808 Boom (11.7 before).
- **Felt Piano's words:** "Velocity makes a harder Note louder, hardly brighter: the felt hides the strike." Its Velocity on the Cutoff went from 0.8 to 0.2, so the line drawn from its settings no longer says "brighter played harder" either. The test measures it: a hard Note is more than 6 dB louder than a soft one, with its brightness (centroid) within 5 %.
- **The tests hold them:** each of the fourteen within 6 dB from C2 to C6; the three Pads' C7; Resonance Swell and Resonant Ring on all 61 semitones held 4 s, under 0.8 and within 1.5 dB of the next; the Drums' median within 4 dB of the Basses', the Kick within 3 dB of 808 Boom; Hi-hat's peak within 2 dB of the Open Hat's; and each Preset whose level on C4 changed, within 1 dB of where it now sits. Issue 231's "as before" check now holds the five band-pass Presets left as they were.

**Every changed Preset, for the owner's ear** (the loudest 100 ms of a Note held through its Attack and a second, dBFS, as review 14 measures; C2 / C4 / C6):

| Preset | What changed | Before | After |
|---|---|---|---|
| Vowel | Volume 0.1 → 0.45, Key Track 0.7; words: Key Track carries the formant most of the way with the Note | −39.4 / −32.6 / −21.3 | −21.6 / −19.5 / −19.0 |
| Breathing Pad | Volume 0.55 → 0.5, Key Track 0.6 | −28.0 / −22.7 / −14.5; C7 −38.3 | −27.1 / −23.5 / −22.1; C7 −22.9 |
| Two Speeds | Key Track 0.8 | −19.2 / −19.0 / −34.8 | −18.9 / −19.0 / −18.7 |
| Sweep Pad | Key Track 0.5 | −27.7 / −23.2 / −20.0; C7 −35.5 | −25.3 / −23.2 / −20.8; C7 −21.4 |
| Resonance Swell | Key Track 1 | −17.4 / −16.3 / −10.1; 0 dBFS and 1.48 on D6 | −16.2 / −16.3 / −16.6; 0.38 at most |
| High-pass Buzz | Key Track 0.7 | −27.3 / −21.4 / −14.5 | −23.0 / −21.4 / −19.6 |
| 12 vs 24 | Key Track 0.7 | −18.9 / −19.4 / −27.2; C7 −39.9 | −19.0 / −19.4 / −19.7; C7 −20.0 |
| Resonant Ring | Key Track 0.7; words: Key Track carries the ring with the Note | −22.6 / −18.7 / −15.9; −6.9 around E6 | −19.9 / −18.7 / −18.5; −15.5 at most |
| Dark Drone | Key Track 0.6 | −24.5 / −22.3 / −16.2; C7 −43.8 | −23.6 / −22.3 / −22.0; C7 −18.9 |
| Talking Filter | Key Track 0.5 → 0.8 | −25.9 / −22.7 / −18.0 | −24.3 / −22.7 / −22.6 |
| Wah | Key Track 0.6 | −29.6 / −24.4 / −22.2 | −26.2 / −24.4 / −21.5 |
| Deep Sweep | Key Track 0.5 | −18.3 / −16.9 / −11.2 | −17.7 / −16.9 / −15.0 |
| Laser | Key Track 0.7 | −28.5 / −22.4 / −21.7 | −26.2 / −22.4 / −21.6 |
| Clav | Key Track 0.8 | −36.1 / −29.5 / −29.6 | −30.1 / −29.5 / −30.2 |
| Kick | Pink Noise, Noise 0.6 → 0.5; words: "sings on Pink Noise" | −27.2 on every Note | −17.6 |
| Tom | Pink Noise, Noise 0.8 → 0.6; words: "Pink Noise for the skin" | −26.2 | −17.6 |
| Snare | Volume 0.8 → 1, Osc 1 (its triangle) 0.5 → 0.8 | −25.6 | −22.3 |
| Open Hat | Volume 0.55 → 1 | −25.6 | −20.4 |
| Ride | Ring 0.7 → 1, Noise 0.35 → 0.7 | −26.0 | −21.0 |
| Cowbell | Volume 0.22 → 0.42, Key Track 0.6 | −30.9 / −25.4 / −21.7 | −21.1 / −19.8 / −15.9 |
| Clang | Volume 0.55 → 1 | −25.4 on C4 | −20.2 |
| Zap Tom | Volume 0.55 → 1, Pink Noise 0.2 → 0.35 | −25.2 | −19.8 |
| Gong | Volume 0.6 → 1, Ring 0.8 → 1 | −25.2 | −19.1 |
| Felt Piano | Velocity on the Cutoff 0.8 → 0.2; words: louder, hardly brighter | −24.7 on C4 | about the same |

Hi-hat is unchanged (−27.2), now kept apart in the tests.

**Claude's calls, open to the owner:**

1. **Key Track as the one lever** for every keyboard swing: each Cutoff stays where it was on C4, so every C4 sounds as before, and the lessons still show what they teach (the high-pass takes the same low Harmonics away on every Note; Resonant Ring rings at the same height above every Note). Vowel keeps its narrow band (Resonance 0.75) at Key Track 0.7, where review 15 rendered Resonance 0.6 at 0.5, which still climbed 7 dB. Its formant now follows the Note most of the way: less a fixed vowel, more a sung one; its words say so.
2. **Pink Noise for the Kick and the Tom, not review 15's rebuild on 808 Boom's recipe:** the same recipe, so the Demo's Kick part still turns its Filter Envelope; the strike may sound a little darker.
3. **The Drums within 4 dB of the Basses, not closer:** at full Volume the short, noisy hits top out about −20 dBFS on this measure. To get there the Snare, Ride, Zap Tom and Gong had their mix raised as well as their Volume, which moves each one's balance (more triangle in the Snare, more Noise in the Ride and Zap Tom, more Ring in the Gong).
4. **Hi-hat kept apart (7 dB under its kit), not reworked:** it is gone in a tenth of a second, so its loudest 100 ms is mostly silence, but its strike peaks within 2 dB of the Open Hat's. Raising it would mean a lower Cutoff or a ringing Resonance, a different hat.
5. **Felt Piano reworded, not reworked:** its sound stays; review 15's rework (a square an octave up) measured only 0.92 soft over hard, "still subtle".
6. **The bounds:** 6 dB from C2 to C6 (review 14 flagged 6.5 and up), a Pad's C7 within 6 dB of its C4. Above C6 some still climb: Vowel's C7 is 5 dB over its C4, Cowbell's C6 and C7 4 to 5 dB over (peak 0.65).
7. **The Demo moves with them:** its intro's Kick is about 10 dB louder, and Sweep Pad's break, chords from A2 up, is a little darker on its low Notes (Key Track 0.5).

**What to try in the app:**

- Step through the Filter lessons with the arrows, Vowel among them: Vowel should be as loud as its neighbours, and still sound like a vowel. Play it from C2 to C6.
- Play Breathing Pad, Sweep Pad and Dark Drone up the whole keyboard, the top octave too, and Two Speeds high up: nothing should vanish or jump out.
- Hold Notes on Resonance Swell from D5 to D#6 for a few seconds: no Note should leap out or press the limiter.
- Play a Bass, then the Kick, then the rest of the kit: the Kick should sit near 808 Boom; listen to the Kick's and the Tom's strike on Pink Noise, and the Snare's, Ride's, Zap Tom's and Gong's balance.
- Felt Piano soft and hard: louder, hardly brighter, as its words now say.
- The Demo: its first bars (the Kick) and the Sweep Pad break.
