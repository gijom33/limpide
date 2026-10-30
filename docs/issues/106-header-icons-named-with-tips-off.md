# 106: The header's icon buttons named when Tips are off

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 3, [report](../reviews/2026-10-30/3-ui-maniac.md)). From 861 to about 1100 px the header's buttons are icons alone (Hold, MIDI, Display, About, Demo, Tutorial, Song). With Display › Tips off they have no word at all, not even on hover, against the design principle "Icons carry words where hover cannot". Screen readers still hear their names. [81](./81-tooltips-switch-in-display.md) decided, by the owner, that with Tips off no tooltip opens on hover, focus or long press.

**Blocked by:** none

**Status:** done (2026-10-30). With Tips off, hovering or focusing a header button shown as its icon alone (861 to 1099 px) shows its name alone where its tip would open; a button showing its word, and every other control, shows nothing.

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
- [x] At 1000 px with Tips off, hovering each icon-only header button shows its name and nothing else
- [x] At 1440 px with Tips off, hovering a worded button shows nothing
- [x] Issue 81 has a "Since then" line

**Out of scope:**
- Any other control's tips

## How it was built

- `src/ui/Tooltip.tsx`: with Tooltips off, a Tooltip whose control holds a hidden header word (`.tool-word`, `.demo-word`, hidden by the CSS from 861 to 1099 px) still opens on hover or keyboard focus, as a second bubble holding the tip's title alone, placed as the tip would be. That bubble is `aria-hidden`: the button's name already says it, and its description stays the full tip. With Tooltips on nothing changed. No call site changed: the word in the button is what tells.
- `src/ui/tips.ts`: the Tooltips switch's tip says a button showing its icon alone shows just its name.
- Test: "with Tooltips off, the header's buttons shown as icons alone still show their names…" in `e2e/displayPanel.spec.ts`: at 1000 px each of the seven buttons shows its name alone on hover, under the button, and Demo on focus; at 1440 px Hold and Demo show nothing. It failed before the change. The issue 81 test there now steps away from the Display button that Escape refocuses before counting the Cutoff's tooltip: it had passed only while the Cutoff's had not opened yet, and failed under load.
- Run: `e2e/displayPanel.spec.ts`, `header.spec.ts`, `about.spec.ts`, `tooltips.spec.ts`, `touchTips.spec.ts` in Chromium and WebKit, green, and again with Verdana forced; `npx vitest run` green.
- A long press on a touch screen still opens nothing with Tips off: the decision named hover, and issue 81's "no long press" stands (Claude's call, open to the owner).
