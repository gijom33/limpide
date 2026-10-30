# 94: The Oscillators restart on each Note

**What to build:** Osc 1, Osc 2 and the Sub start their cycles together on every Note, so a Patch always sounds the same and the Ideal can say exactly what Ring makes of two Oscillators in tune. Today they run free from when the page loads: retune Osc 2 and bring it back, and it comes back at another point of its cycle against Osc 1. Two in-tune Squares through Ring measured from near silence (Harmonic 2 at 0.001) to a full buzz (0.206) with the same knobs, depending on how long Osc 2 had been a semitone up. The owner's bug and call (inbox, 2026-10-29).

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** Restart the three Oscillators in step on each Note; draw Ring's partials exactly when Osc 2 sits a whole number of octaves from Osc 1.

**Current behavior:**
- The Oscillators start once and run free; their alignment depends on everything played and turned since the page loaded.
- Ring's diamonds add each pair of Harmonics as power, an average over every alignment; with Osc 2 in tune they show a strong series where the sound is near silence.

**Desired behavior:**
- Each Note starts Osc 1, Osc 2 and the Sub at the start of their cycles, at the same moment, as the LFOs restart when retriggered. A Note that slides from the last one (a legato pitch change) does not restart them.
- Everything that moves an Oscillator's pitch keeps moving the new one: the Note and its Glide, the Octaves and Tuning, the LFOs, the bend, FM, the Filter Envelope on Osc 2.
- The same Patch and Note give the same sound whatever was played or turned before.
- With Osc 2 a whole number of octaves from Osc 1 (Semitone and Detune at 0), the Ideal works Ring's partials out from the two waves as they line up at the Note's start, so they cancel where the sound does. Otherwise it keeps today's sums and differences.

**Acceptance criteria:**
- [ ] Two in-tune Squares through Ring sound the same (Harmonic 2 within a hair) whether or not Osc 2 was retuned and brought back before the Note (engine test)
- [ ] Osc 1 and Osc 2 each sound at their pitch after a restart, Glide and the LFOs still move them (existing engine tests pass)
- [ ] The Ideal draws no Ring partial for two in-tune Squares or Saws times themselves beyond what the engine sounds, and still draws the sum and difference for a fifth (unit tests)
- [ ] The Ring diamonds match the engine's Ring for Osc 2 an octave up (engine test against the Ideal)

**Out of scope:**
- A switch between free-running and restarting Oscillators
- Making Osc 1 + Osc 2's own diamonds exact when in tune (they keep their own levels)
- Hard Sync

## Decisions

1. The Oscillators restart on each Note, decided by the owner (of two ways: restarting, or free-running with the Ring diamonds an average and a tooltip saying so).
2. A legato pitch change, sliding from a held Note, does not restart them: it would click mid-sound. Claude's call, open to the owner.
3. The Sub restarts with them, so its alignment with Osc 1 is fixed too. Claude's call, open to the owner.
