# 218: A change writes only what it changes

**What to build:** Part (b) of [183](./183-fewer-writes-per-change.md), split by the owner on 2026-11-03: review 18's finding 2 on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that each Demo knob tick rewrites the whole Patch, about 10,600 AudioParam calls a second. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

From 183 (Claude's calls, open to the owner, 2026-11-02):

1. **One write per parameter and frame** at most, and only of what changed.

Claude's call, open to the owner (2026-11-03):

2. **Where the writes are gathered into one a frame,** in the engine or before it, is settled first, written in the issue with the reason, before the rest is built.

## Agent Brief

**Category:** enhancement
**Summary:** A change to one control writes every parameter of every Voice, and the Demo's knob moves do so 25 times a second.

**Current behavior:** Applying a Patch writes every AudioParam of all 8 Voices on each change; the Demo's 40 ms tick applies it each time.

**Desired behavior:**
- A change writes only the parameters it changes, at most once a frame each.
- The sound is the same as now, and the Modulation model still mirrors it (ADR-0003).
- A whole new Patch (a Preset loaded, Init, a Tutorial's Step) is still written whole.

**Key interfaces:**
- The engine's applying of a Patch
- The Demo's knob tick

**Acceptance criteria:**
- [ ] An engine test counting writes: a Demo knob tick writes only the changed parameters
- [ ] The Demo's calls a second measured before and after, the figures in the issue
- [ ] The Modulation model matches the sound in the engine tests; every test passes

**Out of scope:**
- Aftertouch ([219](./219-aftertouch-glides.md))
- The MIDI Activity line ([217](./217-a-midi-message-redraws-only-the-midi-panel.md))
