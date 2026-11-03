# 202: The Geek Layer's Rate reads as without it

**What to build:** The owner's idea (inbox, 2026-11-02), found trying [137](./137-teaching-tempo-sync.md): "I actually see values in seconds, not Hz. I would keep showing the same values as without geek layer." [169](./169-geek-numbers-lfos-and-key-track.md) made each LFO's Rate read its period with the Synth Geek Layer on ("0.50 s" at 2 Hz, and at a synced 1/4 at 120 BPM); the owner wants the Rate's readout unchanged by the layer. Polish of the Synth Geek Layer for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Decided by the owner, 2026-11-02:

1. **The Rate reads the same with the Synth Geek Layer on as off:** Hz when free, the note value when synced, as today without the layer. This replaces 169's period readout.

Claude's calls, open to the owner:

2. **The period stays under the hood:** the Rate's tip keeps 169's formula (T = 1 / f, or T = beats × 60 / BPM when synced) and 137's conversion with the live numbers, which already end in the period ("one cycle every 0.25 s"), so the layer still teaches it without changing the readout.
3. **Depth and Key Track keep their Geek readouts** (169): the owner's words were about the Rate's values alone.
4. **Held to the engine as before:** 169's engine tests of the period stay, checking the tip's numbers instead of the readout's.

## Agent Brief

**Category:** enhancement
**Summary:** With the Synth Geek Layer on, each LFO's Rate reads as it does with the layer off, in Hz or a note value, not its period in seconds.

**Current behavior:** With the Synth Geek Layer on, an LFO's Rate reads its period: "0.50 s" at 2 Hz, and "0.50 s" for a synced 1/4 at 120 BPM, following the tempo. With the layer off it reads "2.00 Hz", or "1/4" when synced.

**Desired behavior:**
- The Rate's readout is the same with the layer on and off: Hz when free, the note value when synced.
- The Rate's tip with the layer on keeps its Under the hood: the period's formula and, when synced, the conversion with the live tempo and the period.
- Depth's swing and Key Track's Cutoff readouts with the layer on are unchanged.
- The glossary, the Synth Geek Layer's description and any tip or Tutorial words that say the Rate reads a period say what is now true.

**Key interfaces:**
- The LFO Rate's readout and the Synth Geek Layer's setting
- The Rate's tip (Under the hood)
- The Synth Geek Layer's entry in the glossary

**Acceptance criteria:**
- [ ] Geek on, a free Rate at 2 Hz reads "2.00 Hz", as with Geek off
- [ ] Geek on, synced 1/4 at 120 BPM reads "1/4", as with Geek off, and does not change with the tempo
- [ ] Geek on, the Rate's tip still gives the period and its formula, following the tempo when synced
- [ ] Depth and Key Track read as 169 set
- [ ] The engine tests of the period still pass, against the tip's numbers

**Out of scope:**
- The other Synth Geek Layer readouts (167, 168, 170)
- What the Rate reads with the layer off
