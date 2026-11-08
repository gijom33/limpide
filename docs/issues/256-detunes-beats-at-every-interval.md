# 256: Detune's beats at every interval

**What to build:** Review 19's finding on 1.26.1 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/19-synth-geek.md)): Detune's "beats" readout in the Synth Geek Layer is wrong unless Osc 2 is in unison or above. An octave down at +10 ¢ it says 1.27 Hz, the sound beats at 2.55; Semitone +7 at 0 ¢ it says 0.00 Hz, the fifth beats at 1.49 (rendered). The readout takes Δf = f·(2^(c/1200) − 1) at Osc 2's own pitch ([167](./167-geek-numbers-osc2-and-noise.md)), which holds only where the two fundamentals meet.

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; released in 1.27.0. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** Detune's beats readout gives the wrong rate when Osc 2 is an octave down or a fifth or another interval away.

**Current behavior:** The readout is right at unison and above in octaves only; elsewhere it gives a rate the ear does not hear.

**Desired behavior:**
- The readout gives the rate the sound beats at: that of the lowest pair of Harmonics of the two Oscillators that nearly coincide (for Osc 2 at ratio p/q to Osc 1, the beat between Osc 1's p-th Harmonic and Osc 2's q-th; corrected 2026-11-07, it read q-th and p-th, which do not meet: the fifth's 3/2 is Osc 1's 3rd against Osc 2's 2nd), with the Fine and Semitone and Octave settings together, at the last Note.
- Its formula in the tip says so, in the same terms.
- Where no near pair is close enough to be heard as beating (a few tens of Hz or more), the readout says so rather than a number.

**Key interfaces:**
- The Geek Layer's Detune readout and its formula
- Its words on a phone

**Acceptance criteria:**
- [x] Unit tests: unison +10 ¢, an octave down +10 ¢, Semitone +7 at 0 ¢ and +10 ¢, against renders of the two Oscillators' beating
- [x] The readout's words fit where they do now, phones included

**Out of scope:** the other Geek readouts (review 19's table waits for the owner, [262](./262-v2-ideas-from-the-1-26-1-round.md)).

## How it was built

- **The readout:** with the Synth Geek Layer on, Detune reads the beats of the lowest pair of the two Oscillators' Harmonics that nearly coincide: Osc 1's pth against Osc 2's qth, f₂ / f₁ near p / q, Δf = |p f₁ − q f₂|, at the last Note played (A4 before any, said), with Osc 2's Octave, Semitone and Detune and Osc 1's Octave together. At A4 and +10 ¢: 2.55 Hz in unison, 5.10 Hz an octave up, 2.55 Hz an octave down (it read 1.27); Semitone +7 reads 1.49 Hz at 0 ¢ (it read 0.00) and 6.15 Hz at +10 ¢; the tempered major third 17.5 Hz.
- **No beats:** where no pair is heard beating it reads "no beats" ("no beats at A4" before a Note; "no beats" alone in the name's place on a phone), as for a semitone, or 50 ¢ in unison an octave above A4 (25.7 Hz).
- **The tip:** Under the hood now gives Δf = |p f₁ − q f₂|, its letters said, with 1/1 in unison, 1/2 an octave down and 3/2 a fifth up, and where it reads no beats.
- **Held to the engine:** engine tests render two Saws at A4 in unison and an octave down at +10 ¢, and a fifth up at 0 and +10 ¢, measure how fast the partials where the pair meets (440 Hz, 1320 Hz) swell and fade, and check the readout within 0.02 Hz. Against the old readout three of the four fail (it was off by 1.28, 1.49 and 2.33 Hz). Unit tests hold the other cases, the Waveforms and "no beats".
- **Fits:** the widest Detune can now read is "20.0 Hz beats" and "no beats at A4", which size its column in place of "9999 Hz beats"; issue 207's spec checks "no beats" in the name's place too, at 320 to 860 px, clear of Env Amount's name, no knob moving.
- **Calls open to the owner** (all Claude's call):
  1. **"Nearly coincide" is within a quarter-tone** (50 ¢, Detune's reach), so Detune at its ends keeps the unison or octave pair.
  2. **Heard as beating below 20 Hz:** at 20 Hz or faster it reads "no beats", as such beats blur into roughness. The brief said "a few tens of Hz"; 30 would keep more figures (50 ¢ in unison reads up to about A5).
  3. **The lowest pair decides:** if it beats 20 Hz or faster, "no beats", even where a higher pair of a different ratio beats slower (Semitone −3 at +20 ¢: the 5th and 6th beat 45.8 Hz, the 6th and 7th 19.95 Hz). The review asked for the slowest; the brief for the lowest, which is the louder pair.
  4. **Harmonics up to the 8th,** under 20 kHz, and only those the Waveforms have, within 40 dB of their loudest: two Squares a fifth apart, or two Sines an octave apart, read "no beats" (their pairs are missing), as do Osc 2 four or five octaves from Osc 1.
  5. **"no beats", not a dash:** the figure says it, so a phone, which shows the figure alone, says it too.
  6. **Still left out,** as before: the Mixer's levels (Osc 1 at 0 still reads beats), FM, Ring, the Sub, the LFOs, aftertouch and Env Amount.
  7. **The brief's letters:** its "Osc 1's q-th against Osc 2's p-th" was the wrong way round; corrected above, the code and tip using Osc 1's pth and Osc 2's qth.
- **Tests run:** `npx tsc`, `npm run lint`; the Geek and UI unit tests (437 passed) and the engine's Synth Geek tests (9 passed); in Chromium and WebKit the Geek, tooltips, touch tips, overlays, keyboard access and fits-the-screen specs (106 passed in Chromium; 100 passed, 5 skipped in WebKit), and the Geek, tooltips and touch tips specs again after the review's fixes (69 passed, 5 skipped). Issue 207's width spec failed in WebKit at first: each width opened on the knobs the last had autosaved; it now opens each on Init.
- **Reviewed** with the code-review skill (standards and spec): a Harmonic now counts only within 40 dB of its Waveform's loudest (a Pulse near 50 % no longer beats on a 2nd Harmonic 50 dB down), a rate rounding up to 10 reads "10.0 Hz", not the wider "10.00 Hz", the thresholds are named, and issues 167, 133 and 207 got a dated line.
- **To try:** turn the Synth Geek Layer on, raise Osc 2 in the Mixer and open Osc 2. With Detune at +10 ¢, play A4 and turn the Octave down: it reads 2.55 Hz, and the sound swells at that rate. Set Detune to 0 and Semitone to +7: it reads 1.49 Hz, and the fifth beats slowly. Turn Semitone to +1: "no beats". Hover Detune for its formula. On a phone, turn Detune: its figure, or "no beats", in the name's place.
