# 50: The Demo explains itself on a phone

**What to build:** The Demo is the curious contact's whole visit, and on a phone it explains nothing: the header (with the sound's name and the Demo button) stays slid away while the Demo jumps between sections, knobs labelled Cutoff and dB move with no caption, it runs over 70 s with no sign of progress, and a tap on a key stops it without a word, so a first-time visitor thinks they broke it ([review 1](../reviews/2026-10-26/1-curious-contact.md), at 393 × 659 in WebKit). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-26)

- [x] A one-line caption per moment of the Demo, in plain words ("Acid: the filter opens and closes"), shown where the eye is
- [x] The sound's name and a way to stop the Demo in view while it plays, the header slid away or not
- [x] Some sign of progress (which part of how many, or time left)
- [x] A tap on a key that stops the Demo says so
- [x] The Demo's first sound heard on a phone speaker: the Kick Preset (C2, about 65 Hz) is mostly below what a phone speaker plays, so the Demo seems to start in silence. Much more Noise in it (the click a phone can play), in the Demo's part or in the Preset itself. From the owner, 2026-10-26

How it was done: a card docked at the bottom while the Demo plays (`src/ui/DemoBar.tsx`, sharing the Tutorial card's place, `src/ui/docked.ts`) shows the part's Preset, a dot per part (part 2 of 7), Stop, and a caption per part, written in the track (`src/demo/track.ts`). A Note or a control that stops the Demo leaves the card saying so for six seconds, with Play again; Stop, the Song or a Tutorial do not. Where the page fits its window (a laptop), the card sits over the page's bottom edge rather than adding a scroll bar (asked by the owner). The Kick's Filter Envelope now starts at the Preset's 3 octaves (a 440 Hz click) instead of 1.5 (155 Hz, below a phone speaker), deepening to 4.5; a unit test keeps its first hit above 400 Hz.
