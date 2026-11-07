# 255: MIDI Learn and the C16 say what they do

**What to build:** Findings of the full review round on 1.26.1 (the inbox, 2026-11-07; reviews [17](../reviews/2026-11-07/17-midi-mapping-geek.md) and [2](../reviews/2026-11-07/2-synth-enthusiast.md)):

1. **MIDI Learn takes a control from the C16's layout without saying so:** a learned Cutoff ends bank B's K1, Hold on a pad ends M4 on all banks, the mod wheel ends bank A's K1 and leaves that knob turning the new target the wrong way; the Learn bar says only "Mapped" (review 17, a fake C16).
2. **A factory C16 runs backwards below the middle,** its knobs sending positions (Cutoff turned up from 40 to 48 goes down), and the MIDI panel never says to set them to Relative #1 (review 17).
3. **Pickup gives no cue:** a mapped knob waiting for the hardware to cross its value shows no waiting state, so the Mapping looks dead (review 2, since 1.16.0).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues). To try on the owner's own C16 once built.

**Added in triage (2026-11-07, from [review 12](../reviews/2026-11-07/12-ripple-hunter.md) over the whole app, decided by the owner (2026-11-07, "Yes to both")):**

4. **A learned pitch-bend Mapping is dropped on reload:** stored as CC 128, it fails the stored Mappings' 0 to 127 check.
5. **A Switch learned from a button press cut short is kept as a toggle,** against its comment that nothing is learned; and the MIDI Learn test of every Action's pad leaves out Tap Tempo.

## Agent Brief

**Category:** bug
**Summary:** MIDI Learn silently replaces the C16's layout entries, a factory C16 is not told to use Relative #1, Pickup's waiting is invisible, a pitch-bend Mapping is lost on reload, and a cut-short press learns a Switch.

**Current behavior:** As the five items above say.

**Desired behavior:**
- When a learned Mapping takes a control the C16's layout used, the Learn bar says which ("Mapped; bank B's K1 no longer turns Resonance"), and the knob it took leaves no half-mapping behind that turns its new target the wrong way.
- When a C16 is seen sending absolute positions where its layout expects Relative #1, the MIDI panel says to set the knobs to Relative #1, once, with how.
- A learned pitch-bend Mapping survives a reload; a press too short to tell a toggle from a momentary learns nothing, as its comment says.
- A mapped knob waiting for Pickup shows it is waiting (on its ring, and in its description), until the hardware crosses its value.

**Key interfaces:**
- MIDI Learn's Mapping and the C16 layout's entries
- The Learn bar's words
- The MIDI panel's notices
- Pickup's state on a knob

**Acceptance criteria:**
- [ ] A test with a fake C16: learning Cutoff, Hold and the mod wheel each says what it took, and no knob turns its target backwards after
- [ ] A test: positions from a C16 bring the Relative #1 notice
- [ ] A test: a knob waiting for Pickup shows it, and stops once crossed
- [ ] A test: a pitch-bend Mapping comes back after a reload; a cut-short press learns no Switch; Tap Tempo in the every-Action pad test
- [ ] The owner tries it on the C16 (a human check)

**Out of scope:** the MIDI panel as a C16 map (v2, [262](./262-v2-ideas-from-the-1-26-1-round.md)).
