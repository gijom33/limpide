# 88: Ring Modulation in the Mixer

**What to build:** Osc 1 multiplied by Osc 2, mixed in as a fifth source: bell-like and metallic sounds, whose Spectrum shows the sums and differences of the two pitches in place of the pitches themselves. Item 1 of the owner's six Oscillator additions (inbox, 2026-10-29: "Do not include 7 in plan. Implement 1 to 6.").

**Blocked by:** none

**Status:** done (2026-10-29). A Ring fader after Osc 2 mixes in Osc 1 times Osc 2; the Ideal marks its sums and differences with diamonds; the Ring Bell Preset shows it. Not yet listened to by the owner.

## Agent Brief

**Category:** enhancement
**Summary:** A Ring fader in the Mixer mixes in Osc 1 times Osc 2, and the Ideal Reference predicts its partials.

**Current behavior:**
- The Mixer has four sources: Osc 1, Osc 2, the Sub and Noise.

**Desired behavior:**
- A Ring Parameter (0–100 %, off by default) on a fader in the Mixer, after Osc 2: the product of Osc 1 and Osc 2, each with its own Waveform, Pulse Width and tuning, whatever their own Mixer levels, at the Nominal Level times the fader.
- The Ideal Reference marks Ring's partials with a mark of its own: for each pair of Harmonics of the two Oscillators, their sum and their difference, at half the product of their levels.
- Osc 2's tab and Tuning knobs wake up while Ring is up, as they do while Osc 2 is mixed in: Osc 2 is heard through Ring.
- A Preset shows it off.

**Acceptance criteria:**
- [x] Two sines a fifth apart through Ring alone sound at their difference and their sum, with no energy at either pitch (engine test)
- [x] The Ideal's Ring partials for two sines are exactly the sum and the difference, at half the product of the levels (unit test)
- [x] An old Patch or Share link without Ring loads with it off; every existing test passes

**Out of scope:**
- Hard Sync (decided by the owner)
- Ring as an LFO Destination

## Decisions (triage, 2026-10-29)

1. Built with the other five, Hard Sync left out: decided by the owner.
2. Ring is a Mixer source on a fader, not a switch on Osc 2: Claude's call, open to the owner.
3. Ring takes the two Oscillators before their Mixer levels, so Osc 2 can be heard through Ring alone, as on most analogue Ring Modulators: Claude's call, open to the owner.

## How it was built

- **The engine** (`src/engine/synthEngine.ts`): each Voice sends Osc 1's output through a gain whose gain Osc 2's output drives, so the product, before either Mixer level; then the Ring fader at the Nominal Level.
- **The Ideal** (`src/music/idealReference.ts`): `ringPartials`, from the first 16 Harmonics of each Oscillator (enough to read the pattern; all 256 gave tens of thousands of marks), coincident ones adding as power. A new `ring` source, drawn as a diamond (`src/viewers/spectrum.ts`).
- **Osc 2 heard** (`osc2Heard` in `src/patch/patch.ts`): mixed in, through Ring or through Cross Mod; Osc 2's tab badge, its Pulse Width and the Tuning knobs follow it.
- **Ring** joins the Quick Setup's Mixer step, after Osc 2. Tests: "Ring Modulation (issue 88)" in the engine's browser tests and the Ideal's unit tests; Presets: Ring Bell (Intervals).
