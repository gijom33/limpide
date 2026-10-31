# 109: Teaching FM, Ring, the Sub and Pink Noise

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 5, [report](../reviews/2026-10-30/5-learner-teacher.md)):

- No Tutorial teaches FM, Ring, the Sub or Pink Noise; a learner meets 1.16.0's features only through long tips and about 8 s of Demo. A loaded Preset's about line ("Turn FM down and watch the rungs fold away") shows only on hover in the Patch panel.
- The Maths Layer ignores FM and Ring: it still writes a saw's series (bₙ = 2 / (π n)) under a Spectrum that no longer follows it, with nothing for sidebands or sum and difference.

The owner's own idea in the inbox (2026-10-30, "Add tutorial for FM and ring presets") and a line of Claude's brainstorm say the same; they stay in the inbox until the owner triages them, and would join this issue.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. The owner accepted the three answers (decisions below). The three Tutorials are built (2026-10-30, below); the Maths Layer and the about line are not.

## Questions for the owner

1. **Which Tutorials?** Claude's recommendation: three, each built from Init on an existing Preset: FM Ladder (FM, two sines making a ladder), Ring Bell (Ring, two notes neither of which you hear), and Sub Two Down with Pink Surf's Noise (the Sub and the Noise colour in one).
2. **The Maths Layer under FM and Ring:** write the rule that holds (for FM, the sidebands at the Note ± whole multiples of Osc 2, their sizes by Bessel functions; for Ring, the sum and the difference), and say plainly when the saw's series no longer applies? Claude's recommendation: yes.
3. **A loaded Preset's about line:** show it somewhere once loaded, not only on hover in the Patch panel (under the Patch name for a few seconds, or in the Patch panel's open row)? Claude's recommendation: under the Patch name until the first knob is turned.

## Decisions (triage, 2026-10-30, decided by the owner)

1. Three Tutorials, each built from Init: FM Ladder (FM), Ring Bell (Ring), and Sub Two Down with Pink Surf's Noise (the Sub and the Noise colour).
2. The Maths Layer writes the rule that holds under FM (sidebands at the Note ± whole multiples of Osc 2, sized by Bessel functions) and Ring (the sum and the difference), and says when the saw's series no longer applies.
3. A loaded Preset's about line shows under the Patch name until the first knob is turned.

## Agent Brief

**Category:** enhancement
**Summary:** A learner can learn FM, Ring, the Sub and the Noise colour by Tutorial, read their maths, and see a Preset's about line once loaded.

**Desired behavior:**
- **Three Tutorials**, opened from their Presets' rows in the Patches panel like the others: FM Ladder, Ring Bell, and a Sub-and-Noise one ending on a Preset of its own or on Sub Two Down with Pink Noise (the agent's call, said in this issue's notes). Each Step turns one control from Init and says what to hear and where to look, as the existing Tutorials do; "Do it for me" ends on the Preset's sound.
- **Maths Layer:** with FM up, it gives FM's sideband rule with the figures for the current knobs; with Ring up, the sum and difference of the two pitches; with either up, the saw's (or square's) series is shown only for what still follows it, or marked as no longer holding.
- **About line:** loading a Preset shows its about line under the Patch name, until a knob or fader is turned or another Patch loaded.

**Key interfaces:**
- The Tutorial list and its Steps
- The Maths Layer's Oscillator lines
- The Patch picker

**Acceptance criteria:**
- [x] Each new Tutorial passes the existing Tutorial tests (every Step's control in view on every layout, "Do it for me" to the end gives the Preset)
- [x] Each Tutorial's words are checked against the engine before the push
- [ ] With FM 50 % or Ring 100 % the Maths Layer no longer states the saw's series as the sound's
- [ ] Loading a Preset shows its about line; turning a knob hides it

**Out of scope:**
- The owner's own Tutorial idea and the brainstorm's line in the inbox, until the owner triages them

## Added in triage (2026-10-30)

- The owner's idea (inbox, 2026-10-30), "Add tutorial for FM and ring presets", is answered by decision 1: the FM Ladder and Ring Bell Tutorials.
- Claude's brainstorm line (inbox, 2026-10-30) also names the LFO on FM. No fourth Tutorial: Breathing Bell's about line, shown under the Patch name by decision 3, points at it. Claude's call, open to the owner.

## How it was built

**The Tutorials (2026-10-30).** In `src/tutorial/tutorials.ts`, after Wobble, so the header's list and the Patches panel's Tutorials row show them last:

- **FM Ladder**, 6 Steps: Osc 1 a Sine (one spike), Osc 2 a Sine (silent, its fader down: heard only through FM), FM to 50 % (the ladder), then the Filter opened (Cutoff 20 kHz, Resonance 0) and the Amp's Sustain full.
- **Ring Bell**, 11 Steps: the two Sines, Osc 2 an octave up, Ring up (3 times the Note appears, and 1 times under Osc 1's own), Semitone +3 (the sum and difference leave the ladder), Osc 1 down (neither pitch heard), the Filter opened, then the bell's Envelope (Sustain 0, Decay and Release 1.8 s). Ring comes before the Semitone so its sum and difference are first heard on the ladder, then leave it.
- **Deep Breath**, 8 Steps: the Sub up (a square an octave down), its Octave −2, its Waveform Sine, the Noise up to 30 % (White, a level floor), its Colour Pink (the floor tilts), the Filter opened, the Sustain full. A Preset of its own in Shapes, after Sub Two Down: Sub Two Down with Pink Noise at 30 %, since a Tutorial must end on its Preset exactly and Sub Two Down has no Noise. Claude's call, open to the owner.

Each one's Steps rebuild its Preset from Init (the unit test); in Playwright, each Step's control and Viewer come clear of the header and the card on the two phones and the 2 × 2, and "Do it for me" to the end names the Patch after the Preset (now checked for all seven). The notes' claims are rendered offline at the Step that makes them (`src/patch/presets.browser.test.ts`): FM's rungs, Ring's sum and difference on and off the ladder with neither pitch left, the Sub's rungs two octaves down as a square and as a sine; Pink's fall and equal loudness were already tested in the engine. Deep Breath's level sits within 3 dB of the Shapes.
