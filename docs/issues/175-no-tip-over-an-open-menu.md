# 175: No tip over an open menu

**What to build:** The owner's bug (inbox, 2026-10-31): "The tip box prevents user from picking the LFO 2 source. I had to deactivate tips to be able to make a selection." A tip is drawn above everything (it takes no pointer, but it hides what lies under it), and it stays up while the LFO's Destination menu opens under it, so the choices it covers cannot be seen. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; tried by the owner: "Fine by me."

## Decisions

1. **A tip never stops a choice being made.** Decided by the owner, 2026-10-31 (the bug).

Claude's call, open to the owner:

2. **Opening a menu closes the tip,** and no tip shows while a menu, a picker's list or a panel opened from a control is open; hovering its options shows none. The tip comes back on the next hover once the menu is closed.
3. **Everywhere, not only LFO 2:** every picker and menu that opens from a control with a tip (the LFOs' Destinations, the Patch picker, Display, MIDI, the Tutorial menu…).

## Agent Brief

**Category:** bug
**Summary:** A control's tip stays up over the menu it opens, hiding the choices; opening a menu should close the tip, and no tip should show while one is open.

**Current behavior:** Hovering LFO 2's Destination shows its tip; clicking opens the Destination menu, and the tip, drawn above everything, stays over part of the list, so some choices cannot be seen. Turning Tips off in Display is the only way round it.

**Desired behavior:** Opening any menu or picker list from a control closes that control's tip at once, and no tip shows while a menu, a list or a panel opened from a control is open (on hover or on focus). Closing it lets tips show again on the next hover. Tips that explain a menu's own options, if any, are out of this rule only if they never cover the list.

**Key interfaces:**
- The tooltip component (when it shows and hides)
- The menus and pickers that open from controls (the LFOs' Destination pickers first)

**Acceptance criteria:**
- [x] Hover LFO 2's Destination until its tip shows, click: the tip is gone and every choice can be seen and picked (an e2e test, red before the fix)
- [x] The same for LFO 1, the Patch picker, Display and MIDI
- [x] Tips show again on the next hover after the menu closes
- [ ] The tooltip specs pass; every test passes in Linux's fonts too

## How it was built

- **The cause:** the click did put the tip away, but the menu opens 4 px from the name, and that gap lies outside the tip's anchor. The pointer crossing it to reach a choice left the anchor and came back in through the menu, which started the hover delay again; the tip then showed, placed by the name and flipped above it when the menu opens upwards (low in a laptop's window), right over the choices. From the keyboard, the tip shown on focus stayed over Display's panel (whose focus stays on its button), and the focus moving into the Destination menu showed it again in Safari.
- **The fix, in the tooltip alone:** a tip opens only while nothing in what it wraps says it is expanded (`aria-expanded` true: the LFOs' Destinations, Patch, Display, MIDI, Tutorial, and Tempo on a narrow screen), asked when the hover delay is out and before a long press shows one; and a tip shown goes at once when its control opens what it opens. Closed, the next hover or focus shows it again. Nothing changed in the menus themselves.
- **What still shows tips (Claude's call, open to the owner):** the rule covers the opener's own tip. The controls inside an open panel keep theirs (Display's Freeze, axes and overlays; MIDI's Learn, Quick Setup and Bend; a narrow screen's Tap), and so do the Patch panel's Presets and Tutorial caps, each explaining the sound it loads. Each shows beside the one control the pointer rests on and goes as it moves on, so it never hides the choice being made, but a Preset's tip does cover the row below it while it shows. Decision 2 read literally would silence those too, taking away the Presets' descriptions on hover; say so if they should go, or move beside the list. **Answered by the owner (2026-11-02):** "Keep it as is." The Presets' and Tutorial caps' tips stay where they are.
- **Tips of other controls** outside an open menu still show on hover (Claude's call, open to the owner): the menu closes at the next press outside, and a tip there goes when the pointer comes back into the menu.
- **Tests:** in the tooltip spec, "no tip over an open menu (issue 175)": for LFO 2 and LFO 1, hover the Destination until its tip shows, click, then slide the pointer pixel by pixel across the gap onto the nearest choice and rest on every choice past the hover delay: no tip, and every choice is what the pointer finds at its centre; after a pick, the next hover shows the tip again (red before the fix in Chromium and WebKit). The keyboard: the tip shown on focus goes as Enter opens the Destination menu and Display's panel (red before, in WebKit and in both). Patch, Display, MIDI and Tutorial: the tip goes as each opens, none over the control while it is open, back after Escape (red before). A narrow screen's Tempo button the same (red before).
- **Tests run:** `npx tsc`, `npm run lint`, the UI unit tests (171 passed); in Chromium and WebKit the tooltip, touch tips, LFO, LFO Destination, Patches, Patch search, Display panel, MIDI Learn, Quick Setup, Tutorial, Tempo, header, keyboard access, pickers, Viewer controls and toolbar layout specs (442 passed), and after the review the tooltip, touch tips, LFO Destination, Tempo, Display panel, header and keyboard access specs again (152 passed). Linux's fonts are GitHub's run.
- **To try:** with Tips on, in a laptop-sized window, hover LFO 2's Destination until its tip shows, click it, and move down or up onto the choices, resting on each: no tip should come. Pick one, move away and back: the tip shows again. The same with Tab to the Destination and Enter, and with Patch, Display, MIDI and Tutorial in the header.
