# 97: FM as an LFO target

**What to build:** Either LFO can aim at FM, so a slow LFO makes a bell or a growl whose brightness breathes: the sidebands grow and shrink on the Spectrum. The owner asked "Should we extend the list of targets the LFOs can reach?" (inbox, 2026-10-29); FM is the one target added, as the one that shows something none of the seven others does.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** Add FM to the LFO Destinations, swinging FM as an LFO swings Resonance, with one Preset that shows it.

**Current behavior:**
- An LFO reaches seven Destinations: Pitch, Osc 2 Pitch, Detune, Pulse Width, Cutoff, Resonance, Volume.
- FM (Osc 2 swinging Osc 1's frequency, 0 to 100 %, an index of 4 at full) is set by its knob alone.

**Desired behavior:**
- **FM** is an eighth Destination, after Pulse Width, in the Oscillators' colour, in the menu, the arrows' order, Patches, Share links and Tutorials alike.
- An LFO on FM swings it as one swings Resonance: at full Depth up to 100 % each way, but never further than FM can go both ways inside 0 to 100 % (at FM 50 %, the whole range; at FM 0, nothing). Both LFOs on FM add, within the same limits.
- The sound follows: Osc 1's frequency swing (FM × 4 × Osc 2's frequency, the same index on every Note) moves with the LFO, on every Voice, following Glide as the knob's does.
- The FM knob shows the LFOs' reach and a live dot, as every Destination's knob does; the Timeline draws FM's broken line and names it in the key.
- The Ideal Reference keeps drawing FM's sidebands at the knob's setting, not the swung value: the Spectrum moving against still marks is what the LFO does, as with Pulse Width.
- The FM tooltip says an LFO on FM needs FM above 0 to move it.
- One new Preset shows it: a bell whose brightness breathes with a slow LFO 1 on FM. The Demo is unchanged.
- An old Patch or Share link loads as before.

**Key interfaces:**
- The one list of LFO Destinations (its order, label, stage and knob)
- The LFO laws: how far one LFO at full Depth swings each Destination, and the room it keeps
- The engine's FM depth per Voice
- The Presets

**Acceptance criteria:**
- [ ] FM is listed after Pulse Width, and the arrows step to it and past it
- [ ] Unit: at FM 50 % and full Depth the swing reaches 0 and 100 %; at FM 0 it is 0; at FM 80 % it stops at 100 %
- [ ] Engine test: with LFO 1 on FM, a sideband's level rises and falls with the LFO (absent at the trough when it reaches 0)
- [ ] The FM knob draws the LFO's ring and dot; the Timeline shows FM in its key
- [ ] The Ideal's marks stay put while the LFO swings FM
- [ ] The new Preset loads, plays and shows the swing; every existing test passes

**Out of scope:**
- Any other new Destination (a Mixer level, one LFO moving the other: the PRD keeps out a modulation matrix)
- The Ideal following the swing
- The Demo

## Decisions (grilling, 2026-10-29, decided by the owner)

1. One target, FM; others wait until a Preset or the Demo needs them; no LFO moving the other LFO (the PRD's "no modulation matrix beyond two LFOs with a single destination each").
2. The swing as Resonance's: up to 100 % at full Depth, kept inside 0 to 100 % both ways, so nothing at FM 0; the tip says to raise FM first.
3. The Ideal stays on the knob's FM, as with Pulse Width.
4. Named FM, after Pulse Width, in the Oscillators' colour.
5. One Preset to show it; the Demo unchanged. Its name and sound: Claude's call, open to the owner.
