# 211: The Demo scrolls slower, so Bead is seen

**What to build:** The owner's idea (inbox, 2026-11-03; "Bit" is Bead): "When playing the demo, the screen is being scrolled automatically, but I think it's scrolling way too fast because Bit doesn't have the time to show its animation. I would slow down a little bit so that we see whether Bit falling or Bit flying back up." Polish for v1 ([131](./131-v1.md)). Close to [204](./204-baggage-air-guitar-and-surfing-seen.md)'s question 1, the Demo's following scrolling the LFOs clear of its card: built together or one after the other.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-03) on night/2026-11-02, for the owner to try

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

## How it was built

Built on 2026-11-03, on night/2026-11-02.

- **The Demo's scroll to a part's Section now lasts 1.4 s,** eased in and out, wherever the Demo moves the page: on a phone, to land the Section under the section tabs; in 2 × 2, the least scroll that shows the whole Section, as before. The page moves a frame at a time, so its length is the page's own and the same in every browser.
- **Measured before,** with Bead out and the Demo playing, at 375 × 812 and in 2 × 2 (700 × 830 and 690 × 640):
  - the Demo's scroll lasted 0.35 to 0.5 s in Chromium, 0.2 s in WebKit;
  - Bead's falls between two Sections lasted 0.14 to 0.93 s, its flights up to about 1.25 s. They start once the scroll has carried its edge away, a little after the scroll itself.
- **Measured after,** the same way: the scroll lasts 1.37 s from its first moved frame to its last, in both browsers. Every fall or flight that starts during a scroll lands before the page stops: falls of 0.15 to 0.67 s, flights of about 1 s, in 2 × 2 landing 50 to 80 ms before the page stops. At 1.3 s, tried first, those flights still landed just after it.
- **What does not change:**
  - The person's own scroll stops it at once: the wheel, a finger that scrolls, the keys, the scroll bar, as the Tour already reads them. A knob turned by its wheel or a finger does not stop it.
  - The following still pauses until the next part, as before.
  - A tap on the section tabs and a Controller's bank keep the browser's quick smooth scroll.
  - With reduced motion, the page jumps.
- **Tests:**
  - `e2e/demo.spec.ts`, on a 375 px phone: the Demo's first scroll lasts 1.2 to 1.5 s. With reduced motion it is one frame. The person's scroll stops it. A knob's wheel meanwhile leaves it going.
  - `e2e/mascot.spec.ts`, on a 375 px phone and in 2 × 2: through the Demo's scrolls, Bead falls or flies in view and lands before the page stops.
  - Red first:
    - the length test failed at 0.37 s before the change;
    - Bead's test failed in 2 × 2 with the slow scroll taken out;
    - the knob's test failed against the first build, which any wheel stopped.

**Calls made (Claude's call, open to the owner):**

1. **1.4 s,** within decision 2's bounds. It is long enough that every fall or flight starting with the scroll lands before the page stops (1.3 s left the 2 × 2 flights a few hundredths of a second late). It is under 1.5 s, so the part's change is still seen as it happens.
2. **Eased in and out,** like the browser's own smooth scroll: slow to leave, slow to arrive.
3. **Everywhere the Demo follows,** three across too, where a Section is rarely out of view. A Controller's bank keeps the quick scroll: the person moved it.
4. **Scrolling back up, Bead may fly only once the page stops.** Bead keeps its edge while that edge is in view (its own rule, unchanged here). On a scroll up, its edge goes down the window with the page and leaves the window only near the end, so the flight starts as the page arrives and is seen after it. On a phone, going back from the Amp to the Filter, it flies for about 1.5 s after the page stops. Going down, it falls while the page moves.

**To try in the app:**
- On a phone (or a window 600 px wide or less), with Bead out, play the Demo. At each part that turns a knob in another Section, the page glides there over about a second and a half, and Bead falls to its new edge while it does. Going back up a Section, watch Bead fly up as the page arrives.
- Scroll yourself while the page glides: it stops at once and leaves the page to you until the next part.
- With reduced motion on, the page still jumps.
- In 2 × 2 (a window 601 to 860 px wide), the same.
