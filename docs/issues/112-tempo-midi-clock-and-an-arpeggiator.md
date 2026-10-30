# 112: A tempo, MIDI clock sync and an arpeggiator

**What to build:** The owner's idea (inbox, 2026-10-30): "Add a tempo and midi sync. Tempo used by aroegiator and can be used to sync lfo rate and others." Claude's brainstorm of the same day had an arpeggiator too, "out of scope in the PRD, with the tempo it brings; the owner's call".

This reverses two things: the PRD's Out of Scope ("An arpeggiator or sequencer", and "LFO tempo sync: Limpide keeps no tempo to sync to … decided by the owner, issue 53, 2026-10-27"). Building it means a new ADR and the PRD's scope amended.

**Blocked by:** none

**Status:** needs-triage · enhancement. To grill with the owner before anything is built.

## What a grilling would settle

- The tempo: one BPM for the page, set by a knob and by tapping; followed from a MIDI keyboard's or DAW's clock when one sends it.
- The arpeggiator: its modes (up, down, up-down, as played, random), its range in octaves, its rate in note values, its gate length; how it plays with Hold, the Voices and the Viewers following one Note ([ADR-0007](../adr/0007-optional-polyphony-viewers-follow-the-newest-note.md)).
- LFO sync: each LFO's Rate in Hz or in note values; what else may follow the tempo (the Demo and the Song already keep their own).
- How the Demo, the Song and the Hold rhythm share the tempo with the arpeggiator (the shared transport, [75](./75-players-share-a-transport.md)).
- Where it sits on each layout, and whether it folds away when off ([114](./114-sections-that-switch-off.md)).
