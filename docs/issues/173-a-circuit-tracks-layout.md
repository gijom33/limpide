# 173: A Circuit Tracks layout

**What to build:** The owner's idea (inbox, 2026-10-31): "Create new layout for Circuit Tracks as v1 feature." Novation's Circuit Tracks, a groovebox, plays Limpide as any Controller does today (its Notes; its eight macro knobs through MIDI Learn), and its MIDI clock will set Limpide's tempo once [136](./136-following-midi-clock.md) is built. This gives it a built-in layout, as the TempoPAD C16 has ([145](./145-the-c16-layout-strip-by-strip.md)): recognised by its name, applied when nothing is mapped, its knobs driving Limpide's controls in a layout a player finds without looking.

**Blocked by:** a research pass on what the Circuit Tracks sends (below); the owner's grilling on the layout; [149](./149-one-seam-for-a-controller.md) (one seam for what a Controller is), so a second known Controller is added in one place

**Status:** needs-triage · enhancement. In v1, decided by the owner, 2026-10-31. First a `/research` pass, then a grilling.

## Decisions

1. **In v1.** Decided by the owner, 2026-10-31, against the scope rule's default (a second Controller's layout would otherwise be v2: [131](./131-v1.md), decision 12).

## What the research would gather

From Novation's own documents (the Circuit Tracks user guide and its MIDI implementation or programmer's reference) and the device's own reports where the owner can check: the name it gives over USB; the channels its tracks send on; the CCs its macro knobs and other controls send on each synth track, and whether they are absolute or relative; its MIDI clock, transport and Program Change messages; what can be set in Novation Components; what it can receive (for lights or not).

## What a grilling would settle

- Which of Limpide's controls its eight macros (per synth track, or across both) drive, and whether its tracks' pages or scenes can stand for Limpide's Sections, as the C16's banks do.
- When the layout applies (plugged in with nothing mapped, as the C16's), its button in the MIDI panel, and a card to print or not.
- Its clock and transport: Start and Stop playing the Song or the Demo, or only the tempo.
- Sharing the page with the C16 when both are plugged in.
