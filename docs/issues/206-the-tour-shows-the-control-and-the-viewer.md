# 206: The Tour shows the control and the Viewer

**What to build:** The owner's idea (inbox, 2026-11-02), found trying [130](./130-the-tour-freezes-to-show-adsr.md): "Yes but on small screen, we shoukd show both the settings and viewer. If it cannot fit screen we should show each in turn by scrolling." On a phone, 130 brings only the Envelope Timeline into view on the Tour's Amp card, so the person sees the picture freeze but not the Attack, Decay, Sustain and Release faders the Tour moves. Polish of v1's Tour ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Decided by the owner, 2026-11-02:

1. **On a small screen the Tour shows both the controls it moves and the Viewer that shows them,** at once where they fit.
2. **Where they do not fit, each in turn, by scrolling:** the control while it moves, then the Viewer while it shows the result.

Claude's calls, open to the owner:

3. **Every card, not the Amp's alone:** each Tour card that moves a control and points at a Viewer follows the same rule (the Oscillators, the Filter, the Amp, the LFOs), measured at each width the Tour supports.
4. **The scroll is smooth and timed to the action:** the page scrolls to the control just before it moves, holds while it moves, then scrolls to the Viewer and holds through what the card shows there (on the Amp card, each freeze); the card stays where it is. With reduced motion, the page jumps instead of gliding.
5. **The person's own scroll wins:** a scroll by the person stops the Tour's scrolling for that card, as Space stops its freezes.
6. **Measured first,** at 320, 375, 601 and 860 px, for each card: whether control and Viewer fit together between the header and the card.

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
- [ ] At 375 px, on the Amp card, each fader is in view while it moves and the Timeline while it freezes
- [ ] At 320, 375, 601 and 860 px, every card's controls and Viewer are in view together where they fit, and in turn where they do not
- [ ] A scroll by the person stops the Tour's scrolling for that card
- [ ] With reduced motion, the page jumps rather than glides
- [ ] From 2 × 2 up, unchanged
- [ ] A browser test at 375 px checks the Amp card's fader and Timeline each come into view

**Out of scope:**
- The Tutorials (a Tutorial's step already points at its control)
- What each card says
