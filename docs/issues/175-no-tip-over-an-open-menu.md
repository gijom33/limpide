# 175: No tip over an open menu

**What to build:** The owner's bug (inbox, 2026-10-31): "The tip box prevents user from picking the LFO 2 source. I had to deactivate tips to be able to make a selection." A tip is drawn above everything (it takes no pointer, but it hides what lies under it), and it stays up while the LFO's Destination menu opens under it, so the choices it covers cannot be seen. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug

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
- [ ] Hover LFO 2's Destination until its tip shows, click: the tip is gone and every choice can be seen and picked (an e2e test, red before the fix)
- [ ] The same for LFO 1, the Patch picker, Display and MIDI
- [ ] Tips show again on the next hover after the menu closes
- [ ] The tooltip specs pass; every test passes in Linux's fonts too
