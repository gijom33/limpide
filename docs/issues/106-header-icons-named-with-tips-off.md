# 106: The header's icon buttons named when Tips are off

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 3, [report](../reviews/2026-10-30/3-ui-maniac.md)). From 861 to about 1100 px the header's buttons are icons alone (Hold, MIDI, Display, About, Demo, Tutorial, Song). With Display › Tips off they have no word at all, not even on hover, against the design principle "Icons carry words where hover cannot". Screen readers still hear their names. [81](./81-tooltips-switch-in-display.md) decided, by the owner, that with Tips off no tooltip opens on hover, focus or long press.

**Blocked by:** none

**Status:** ready-for-agent · bug. The owner chose names on hover (decision below).

## Question for the owner

With Tips off, should an icon-only button still show its name alone (one word, "MIDI", no explanation) on hover? Claude's recommendation: yes. Tips off then means "no explanations", not "no names"; the long tips stay off. The other way is to leave it: whoever switches Tips off knows the icons.

## Decisions (triage, 2026-10-30, decided by the owner)

1. With Tips off, an icon-only button still shows its name alone on hover ("MIDI", no explanation); the long tips stay off. This amends [81](./81-tooltips-switch-in-display.md)'s "no tooltip opens on hover", which gets a "Since then" line.

## Agent Brief

**Category:** bug
**Summary:** With Tips off, hovering an icon-only header button shows its name.

**Current behavior:** with Display › Tips off, the header's icon-only buttons (861 to about 1100 px) show nothing on hover.

**Desired behavior:**
- With Tips off, hovering or focusing a header button shown as an icon alone shows its name, one or two words, in the place its tip would open.
- With Tips on, nothing changes: the full tip opens.
- A button showing its word already shows nothing more with Tips off.

**Acceptance criteria:**
- [ ] At 1000 px with Tips off, hovering each icon-only header button shows its name and nothing else
- [ ] At 1440 px with Tips off, hovering a worded button shows nothing
- [ ] Issue 81 has a "Since then" line

**Out of scope:**
- Any other control's tips
