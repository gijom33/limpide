# 95: The Oscillators' top Harmonics tapered, so their edges stop ringing

**What to build:** Each Oscillator's top Harmonics fall smoothly to nothing below where the browser cuts them off, so a wave's jumps no longer overshoot and ripple. Two in-tune Oscillators through Ring then make the wave the Ideal draws, not that wave plus a click each cycle. The owner's bug and call (inbox, 2026-10-29).

Today a browser plays an Oscillator's Harmonics only up to about half its sample rate, cutting the rest off sharply, and a sharp cut rings at every jump (about 9 % past the jump, the Gibbs overshoot). Through Ring, where both waves jump at once, the two ripples multiply into a spike each cycle: a Saw times a Square in tune is a triangle with a click on every peak. The click puts energy at every Harmonic, the even ones the triangle lacks and a hiss rising to the top of the Spectrum, none of which the Ideal draws.

**Blocked by:** none

**Status:** needs-triage · bug. Tried and undone (2026-10-29): the taper does not remove the click, see Findings; the owner to choose again.

## Agent Brief

**Category:** bug
**Summary:** Taper every Oscillator's Harmonics smoothly to zero below the browser's cut-off, at each Note's pitch, and taper the Ideal's marks the same way.

**Current behavior:**
- Every Oscillator plays its full series; the browser cuts it at its own limit, and the wave rings at each jump.
- Two in-tune waves through Ring click once a cycle.

**Desired behavior:**
- Each Oscillator (Osc 1, Osc 2, the Sub) plays its series with the Harmonics above a fixed frequency fading smoothly to nothing below the browser's cut-off, for the pitch it plays at the Note's start.
- The fade is a function of a Harmonic's frequency alone, so the Ideal can apply the same one to its marks and stay in line with the Spectrum.
- Levels below the fade are unchanged.

**Acceptance criteria:**
- [ ] A Saw times a Square in tune through Ring: the even Harmonics (the click) at least 20 dB lower than today (engine test)
- [ ] A Saw's Harmonics below the fade at the same level as before (existing engine tests pass)
- [ ] The Ideal's marks fall in the fade as the sound does (unit test)

**Out of scope:**
- Aliasing from FM or from pitch moving far up mid-Note (the browser still stops anything past its limit)
- A switch for the old, sharper top

## Decisions

1. Smooth the clicks out rather than leave them and say so in the Ring tip, decided by the owner. Every Oscillator gets a slightly softer very top, so every Preset changes a little there.

## Findings (2026-10-29)

- Measured before: a Saw times a Square in tune through Ring, its even Harmonics (the click) at −42.5 dB from the fundamental on C3, −36.3 on C4, −29.8 on C5: 6 dB louder each octave up, as a click of fixed length is.
- With every Oscillator's Harmonics faded out from 0.5 to 0.78 of the Nyquist frequency, per Note: −40.7, −34.4, −27.5, slightly worse. Undone.
- The samples show why: the click is one sample where the product drops almost to zero (0.137, 0.019, 0.165), on the cycle's peak, and Saw times Saw and Square times Square show the same. Wherever both waves jump at once, a wave that is band-limited (as every browser Oscillator must be) passes through zero mid-jump, so for that instant their product does too. It is the true product of two band-limited waves, not ringing; a smoother top only lengthens each jump, and the dip with it. Claude's explanation to the owner (the two ripples multiplying) was wrong.
- What is left: draw it (the Ideal's Ring partials from the waves as the browser plays them, cut at the Note's Nyquist, so the even Harmonics get diamonds too), or say it (the Ring tip: a tiny click once a cycle when the two are in tune, which the Ideal leaves out).
