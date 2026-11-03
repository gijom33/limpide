# 209: About holds the page still and closes with a ×

**What to build:** Two of the owner's lines (inbox, 2026-11-03). The bug, on an iPhone: "I noticed I can scroll the screen behind the about splash screen. That doesn't make sense. So I'm scrolling with my fingers on the splash screen and it's scrolling the things behind." The idea: "The other thing is to close the splash screen, the about screen, I would rather have a cross like in the other UI than a close button. It would also make it nicer at the bottom." Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-03) on night/2026-11-02, for the owner to try

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
- [x] On a phone-sized touch screen, a drag on About (on the credits and outside them) leaves the page's scroll unchanged
- [x] On a computer, the wheel over About leaves the page's scroll unchanged
- [x] On a short window, the credits still scroll inside About
- [x] A × closes About; there is no Close button; the Demo and the Tour remain
- [x] Escape and a click outside close it; the page is where it was

## How it was built

Built on 2026-11-03, on the branch night/2026-11-02.

**What was built:**
- While About is open, the page behind it does not scroll. A finger, the wheel or a key moves nothing behind About, as the welcome or opened from the logo or the ⓘ button. The page keeps its place and is still there when About closes. The credits, or Bead's card, still scroll inside About when they are taller than it.
- A × in About's top corner closes it, the same size and look as the Demo card's ×, named "Close About". The Close button is gone. The bottom row holds Play the Demo and Take the Tour. Escape and a click outside still close About, and the focus still lands on Play the Demo when it opens.
- Issues 105 and 128 now say, with the date, that the Close button became a ×.

**Tests:** About's tests check the ×, that the Close button is gone, and that About's × is the size of the Demo card's ×. They also check that the wheel and the keys leave the page where it was, and that the ×, Escape and a click outside close About with the page still in place. These tests ran in Chromium and in WebKit. A real finger dragged on a 393 × 540 touch phone, on the mark, the version, the buttons and the credits, leaves the page still. The same drag on the credits scrolls them. This test runs in Chromium only: Playwright cannot drive a touch drag in WebKit. The test failed before the change, which shows the bug: a drag on the mark scrolled the page.

**Calls made:**
1. The page is held still with the stylesheet alone: while About is open, the page itself does not scroll. Safari on the iPhone honours this from iOS 16. On an older iPhone a finger could still scroll the page. Claude's call, open to the owner.
2. The × comes last in the Tab order, after Play the Demo and Take the Tour, though it shows at the top. When About opens, the focus starts on the Demo as before. Claude's call, open to the owner.
3. On a computer whose scrollbars take room (Windows, Linux), the page's scrollbar goes while About is open. The page under the dim can shift by the scrollbar's width. On a Mac and a phone, scrollbars float over the page, so nothing shifts there. This was left as it is: keeping the scrollbar's room would shift a page that had no scrollbar instead. Claude's call, open to the owner.
4. On a window too short for About, About itself scrolls, and the × scrolls with it, out of the corner. About fits on any window down to a 393 × 540 phone. Claude's call, open to the owner.

**What to try in the app:**
- On the iPhone: scroll down a way, open About from the ⓘ button, then drag a finger on the logo, on the credits and on the buttons. Only the credits should move. Close it with the ×: the page should be where it was.
- On a fresh visit (a private window), drag on the welcome: nothing should move behind it.
- On a computer: scroll down a way, open About, then turn the wheel over it and press Page Down. Then close it with the ×, with Escape and with a click outside. The page should stay where it was each time.
- Check the ×: at the top right, like the Demo card's. The bottom row holds the Demo and the Tour only.
