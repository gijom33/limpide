# 114: Sections that switch off and fold away

**What to build:** The owner's idea (inbox, 2026-10-30): "Make the sections for which it makes sense deactivatable. The deactivated sections (could be arpeggiator, filter, lfo or effects) would collapse on the phone."

Today no section has an off switch: the Filter is always in the path, and an LFO is silenced only by its Depth at 0 (its plot then dims). The arpeggiator and effects do not exist yet ([112](./112-tempo-midi-clock-and-an-arpeggiator.md), [113](./113-effects.md)).

**Blocked by:** none for the Filter and the LFOs; 112 and 113 for their own sections

**Status:** needs-triage · enhancement. To grill with the owner, best alongside 112 and 113.

## What a grilling would settle

- Which sections switch off: Claude's starting point is the Filter (bypassed: the sound goes straight to the Amp), each LFO, and the arpeggiator and effects once built; never the Oscillators or the Amp.
- What off means for the Viewers: the Filter Spectrum and Response Curve with the Filter bypassed; the Timeline's LFO lines.
- Whether off is part of the Patch (saved, shared, set by Presets) or only of the screen. Claude's starting point: part of the Patch, since a bypassed Filter changes the sound.
- Folding: on a phone a switched-off section folds to its title row with its switch; on wider layouts it greys out in place, or folds too.
- MIDI: whether a switch can be learned like a button.
- Old Patches load with every section on.
