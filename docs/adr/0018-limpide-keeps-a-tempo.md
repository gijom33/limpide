# Limpide keeps a tempo, the page's, and an LFO can sync to it

**Status:** accepted · **Date:** 2026-10-31 · **Decided by:** the owner (issue 112's grilling)

Supersedes issue 53's decision 2 (2026-10-27) that Limpide keeps no tempo: "a BPM control, MIDI clock or the Hold rhythm would each bring in a concept the PRD lacks, for a feature that matters beside a sequencer". The owner asked for a tempo on 2026-10-30, for LFO sync first, and v1 is to be the spec of the VST/AU plugin Limpide will become, where an LFO synced to the host's tempo is expected ([issue 131](../issues/131-v1.md)). There is still no sequencer and no arpeggiator.

So:

- **The tempo is the page's, never a Patch's:** one BPM, 40 to 240, 120 by default, kept between visits as the Display is. A Patch saves only each LFO's Sync and note value, so a shared sound plays at the tempo of whoever opens it. The plugin will do the same, the DAW owning the tempo.
- **Each LFO's Sync** turns its Rate into a note value at the tempo (4 bars to 1/32, straight, dotted and triplet); off, it brings back the Hz it had. A Patch from before loads with Sync off and sounds as it did.
- **A synced LFO running freely starts its cycle on the beat,** in the sound and in the Modulation model alike ([ADR-0003](./0003-modulation-model-mirrors-the-audio-graph.md)): the engine restarts its oscillator where the beat puts it whenever what it is locked with changes (Sync coming on, the note value, the Waveform, the tempo), and the model's clock restarts with it. Setting the tempo starts the beat count again. With Retrigger on, each Note restarts it as before.
- **A player takes the tempo over while it plays** (the Demo, the Song, the Tour, a Tutorial's Listen), its beats counted from its first Note, and the person's comes back when it stops. Hold's tapped rhythm stays apart from the tempo.
- **Following a MIDI clock** is its own slice ([issue 136](../issues/136-following-midi-clock.md)), as is teaching it ([issue 137](../issues/137-teaching-tempo-sync.md)).

## Consequences

- The header's set-up row holds the BPM and Tap; the PRD's Out of Scope no longer lists LFO tempo sync.
- The tempo is outside the Patch, so it is not undone by loading a Preset, not in a Share link and not in a Patch file.
- A Relative knob mapped to a stepped control (a note value, an Octave, the BPM) gathers its clicks into whole steps.
