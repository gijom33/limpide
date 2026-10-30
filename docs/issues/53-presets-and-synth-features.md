# 53: Presets and synth features

**What to build:** From the synth enthusiast ([review 2](../reviews/2026-10-26/2-synth-enthusiast.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-27)

**Since then:** (2026-10-30, [issue 105](./105-header-and-panels-on-every-screen.md)) a stepped knob (an Octave, Osc 2's Semitone) moves one step for each notch's worth of scroll, small trackpad scrolls adding up to it; a notch's 4 % rounded back to the same Octave. Other knobs and faders still turn 4 % a notch.

- [x] Pads and keys Presets with Voices to play chords: 7 of the 9 Pads (Pad, PWM Strings, Warm Pad, Brass Swell, Choir, Sweep Pad, Dark Drone), Organ, Electric Piano, Marimba, Glass Keys, Harp and Clav are at 1 Voice. A Presets test that a chordal Preset has more than one. Done: all twelve at 8 Voices; Dark Drone stays on one, a drone being one Note. `presets.test.ts` holds every Pad but the drone, every Piano and the six keys above one Voice
- [x] A share link keeps the Patch name (it opens as "Shared Patch")
- [x] The mouse wheel turns a knob under the pointer
- [x] A gentler Glide taper (Off to 6 ms in its first 40 px)
- [x] Quick Setup starts at Cutoff
- [x] LFO tempo sync and an Amp (tremolo) destination: to grill against the PRD's scope first. Grilled on 2026-10-27: tremolo built as Volume, tempo sync left out (Decisions below)

How the rest was done (2026-10-27):

- Share links carry the name after the sound: `#p=…&n=Pure%20Sine`. A link from before opens as "Shared Patch", as it did; "Last session" is never sent as a name.
- The wheel, or a two-finger scroll, over a knob's dial or a fader's track turns it (4 % a notch, Shift for fine) and does not scroll the page; elsewhere the page scrolls as before.
- Glide reaches 2 s (it reached 10) on a square taper: a fifth of the travel is about 80 ms, half about half a second. Every Preset's Glide (0.5 s at most) keeps its value.
- Quick Setup starts with the Filter's three knobs, then follows the page.

## Decisions (grilling, 2026-10-27, decided by the owner)

1. **Tremolo: yes, as a seventh LFO destination, Volume**, in the Amp's group of the menu. Depth pulls the volume down from where the Amp Envelope has it, never above it: at full Depth the wave's foot is silence. Two LFOs on Volume share the dip. Its pictures are the ones that already move: the Amp Tap's Scope and Spectrum, and the Timeline's Amp Envelope, which ripples with it (reversed by the owner, 2026-10-28: the Timeline draws the Amp Envelope alone). No ring, since the Amp has no level knob. This reverses issue 26's "no clean picture".
2. **LFO tempo sync: left out.** Limpide keeps no tempo: a BPM control, MIDI clock or the Hold rhythm would each bring in a concept the PRD lacks, for a feature that matters beside a sequencer, which the PRD leaves out. In the PRD's Out of Scope.

How Volume was built: `tremolo` in `src/modulation/modulationModel.ts` (the model: 1 less the LFOs' total swing, plus each swing times its LFO, each swing half its Depth); in the engine a gain after each Voice's Amp, fed a shared resting level and each LFO's swing, which the Amp Tap listens after; `Modulation.volume`, which the Timeline multiplies into the Amp Envelope it draws. Tests: the model (`modulationModel.test.ts`), the sound, the Amp Tap and the model together (`synthEngine.browser.test.ts`), the menu and the Timeline (`e2e/lfoDestination.spec.ts`, `e2e/envelopes.spec.ts`).

