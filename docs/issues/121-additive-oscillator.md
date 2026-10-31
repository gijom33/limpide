# 121: An additive oscillator

**What to build:** From Claude's brainstorm, accepted by the owner for later in triage ([117](./117-more-to-play-and-hear.md), decision 2, 2026-10-30): each Harmonic's level set by drawbars, as on an organ, building the Spectrum by hand beside the Ideal Reference. The browser's custom waves make it natively ([ADR-0001](../adr/0001-native-web-audio-nodes-over-custom-dsp.md)).

**Blocked by:** [131](./131-v1.md) (v1)

**Status:** needs-triage · enhancement. v2, not committed (the owner, 2026-10-31, [131](./131-v1.md), decision 6): to grill with the owner before anything is built; the owner wants to explore it later (2026-10-30).

## What a grilling would settle

- Where it lives: a fifth Waveform for Osc 1 (and Osc 2?) whose drawbars appear when chosen, or a source of its own in the Mixer.
- How many drawbars (an organ's nine, the first 8 or 16 Harmonics), their range, and their look on a phone.
- What the Ideal and the Maths Layer show: the drawbars' levels are the Ideal, exactly.
- Presets and a Tutorial: rebuilding a saw and a square by hand from their Harmonics.
- How FM, Ring and the Sub treat it.
