# 209: About holds the page still and closes with a ×

**What to build:** Two of the owner's lines (inbox, 2026-11-03). The bug, on an iPhone: "I noticed I can scroll the screen behind the about splash screen. That doesn't make sense. So I'm scrolling with my fingers on the splash screen and it's scrolling the things behind." The idea: "The other thing is to close the splash screen, the about screen, I would rather have a cross like in the other UI than a close button. It would also make it nicer at the bottom." Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Decided by the owner, 2026-11-03:

1. **A finger on About scrolls nothing behind it.** About's own credits (or Bead's card) still scroll inside it where they are taller than it.
2. **A × closes About,** as the other panels and cards close, in place of the Close button; About's bottom row keeps the Demo and the Tour.

Claude's calls, open to the owner:

3. **The × in About's top corner,** the same size and look as the Demo card's ×, with the name "Close About"; Escape and a click outside still close it.
4. **The page behind stays where it was** when About closes, on a phone and on a computer.

## Agent Brief

**Category:** bug
**Summary:** While About is open, the page behind it scrolls under a finger on About; and About closes with a word button where the rest of the app uses a ×.

**Current behavior:** On an iPhone, with About open (by the logo, the ⓘ button, or as the welcome), a finger dragged on About scrolls the page behind it. About's bottom row holds three buttons: the Demo, the Tour and Close.

**Desired behavior:**
- With About open, no drag, wheel or key scrolls the page behind it, on a phone or a computer; the credits and Bead's card scroll inside About when they are taller than it.
- A × in About's top corner closes it, like the ×s elsewhere; the Close button goes, leaving the Demo and the Tour in the bottom row.
- Escape and a click outside About still close it; the focus still lands on the Demo button as About opens.
- Closing About leaves the page scrolled where it was.

**Key interfaces:**
- The About dialog, its credits and Bead's card, and its bottom row
- The other ×s in the app (the Demo's card), for the look

**Acceptance criteria:**
- [ ] On a phone-sized touch screen, a drag on About (on the credits and outside them) leaves the page's scroll unchanged
- [ ] On a computer, the wheel over About leaves the page's scroll unchanged
- [ ] On a short window, the credits still scroll inside About
- [ ] A × closes About; there is no Close button; the Demo and the Tour remain
- [ ] Escape and a click outside close it; the page is where it was
