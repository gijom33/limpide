# 270: Bead rides an LFO up to 2.5 Hz

**What to build:** The owner's idea (the inbox, 2026-11-08): "make Bid be able to surf up to 2.5 Hz." Bead rides a Sine or a Triangle LFO's plot only at 1 Hz or slower, 141's bound kept by [197](./197-bead-rides-everywhere.md)'s call 5; the bound becomes 2.5 Hz. "Bid" read as Bead, and "surf" as its ride on an LFO's plot, the same board as the Demo's surf.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 as polish of 197's rides, as 264 was of 229's Glow; Claude's call, open to the owner (2026-11-08). The bound is the owner's (decided by the owner, 2026-11-08). Built after 1.27.0, for the next release.

## Decisions

Decided by the owner (2026-11-08, the idea):

1. **Bead rides a Sine or a Triangle up to 2.5 Hz,** with Sync the Hz its note value gives, as now.

Claude's calls, open to the owner (2026-11-08):

2. **The same bound everywhere a ride is decided:** a ride by itself, a ride on a drop, and the Demo's surf's choice of plot where it checks one.
3. **Nothing else of the ride changes:** a Sine or a Triangle only, Depth above 0, 8 to 18 seconds, its lean and its board.

## Agent Brief

**Category:** enhancement
**Summary:** Bead's fastest rideable LFO goes from 1 Hz to 2.5 Hz.

**Current behavior:** Bead rides an LFO's plot only when it is a Sine or a Triangle at 1 Hz or slower; faster, it lands as anywhere.

**Desired behavior:**
- A Sine or a Triangle up to 2.5 Hz is ridden, by itself and on a drop; faster, as now.
- Bead stays on the line at 2.5 Hz, at every layout: its lean and its board keep up with the line, and it does not shake or leave it.
- `docs/bead.md`, CONTEXT.md if it names the bound, and 197 (a Since then line) say 2.5 Hz.

**Key interfaces:**
- The rule that says which LFOs Bead may ride
- Bead's ride along a plot's line

**Acceptance criteria:**
- [ ] A unit test: a Sine at 2.5 Hz is rideable, at 2.6 Hz not; a synced note value at that Hz counts
- [ ] An end-to-end test: Bead dropped near a 2.5 Hz Sine's plot rides its line
- [ ] Bead's ride tests pass as they are

**Out of scope:** a Saw's or a Square's plot; the Demo's acts.
