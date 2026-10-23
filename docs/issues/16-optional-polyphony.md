# 16: Optional polyphony

**What to build:** A Patch chooses its number of Voices (1 to 4). At 1, everything is as before: one Voice, last-note priority, Glide. At 2 to 4, each Note takes its own Voice and chords sound. Every Viewer follows the newest Note, as if it were played alone ([ADR-0007](../adr/0007-optional-polyphony-viewers-follow-the-newest-note.md)).

**Blocked by:** 15

**Status:** in progress

- [ ] ADR-0007 written; ADR-0005 marked superseded; PRD and glossary updated (Voice, Voices, Note Priority, Hold)
- [ ] `voices` choice (1–4) in the Patch: default 1, migrates from older Patches, in the share link only when not 1, learnable
- [ ] Note input: with 1 Voice unchanged; with more, every press is a Note On and every release a Note Off; Hold keeps Voices sounding until Hold off
- [ ] Engine: four Voice chains from one factory; shared LFO, master and safety; Taps reconnected to the newest Note's Voice; the model history is the newest Note's
- [ ] Voice allocation: a free Voice (released and faded) first, else the longest-released, else the oldest; a Note already sounding retriggers its own Voice
- [ ] Mono behaviour bit-for-bit as before: the existing engine tests pass unchanged
- [ ] Engine tests: a chord sounds both Notes; the Oscillator Tap shows only the newest Note; stealing when all Voices are taken; back to 1 Voice releases the rest
- [ ] UI: "Voices 1 2 3 4" on the Amp heading line, with a tooltip; piano and MIDI play chords
- [ ] e2e: the control sets the Patch; a two-key chord lights both keys and the Viewers keep showing the newest Note
