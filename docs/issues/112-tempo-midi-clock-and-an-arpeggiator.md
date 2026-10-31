# 112: A tempo and MIDI clock sync

**What to build:** The owner's idea (inbox, 2026-10-30): "Add a tempo and midi sync. Tempo used by aroegiator and can be used to sync lfo rate and others." Claude's brainstorm of the same day had an arpeggiator too, "out of scope in the PRD, with the tempo it brings; the owner's call".

This reverses one thing in the PRD's Out of Scope: "LFO tempo sync: Limpide keeps no tempo to sync to … decided by the owner, issue 53, 2026-10-27". Building it means a new ADR and the PRD's scope amended. The arpeggiator stays out (decision 2).

**Blocked by:** none

**Status:** needs-triage · enhancement. The tempo to grill with the owner before anything is built; the arpeggiator dropped (decisions below).

## What a grilling would settle

- The tempo: one BPM for the page, set by a knob and by tapping; followed from a MIDI keyboard's or DAW's clock when one sends it.
- LFO sync: each LFO's Rate in Hz or in note values; what else may follow the tempo (the Demo and the Song already keep their own).
- How the Demo, the Song and the Hold rhythm share the tempo (the shared transport, [75](./75-players-share-a-transport.md)).
- Where it sits on each layout.

## Decisions (2026-10-30)

1. The tempo stays, to grill: a BPM for the page, MIDI clock sync, LFO Rates that can follow it. Decided by the owner.
2. No arpeggiator: "This won't help people understand how synths work. Also the Webapp will be ported to a VST/AU plugin in future and that will just be a synth." Decided by the owner; out of scope ([`.out-of-scope/arpeggiator.md`](../../.out-of-scope/arpeggiator.md)).
