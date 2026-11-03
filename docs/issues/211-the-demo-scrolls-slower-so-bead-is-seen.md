# 211: The Demo scrolls slower, so Bead is seen

**What to build:** The owner's idea (inbox, 2026-11-03; "Bit" is Bead): "When playing the demo, the screen is being scrolled automatically, but I think it's scrolling way too fast because Bit doesn't have the time to show its animation. I would slow down a little bit so that we see whether Bit falling or Bit flying back up." Polish for v1 ([131](./131-v1.md)). Close to [204](./204-baggage-air-guitar-and-surfing-seen.md)'s question 1, the Demo's following scrolling the LFOs clear of its card: built together or one after the other.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Decided by the owner, 2026-11-03:

1. **The Demo's scroll from one Section to the next is slower,** so Bead's move (a fall, or flying back up) is seen.

Claude's calls, open to the owner:

2. **Slow enough to see Bead's whole move,** measured: the scroll lasts at least as long as Bead's fall or flight between the two Sections, and no longer than a second and a half, so the Demo's words and knobs still meet the eye in time.
3. **The person's own scrolling and the section strip's taps are not slowed;** with reduced motion, the Demo still jumps.

## Agent Brief

**Category:** enhancement
**Summary:** When the Demo moves the page to the Section it is turning, it scrolls so fast that Bead's move to that Section cannot be seen.

**Current behavior:** On a phone and in the stacked layouts, the Demo brings each part's Section into view with the browser's smooth scroll, over in a moment; Bead falls or flies to its new edge, but the page has already arrived and its move is lost.

**Desired behavior:**
- The Demo's scroll between Sections is slower, long enough to watch Bead fall or fly to the new edge.
- It stays under about a second and a half, so the part's change is still seen as it happens.
- A scroll the person starts stops the Demo's scroll at once, as now; the section strip and the person's scrolling keep their speed.
- With reduced motion, the Demo moves the page at once.

**Key interfaces:**
- The Demo's following of its parts across the page
- Bead's fall and flight between Sections

**Acceptance criteria:**
- [ ] On a 375 px phone, a part change that moves to another Section scrolls over a measured time long enough for Bead's move, at most about 1.5 s
- [ ] Bead's fall or flight is on screen during the scroll
- [ ] The section strip's taps scroll as before
- [ ] With reduced motion, the page jumps
