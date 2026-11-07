# 254: The Tour keeps what it turns in view

**What to build:** Review 5's finding on 1.26.1 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/5-learner-teacher.md)): the Tour scrolls the control it turns out of view, the Amp card's Attack fader at 1440 × 900 and 1920 × 1080, the Filter card's Cutoff at 1920 × 1080. [206](./206-the-tour-shows-the-control-and-the-viewer.md) meant the Tour to show the control and its Viewer together.

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** On large windows the Tour scrolls away from the control its card is turning.

**Current behavior:** On the Amp card at 1440 × 900 and 1920 × 1080, and on the Filter card at 1920 × 1080, the control the card moves (Attack, Cutoff) ends out of the viewport or under the card.

**Desired behavior:** On every card, at every width the Tour runs at, the control it turns is in view and not under the card the whole time it moves, with its Viewer as 206 wants where both fit.

**Key interfaces:**
- The Tour's scroll for each card
- The card's place against the control

**Acceptance criteria:**
- [ ] A test walks every card at 1440 × 900, 1920 × 1080 and a phone, and checks the turned control is in the viewport and clear of the card
- [ ] 206's tests keep passing
- [ ] Every test passes in both engines and in Linux's fonts

**Out of scope:** the cards' words and order (the Tour's ending is [260](./260-small-things-for-newcomers-after-1-26.md)'s).
