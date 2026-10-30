# 94: The Oscillators restart on each Note

**What to build:** Osc 1, Osc 2 and the Sub start their cycles together on every Note, so a Patch always sounds the same and the Ideal can say exactly what Ring makes of two Oscillators in tune. Today they run free from when the page loads: retune Osc 2 and bring it back, and it comes back at another point of its cycle against Osc 1. Two in-tune Squares through Ring measured from near silence (Harmonic 2 at 0.001) to a full buzz (0.206) with the same knobs, depending on how long Osc 2 had been a semitone up. The owner's bug and call (inbox, 2026-10-29).

**Blocked by:** none

**Status:** done (2026-10-29). Each Note starts Osc 1, Osc 2 and the Sub together at the start of their cycles, so a Patch sounds the same whatever came before; with Osc 2 a whole number of octaves from Osc 1, the Ideal draws Ring's partials from the two waves' product, so two in-tune Squares draw none, as they sound. Not yet heard by the owner.

**Since then:** the 1.16.0 review found that a legato Note restarted them all the same (one Voice, a key pressed while another is held, sent a Note On, which always restarted); fixed 2026-10-30, with an engine test that the wave carries on with no jump.

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
- [x] Two in-tune Squares through Ring sound the same (Harmonic 2 within a hair) whether or not Osc 2 was retuned and brought back before the Note (engine test)
- [x] Osc 1 and Osc 2 each sound at their pitch after a restart, Glide and the LFOs still move them (existing engine tests pass)
- [x] The Ideal draws no Ring partial for two in-tune Squares, two in-tune Saws as their product (a parabola, every Harmonic at 1/n²), and still the sum and difference for a fifth (unit tests)
- [x] The Ring diamonds match the engine's Ring for Osc 2 an octave up (engine test against the Ideal)

**Out of scope:**
- A switch between free-running and restarting Oscillators
- Making Osc 1 + Osc 2's own diamonds exact when in tune (they keep their own levels)
- Hard Sync

## Decisions

1. The Oscillators restart on each Note, decided by the owner (of two ways: restarting, or free-running with the Ring diamonds an average and a tooltip saying so).
2. A legato pitch change, sliding from a held Note, does not restart them: it would click mid-sound. Claude's call, open to the owner.
3. The Sub restarts with them, so its alignment with Osc 1 is fixed too. Claude's call, open to the owner.

## How it was built

- **The engine.** An OscillatorNode cannot be reset, so on each Note a new one takes over, as a retriggered LFO's does. Each Oscillator (and the Sub) is a small restartable source: two constant sources that stay for the Voice's life carry its frequency and its detune, and every pitch input (the Note and its Glide, the Octaves and Tuning, the LFOs, the bend, FM, the Filter Envelope on Osc 2) reaches them, so a restart rewires only the node. A legato pitch change does not restart them (decision 2).
- **A pulse after a restart.** The pulse is a saw less a delayed copy of itself, and the delay still holds the old cycle for one width after a restart: a fraction of a cycle, inside the Note's attack.
- **The Ideal.** In tune by whole octaves, Ring's partials come from one cycle of the two waves as the engine plays them (their unending shapes at the engine's scale, a pulse built the engine's way), multiplied and Fourier-transformed, kept by their arguments (10 to 20 ms when the waves change, under a millisecond after). Otherwise the sums and differences add as power, as before.
- **Tests.** The red test (Harmonic 2 of two in-tune Squares through Ring, with and without Osc 2 retuned before the Note) went from 14.6 dB apart to within 0.5 dB. A Square times a Square an octave up matches the Ideal within 0.5 dB on the odd Harmonics, the even ones cancelling. Three engine tests needed looser measures, none a change in the sound: two Tap tests measured 110 Hz beside a 164.8 Hz saw with a rectangular window, whose leakage moved from −32 to −28 dB as the restart moved the saw's cycle (Hann-windowed now, as the file's other tone tests are); "silent before the Gate" read 2.5e-17, the limiter's oversampling spreading the Note's first samples 64 back (the Amp Tap is silent until the Gate).
