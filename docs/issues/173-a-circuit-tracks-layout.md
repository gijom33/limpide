# 173: A Circuit Tracks layout

**What to build:** The owner's idea (inbox, 2026-10-31): "Create new layout for Circuit Tracks as v1 feature." Novation's Circuit Tracks, a groovebox, plays Limpide as any Controller does today (its Notes; its eight macro knobs through MIDI Learn), and its MIDI clock will set Limpide's tempo once [136](./136-following-midi-clock.md) is built. This gives it a built-in layout, as the TempoPAD C16 has ([145](./145-the-c16-layout-strip-by-strip.md)): recognised by its name, applied when nothing is mapped, its knobs driving Limpide's controls in a layout a player finds without looking.

**Blocked by:** a research pass on what the Circuit Tracks sends (below); the owner's grilling on the layout; [149](./149-one-seam-for-a-controller.md) (one seam for what a Controller is), so a second known Controller is added in one place

**Status:** needs-info · enhancement. In v1, decided by the owner, 2026-10-31. Researched and grilled; waiting on the check on the owner's device (decisions 7 and 10), then profile 17's proposal of the 16 knobs for the owner's yes, then ready for an agent.

## Decisions

1. **In v1.** Decided by the owner, 2026-10-31, against the scope rule's default (a second Controller's layout would otherwise be v2: [131](./131-v1.md), decision 12).

Grilling, round 1, decided by the owner, 2026-10-31 (Claude's recommendations, accepted: "OK with all question recommendations"):

2. **The MIDI tracks drive Limpide,** with Novation's default template (CC 1, 2, 5, 11, 12, 13, 71, 74 on channels 3 and 4): 16 knobs, no setup in Components, and only Limpide sounds. A template Limpide ships may come later if 16 run short.
3. **The clock sets the tempo** ([136](./136-following-midi-clock.md)); Start and Stop do not play Limpide's Song or Demo.
4. **No Actions** from the Circuit Tracks (it has no buttons that send MIDI); they stay on the screen and the C16.
5. **Applied as the C16's:** by itself when a Circuit Tracks is plugged in with nothing mapped; a "Circuit Tracks layout" button in the MIDI panel; a one-page card to print.
6. **Beside a C16:** each built-in layout answers only its own device (ADR-0017), so both play together.
7. **A check on the owner's device before building:** the owner plugs it in while Claude reads what it sends from the page (each track's knobs, a Patch change, Play and Stop), settling the research's eleven unsourced facts.

Round 2, decided by the owner, 2026-10-31 ("ok"):

8. **Profile 17 proposes the 16 knobs** (the MIDI mapping geek, [42](./42-reviews.md)), from the research and the device check, as for the C16 (for instance MIDI track 1 the sound, Oscillators and Filter; MIDI track 2 its shape, Amp and LFOs; each knob pair the top and bottom of one idea); the owner approves or changes it.
9. **Pickup** for its knobs, which send positions the device keeps per Project: a control moves only once the knob passes its value, so nothing jumps after a Preset change.
10. **The device check** whenever the owner has it at hand (after trying the night's work is fine); profile 17's proposal follows it.

## What the research would gather

From Novation's own documents (the Circuit Tracks user guide and its MIDI implementation or programmer's reference) and the device's own reports where the owner can check: the name it gives over USB; the channels its tracks send on; the CCs its macro knobs and other controls send on each synth track, and whether they are absolute or relative; its MIDI clock, transport and Program Change messages; what can be set in Novation Components; what it can receive (for lights or not).

## What a grilling would settle

- Which of Limpide's controls its eight macros (per synth track, or across both) drive, and whether its tracks' pages or scenes can stand for Limpide's Sections, as the C16's banks do.
- When the layout applies (plugged in with nothing mapped, as the C16's), its button in the MIDI panel, and a card to print or not.
- Its clock and transport: Start and Stop playing the Song or the Demo, or only the tempo.
- Sharing the page with the C16 when both are plugged in.
