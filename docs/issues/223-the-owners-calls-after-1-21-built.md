# 223: The owner's calls after 1.21, built

**What to build:** The answers to [191](./191-the-owners-calls-after-1-21.md) (the owner, 2026-11-03) that change the app or need research: its decisions 6, 7, 9, 11 and 12. Polish for v1 ([131](./131-v1.md)). Decision 13 (aftertouch on the Resonance) went to [219](./219-aftertouch-glides.md).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Decided by the owner, 2026-11-03 (191's numbers):

1. **(191.7) Short forms "Key" and "Vel":** Key Track and Velocity take them where the room is measured short, as 156 picks the others; the header keeps 154's fixed widths.
2. **(191.9) A button learned on a Switch flips it on each press,** a momentary button or a toggle alike: LFO Sync, Legato, Retrigger.
3. **(191.11) The BPM's keys as every knob's:** the arrows 1 BPM, Shift+arrow a tenth, Page Up and Down 10; the tempo's tip gets the steps line.
4. **(191.12) "Tap Tempo" off screen:** the button keeps its word "Tap" on screen; the glossary, the code and the tips say "Tap Tempo", the Taps staying the listening points.
5. **(191.6) The DX7's primary source found:** FM's History line keeps naming it (134, decision 9); a primary source, Yamaha's own DX7 documents, is found and cited so the fact meets 134's decision 5.

## Agent Brief

**Category:** enhancement
**Summary:** Five small changes the owner settled on 2026-11-03, each built and tested on its own commit.

**Current behavior:**
- Key Track and Velocity keep their whole names where the room is short.
- A pad or button learned on a Switch never switches it: Learn reads its 127 and 0 as a knob's.
- In the tempo field, Shift+arrow moves the BPM 10, where Shift is the fine step everywhere else; the tempo's tip has no steps line.
- "Tap" names both the tempo's button and the listening points in the glossary, code and tips.
- FM's History line names the DX7 on a fact graded C, without a primary source.

**Desired behavior:**
- "Key" and "Vel" where the room is measured short.
- Each press of a button learned on a Switch flips it, a momentary button's release doing nothing; a toggle button's two messages each flip it once.
- The BPM: arrows 1, Shift+arrow 0.1, Page Up and Down 10, and a steps line in its tip like a knob's.
- "Tap Tempo" in the glossary, the code and the tips; "Tap" on the button.
- The DX7 fact cited to a primary source in the History research, or, if none is found, the line and the owner told.

**Key interfaces:**
- The short forms and their measuring
- MIDI Learn and a Mapping on a Switch
- The tempo field's keys and its tip
- The glossary, the tips, the code's names
- The History research and FM's line

**Acceptance criteria:**
- [ ] At the widths where 156 shortens, Key Track and Velocity read "Key" and "Vel" (browser test)
- [ ] A momentary and a toggle button learned on LFO 1 Sync each flip it once a press (unit and browser tests)
- [ ] The tempo's keys move 1, 0.1 and 10 BPM; its tip has the steps line (browser test)
- [ ] No "Tap" for the tempo left in the glossary, the tips or the code's names; the button still reads "Tap"
- [ ] The DX7's source cited, its grade raised, or the owner told none was found

**Out of scope:**
- The header's words (154's rule)
