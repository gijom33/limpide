# 88: Ring Modulation in the Mixer

**What to build:** Osc 1 multiplied by Osc 2, mixed in as a fifth source: bell-like and metallic sounds, whose Spectrum shows the sums and differences of the two pitches in place of the pitches themselves. Item 1 of the owner's six Oscillator additions (inbox, 2026-10-29: "Do not include 7 in plan. Implement 1 to 6.").

**Blocked by:** none

**Status:** ready-for-agent · enhancement

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
- [ ] Two sines a fifth apart through Ring alone sound at their difference and their sum, with no energy at either pitch (engine test)
- [ ] The Ideal's Ring partials for two sines are exactly the sum and the difference, at half the product of the levels (unit test)
- [ ] An old Patch or Share link without Ring loads with it off; every existing test passes

**Out of scope:**
- Hard Sync (decided by the owner)
- Ring as an LFO Destination

## Decisions (triage, 2026-10-29)

1. Built with the other five, Hard Sync left out: decided by the owner.
2. Ring is a Mixer source on a fader, not a switch on Osc 2: Claude's call, open to the owner.
3. Ring takes the two Oscillators before their Mixer levels, so Osc 2 can be heard through Ring alone, as on most analogue Ring Modulators: Claude's call, open to the owner.
