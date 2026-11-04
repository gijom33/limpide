# 206: The Tour shows the control and the Viewer

**What to build:** The owner's idea (inbox, 2026-11-02), found trying [130](./130-the-tour-freezes-to-show-adsr.md): "Yes but on small screen, we shoukd show both the settings and viewer. If it cannot fit screen we should show each in turn by scrolling." On a phone, 130 brings only the Envelope Timeline into view on the Tour's Amp card, so the person sees the picture freeze but not the Attack, Decay, Sustain and Release faders the Tour moves. Polish of v1's Tour ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, not yet released; tried by the owner: "All good."

## Decisions

Decided by the owner, 2026-11-02:

1. **On a small screen the Tour shows both the controls it moves and the Viewer that shows them,** at once where they fit.
2. **Where they do not fit, each in turn, by scrolling:** the control while it moves, then the Viewer while it shows the result.

Claude's calls, open to the owner:

3. **Every card, not the Amp's alone:** each Tour card that moves a control and points at a Viewer follows the same rule (the Oscillators, the Filter, the Amp, the LFOs), measured at each width the Tour supports.
4. **The scroll is smooth and timed to the action:** the page scrolls to the control just before it moves, holds while it moves, then scrolls to the Viewer and holds through what the card shows there (on the Amp card, each freeze); the card stays where it is. With reduced motion, the page jumps instead of gliding.
5. **The person's own scroll wins:** a scroll by the person stops the Tour's scrolling for that card, as Space stops its freezes.
6. **Measured first,** at 320, 375, 601 and 860 px, for each card: whether control and Viewer fit together between the header and the card.

Decided by the owner, 2026-11-03, answering the question below:

7. **By fit at every width, alternating where they do not fit** ("You could alternate between the two views"). On a short 2 × 2 or laptop window as on a phone, a card whose control and Viewer do not fit together takes them in turn, the control as it moves, then the Viewer, as built. The criterion "From 2 × 2 up, unchanged" gives way to it.

## Agent Brief

**Category:** enhancement
**Summary:** On a small screen, each Tour card shows the control it moves and the Viewer that shows the effect, together if they fit, else one after the other by scrolling.

**Current behavior:** On a phone, the Tour's Amp card scrolls the Envelope Timeline into view and freezes it to show each stage, but the Amp's Attack, Decay, Sustain and Release faders the Tour moves stay out of view, about 670 px away. From 2 × 2 up everything fits.

