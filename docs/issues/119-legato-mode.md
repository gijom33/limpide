# 119: Legato mode

**What to build:** From Claude's brainstorm, accepted by the owner in triage ([117](./117-more-to-play-and-hear.md), decision 1, 2026-10-30): a switch beside Glide, with one Voice, so that a Note played while another is held slides there and the Envelopes carry on, as on a classic monosynth. Today such a Note keeps the Oscillators running (issue 94) but starts both Envelopes again.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** With Legato on and one Voice, a Note played over a held one changes pitch (gliding if Glide is up) without restarting the Envelopes or the retriggered LFOs.

**Current behavior:** with one Voice, every Note starts both Envelopes from their Attack, held key or not.

**Desired behavior:**
- A Legato switch beside Glide, part of the Patch, off by default; old Patches and Share links load with it off.
- With Legato on and one Voice: a Note played while another key is held changes pitch only (at once, or over the Glide time); the Amp and Filter Envelopes carry on from where they are, and LFOs set to retrigger on each Note do not restart. A Note played with no key held starts as now. Releasing the newest key back to a held one (PRD story 6) also slides without a restart.
- With several Voices, the switch greys out as other inactive controls do, with a description saying why.
- The Modulation model and the Timeline follow: a legato Note draws no new Attack.
- A tip says what it does and to try it with Glide; one Preset (a lead) uses it.

**Key interfaces:**
- The Patch and its Voice-related controls
- The engine's Note On for one Voice, the Modulation model's Gate history

**Acceptance criteria:**
- [ ] An engine test: with Legato on, a second key held over the first gives no new Attack on the Amp Envelope; with it off, it does
- [ ] The model's Envelope levels match the engine's for a legato line (the model-against-sound test)
- [ ] A Patch without the field loads with Legato off; a Share link carries it
- [ ] With 2 or more Voices the switch is greyed out and described
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Legato with several Voices
- The Release click ([102](./102-a-note-during-a-release-clicks.md))
