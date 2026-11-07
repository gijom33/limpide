# 256: Detune's beats at every interval

**What to build:** Review 19's finding on 1.26.1 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/19-synth-geek.md)): Detune's "beats" readout in the Synth Geek Layer is wrong unless Osc 2 is in unison or above. An octave down at +10 ¢ it says 1.27 Hz, the sound beats at 2.55; Semitone +7 at 0 ¢ it says 0.00 Hz, the fifth beats at 1.49 (rendered). The readout takes Δf = f·(2^(c/1200) − 1) at Osc 2's own pitch ([167](./167-geek-numbers-osc2-and-noise.md)), which holds only where the two fundamentals meet.

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** Detune's beats readout gives the wrong rate when Osc 2 is an octave down or a fifth or another interval away.

**Current behavior:** The readout is right at unison and above in octaves only; elsewhere it gives a rate the ear does not hear.

**Desired behavior:**
- The readout gives the rate the sound beats at: that of the lowest pair of Harmonics of the two Oscillators that nearly coincide (for Osc 2 at ratio p/q to Osc 1, the beat between Osc 1's q-th Harmonic and Osc 2's p-th), with the Fine and Semitone and Octave settings together, at the last Note.
- Its formula in the tip says so, in the same terms.
- Where no near pair is close enough to be heard as beating (a few tens of Hz or more), the readout says so rather than a number.

**Key interfaces:**
- The Geek Layer's Detune readout and its formula
- Its words on a phone

**Acceptance criteria:**
- [ ] Unit tests: unison +10 ¢, an octave down +10 ¢, Semitone +7 at 0 ¢ and +10 ¢, against renders of the two Oscillators' beating
- [ ] The readout's words fit where they do now, phones included

**Out of scope:** the other Geek readouts (review 19's table waits for the owner, [262](./262-v2-ideas-from-the-1-26-1-round.md)).
