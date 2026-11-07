# 252: Nothing left over the controls

**What to build:** Four findings of the full review round on 1.26.1 (the inbox, 2026-11-07; reviews [2](../reviews/2026-11-07/2-synth-enthusiast.md), [3](../reviews/2026-11-07/3-ui-maniac.md), [5](../reviews/2026-11-07/5-learner-teacher.md) and [7](../reviews/2026-11-07/7-recruiter.md)), things that sit over or out of line with the controls:

1. **The Demo button's tip stays open over the Amp** once focus lands on the button by the mouse or by Escape: after About's "Play the Demo" it was still open 20 s on (review 7, Chromium); after the welcome closed with Escape (reviews 2 and 5).
2. **In MIDI Learn at 861 to 1440 px the Learn bar covers LFO 2's Depth and Rate values,** cutting "0 %" and "2.00 Hz" in half; at 1440 × 900 the page cannot scroll them clear (review 3, Chromium, both themes).
3. **With no Web MIDI** (blocked in Chromium, missing in WebKit) the disabled MIDI Learn and Quick Setup buttons look and hover as if enabled, show their tip, and do nothing (review 3).
4. **The Filter and Amp Envelope rows,** side by side, sit 18 px apart vertically at 1100 to 2560 px, 23 px at 861 (review 3, both engines).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-07) on night/2026-11-07, for the owner to try. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** A tip left open, the MIDI Learn bar over two values, disabled MIDI buttons that look enabled, and two Envelope rows out of line.

**Current behavior:** As the four items above say.

**Desired behavior:**
- A tip opened by focus that did not come from the keyboard (a click, a script moving focus, Escape closing a panel) does not stay open: it shows only on hover or on keyboard focus, as the other tips do.
- In MIDI Learn no value is covered by the Learn bar at any width; where the bar must sit over the page, the page can scroll every control clear of it.
- With no Web MIDI, MIDI Learn and Quick Setup look disabled (greyed, no hover change), and their tip or the MIDI panel says why ("this browser gives no MIDI" or "MIDI is blocked for this site").
- The Filter and Amp Envelope rows line up when side by side, at every width they share a row.

**Key interfaces:**
- The tips and the focus that opens them
- The Learn bar's place and the page's scroll room in MIDI Learn
- The MIDI buttons' disabled look and their words
- The Envelope Sections' layout

**Acceptance criteria:**
- [x] A test: About's "Play the Demo", and the welcome closed with Escape, leave no tip open on the Demo button
- [x] A test: in MIDI Learn at 861, 1100 and 1440 px, LFO 2's values are not under the Learn bar (or can be scrolled clear)
- [x] A test with Web MIDI missing: the two buttons are disabled, look so, and say why
- [x] A test: the two Envelope rows' tops within 1 px of each other at 861, 1100, 1440 and 2560 px
- [ ] Every test passes in both engines and in Linux's fonts

**Out of scope:** the tips' words; the Learn bar's contents.

## How it was built

- **The tips and the focus that opens them** (the Tooltip). A focus still opens a tip at once when the browser draws it a keyboard ring, but no longer when the last thing done was a press (mouse, finger or pen) or a key that acts on a control, Enter, Space or Escape: a focus that follows is the page's (the welcome giving the Demo button the focus, a panel closing back to its button). A key that moves the focus, Tab or an arrow, puts the keyboard back in charge. Hover is unchanged. Tests: the welcome closed by a click on Play the Demo, by Enter on it and by Escape leaves no tip on the Demo button, and Tab then shows it again; About's Play the Demo, clicked, leaves none. Two older tip tests that moved the focus by script straight after Enter or Escape now press Tab first, as a keyboard user does.
- **The Learn bar** stays where it was, over the page 16 px off the bottom. While Learn is on, the page keeps room below its last control for the bar's measured height, as it does for a docked card (the larger of the two when both are there). So every control can be scrolled clear of the bar. Test: at 861, 1100 and 1440 × 900, scrolled to the end, no value and no learnable control is under the bar.
- **The MIDI buttons with no Web MIDI.** MIDI Learn and Quick Setup were disabled already. Now they look it: greyed to 45 %, the arrow cursor, no change on hover. Their tip says why first, under its title: "This browser gives no MIDI." (missing, as in Safari) or "MIDI is blocked for this site." (blocked). The panel's first line still says it at length. Test: both cases, both buttons.
- **The Envelope rows.** An Envelope row now ends its Section's controls on their bottom line, with the rows above it from the top. The Filter's and the Amp's lie on one line wherever the two share a row. Before, the Amp's two rows were spaced evenly in the room that the Filter's three taller rows leave, so its Envelope row sat 15 to 22 px higher. Test: at 861, 1100, 1440 and 2560 px, the rows' tops and their first faders' tops agree within 1 px.

## Claude's calls, open to the owner

1. **Enter and Space count with Escape as "the page moved the focus".** The Agent Brief names "a script moving focus" among what opens no tip. So Enter on the welcome's Play the Demo gives the Demo button the focus without a tip, as Escape closing a panel does, and Tab shows it again. A keyboard user who wants the tip of a control the page just focused presses Tab and Shift+Tab, or hovers it.
2. **The Learn bar keeps its place, and the page gains its room.** At 1440 × 900 the bar still sits over LFO 2's Depth and Rate when Learn starts, until the page is scrolled down about 50 px. The other answers the lead measured would show them without a scroll: the bar at least 5 px lower, or a shorter bar. They hang on the fonts (a Linux font a pixel taller and they overlap again), and the room works at every size. Either could be added on top.
3. **The Amp's Voices row now sits at the top of its controls,** level with the Filter's Mode row, with the free room in one gap above the Amp Envelope. Before, it was spread above, between and below its two rows. Centring Voices in the room above the Envelope is the other way.
4. **Greyed to 45 %, as the cards' disabled buttons are,** not to the 30 % of a control that turns but has no effect now (design principles). The same look now reaches every disabled header-style button, Quick Setup's Back on its first step among them.

## What to try in the app

- In a private window (a first visit), close the welcome with Escape, then with Play the Demo: no tip opens on the Demo button. Then press Tab and Shift+Tab: its tip shows.
- At 1440 × 900, switch MIDI Learn on: LFO 2's values are under the bar, and the page now scrolls them clear.
- In Safari, or in Chrome with MIDI blocked for the site, open the MIDI panel: MIDI Learn and Quick Setup are greyed, still on hover, and their tip starts with why.
- At 1100 or 1440 px, look along the Filter Envelope and the Amp Envelope: one line.

## Review (`/code-review` since 65a2b97, 2026-11-07)

Fixed:
- **Spec:** Enter or Space on Play the Demo still opened the Demo button's tip. They now count with Escape (call 1), with a test. The Learn test waited for the bar but not its room, so it now waits for the room before it scrolls.
- **Standards:** comments that told the old bug now describe the code as it is. The tests find the Sections by role and Play the Demo with `exact: true`. The flag got a name for what it means.

Noted, not changed:
- The Learn bar's measured height repeats the shape of the docked card's (a ResizeObserver writing a root variable). They share a page and a margin but not a lifetime, so they stay apart.
- The two "why" words live in the MIDI panel beside its longer status text, which reads the same states, not in the tips' file.
- The tests' "Every test passes in both engines and in Linux's fonts": passed here in Chromium and WebKit on macOS. Linux is GitHub's run.
- The Learn bar can sit over a docked card's lower edge when both are there, as before.

