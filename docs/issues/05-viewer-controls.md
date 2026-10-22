# 05: Viewer controls: Freeze, axes, hover readout, Snapshot

**What to build:** Spacebar Freezes all Viewers while the sound continues. Each Spectrum toggles between a log and a linear frequency axis, and between dB and linear amplitude. Hovering shows the frequency, nearest note and level. "Snapshot" keeps the current Spectrum as a faint trace for A/B comparison, and it can be cleared.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Axis mappings (frequency ↔ x for log and linear, level ↔ y for dB and linear), both directions, tested
- [ ] Viewer state (Freeze, axes, Snapshot) as a pure reducer, tested
- [ ] Spacebar Freeze doesn't conflict with the computer-keyboard Notes
- [ ] Hover readout and Snapshot trace drawn