**Desired behavior:**
- On each Tour card, where the control being moved and the Viewer showing it fit together between the header and the card, both are in view.
- Where they do not, the page scrolls to the control as it moves, then to the Viewer for what it shows, in turn, for each step of the card (on the Amp card: the Attack fader, then the Timeline's freeze; the Decay fader, then its freeze; and so on).
- Scrolling is smooth, or a jump with reduced motion; the card stays put.
- If the person scrolls during a card, the Tour stops scrolling for the rest of that card.
- From 2 × 2 up, the Tour behaves as now.

**Key interfaces:**
- The Tour's cards and their steps (which control moves, which Viewer shows it)
- The page's scrolling under the header and above the Tour's card
- 130's freezes, which the scroll waits for

**Acceptance criteria:**
- [x] At 375 px, on the Amp card, each fader is in view while it moves and the Timeline while it freezes
- [x] At 320, 375, 601 and 860 px, every card's controls and Viewer are in view together where they fit, and in turn where they do not
- [x] A scroll by the person stops the Tour's scrolling for that card
- [x] With reduced motion, the page jumps rather than glides
- [x] From 2 × 2 up, unchanged where everything fits; where it does not, in turn, as decision 7 has it (where everything fits, as at 601 × 960 and 860 × 1100; on windows about 800 px tall it does not, and the rule above applies: see How it was built, call 1)
- [x] A browser test at 375 px checks the Amp card's fader and Timeline each come into view

**Out of scope:**
- The Tutorials (a Tutorial's step already points at its control)
- What each card says

## How it was built

- **Measured first** (Chromium, reduced motion; room between the header and the card, the span of the control and the card's first Viewer):

  | Card | 320 × 568 | 375 × 812 | 601 × 800 | 601 × 960 | 860 × 800 | 860 × 1100 | 1280 × 800 |
  |---|---|---|---|---|---|---|---|
  | Oscillators | fit (in turn once the header comes back on the way up) | fit | in turn | fit | in turn | fit | fit |
  | Filter | in turn (by 14 px) | fit | fit | fit | fit | fit | fit |
  | Amp | in turn (faders about 700 px above the Timeline) | in turn | in turn | fit | in turn | fit | in turn |
  | LFOs | in turn | fit | in turn | fit | in turn | fit | fit |

- **What the page looks at:** each card's clock (`tourAt`) now also says whether the page shows the moving control or the Viewers. The control for its first second whenever it starts from rest (a knob's move, or its leg after a hold; each new Waveform), else the Viewers. On the Amp card that is the fader through its 1 s turn and its 0.8 s return after the freeze (the next fader's turn follows on the same row), and the Timeline from the Note's onset through its freeze. In the control's turn the page brings the control and as many Viewers as fit with it; in the Viewers' turn the Viewers and the control if it fits. So where both fit the two turns are the same scroll and the page holds still.
- **Smooth, or a jump** with reduced motion, as before; the card stays where it is.
- **The person's scroll** (the wheel, a finger, the scroll keys, the scroll bar) stops the Tour's scrolling, and its re-scroll when the card changes size, for the rest of that card. A wheel or finger turning a control, or a key a control takes, is not a scroll.
- **Claude's calls, open to the owner:**
  1. **The rule goes by fit, at every width,** not by the phone's breakpoint. The brief said everything fits from 2 × 2 up; it does on tall windows (601 × 960, 860 × 1100, where the page now holds still as before), but not on windows about 800 px tall: there the Amp card (2 × 2 and a 1280 × 800 laptop), the LFO card and the Oscillators card (2 × 2) now show the control and the Viewer in turn. That follows decisions 1 and 2 and the criterion naming 601 and 860 px; it changes the Tour on short 2 × 2 and laptop windows, against "from 2 × 2 up, unchanged". Keeping it to phones would be a one-line change.
  2. **A sweep shows its control for its first second only,** then the Viewers for the rest (the Filter's Cutoff falls over 4 s and comes back over 4 s; the page goes to the Viewers after 1 s and stays for the climb back). Holding the control through the whole sweep would keep the Viewers, where the card's words point, out of view for most of the card.
  3. **The control's turn starts as the move does,** not before: the smooth scroll takes part of that first second. On the Amp card the fader's turn starts as the freeze ends, so the freeze is always seen whole.
  4. **The Amp's faders return in view:** after each freeze the page goes back to the faders while the stage is given back, then the next stage turns there; one scroll per stage each way.
- **Tests:** `src/tutorial/tour.test.ts`: the Amp's faders while they turn and go back, the Viewers through every freeze; a sweep's control first, then the Viewers; every card mostly on its Viewers. `e2e/tour.spec.ts`: at 375 px the Attack fader in view as it turns, the Timeline (and not the fader) through the freeze, then the Decay fader and its freeze; the person's wheel stops the Tour's scrolling; a wheel turning a fader does not; the scrolls glide, and jump with reduced motion; at 860 × 1100 the page holds still through an Amp pass. Red first for each.
- **Tests run:** `npx tsc`, `npm run lint`, the tutorial unit tests (all passed); the Tour spec and the Tour's tests in the About, Demo, keyboard and Bead specs, in Chromium and WebKit (41 passed each).
- **The code review** (Standards and Spec), fixed: a wheel or finger turning a control counted as the person's scroll; the faders found by a data attribute in the browser test (now by name); a moving control not on the page could put another before the Viewers; the scroll's arguments passed beside a ref holding them. The Spec's points on the fit rule, the sweep's first second and the faders' return are calls 1 to 4 above.
- **To try:** on a phone (or a window about 375 px wide), take the Tour (About) to the Amp card: the page shows the Attack fader rising, then glides to the Timeline for the Note and the freeze, back to the faders, the Decay, and so on. Scroll yourself during the card: the page stays where you put it until the next card. Try the Filter and LFO cards on a 320 px phone, and a 2 × 2 or laptop window about 800 px tall, where the Amp card now moves between its faders and the Timeline too.

## Questions for the owner

Written by the night's lead, 2026-11-02 (Claude's call, open to the owner: the code is kept on the night branch rather than set back, since the other answer is a one-line change and the owner is away all day).

1. **By fit at every width, or on phones alone?** The measurement found "from 2 × 2 up everything fits" true only on tall windows: about 800 px tall, the Amp card does not fit at 2 × 2 or on a 1280 × 800 laptop, nor the LFO and Oscillators cards at 2 × 2. As built, the Tour scrolls between control and Viewer wherever they do not fit, which changes those short 2 × 2 and laptop windows against the criterion "from 2 × 2 up, unchanged". Claude's recommendation: keep it by fit, since a card whose Viewer is out of view on a laptop shows nothing of its effect; or limit it to phones (one line), leaving short laptops as they were.

