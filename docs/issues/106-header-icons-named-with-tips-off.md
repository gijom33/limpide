# 106: The header's icon buttons named when Tips are off

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 3, [report](../reviews/2026-10-30/3-ui-maniac.md)). From 861 to about 1100 px the header's buttons are icons alone (Hold, MIDI, Display, About, Demo, Tutorial, Song). With Display › Tips off they have no word at all, not even on hover, against the design principle "Icons carry words where hover cannot". Screen readers still hear their names. [81](./81-tooltips-switch-in-display.md) decided, by the owner, that with Tips off no tooltip opens on hover, focus or long press.

**Blocked by:** none

**Status:** needs-triage · bug. A question for the owner below.

## Question for the owner

With Tips off, should an icon-only button still show its name alone (one word, "MIDI", no explanation) on hover? Claude's recommendation: yes. Tips off then means "no explanations", not "no names"; the long tips stay off. The other way is to leave it: whoever switches Tips off knows the icons.
