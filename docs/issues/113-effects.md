# 113: Effects

**What to build:** From Claude's brainstorm (inbox, 2026-10-30): "Effects (delay, reverb, chorus): out of scope in the PRD, so the owner's call." The owner's own idea of the same day, sections that switch off ([114](./114-sections-that-switch-off.md)), names effects among them.

The PRD's Out of Scope lists "Effects (delay, reverb, chorus, distortion)". The browser makes each with its own nodes (a delay line, a convolution reverb, a shaper), so [ADR-0001](../adr/0001-native-web-audio-nodes-over-custom-dsp.md) holds. Building it means the PRD's scope amended.

**Blocked by:** none

**Status:** needs-triage · enhancement. To grill with the owner before anything is built.

## What a grilling would settle

- Which effects, in what order after the Amp, and how many knobs each (Claude's starting point: delay and reverb, two or three knobs each; chorus and distortion later).
- What the Viewers show: the Taps before the effects (the synth as it is taught) or after (what is heard), and whether the effects get a Viewer of their own.
- How a delay's time follows the tempo, if [112](./112-tempo-midi-clock-and-an-arpeggiator.md) is built.
- What it teaches: a Tutorial or Demo part for each effect.
- Where the section sits on each layout, and whether it folds away when off (114).
