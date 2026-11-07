# 260: Small things for newcomers after 1.26

**What to build:** Five ideas of the full review round on 1.26.1, polish on what is built (the inbox, 2026-11-07; reviews [1](../reviews/2026-11-07/1-curious-contact.md), [16](../reviews/2026-11-07/16-synth-neophyte.md) and [20](../reviews/2026-11-07/20-curious-kid.md)):

1. **Bead's card says to tickle it "with the mouse",** which a finger cannot, and never says it can be picked up and thrown, the best trick on a tablet (review 20).
2. **On a phone a Tutorial's Next moves:** alone on a second row before the Step is made, at the first row's end after (review 16).
3. **On a phone a Display Step done by hand leaves the Display panel** over what the Step's note describes (Ideal in Sub Ladder 4 and Bass 4, the Snapshot in Acid 2) until Next (review 16).
4. **The Tour ends on the geek extras** (the Synth Geek Layer, then "Build a Sub Ladder" as card 6's main button), so a newcomer leaves by Done with nothing to play (review 1).
5. **The Song says nothing once it plays:** a line inviting a newcomer to flip Presets with › or turn a knob over it (review 1).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's five small ideas).

## Agent Brief

**Category:** enhancement
**Summary:** Bead's card names the finger and the throw, a Tutorial's Next stays put on a phone, the Display panel closes after a Display Step on a phone, the Tour ends on something to play, and the Song invites playing over it.

**Current behavior:** As the five items above say.

**Desired behavior:**
- Bead's card speaks of a finger as well as the mouse, and says Bead can be picked up and thrown.
- On a phone a Tutorial's Next keeps one place, before and after the Step is made.
- On a phone a Display Step made by hand closes the Display panel, so what the Step's note describes is in view.
- The Tour's last card leaves the newcomer with something to play (a Preset to try, the keyboard, the Song), the Geek Layer and the Tutorials offered before it rather than as the way out.
- While the Song plays, a short line (one line, the short-words rule of [156](./156-one-line-shorter-words.md)) invites flipping Presets with › or turning a knob over it.

**Key interfaces:**
- Bead's card
- A Tutorial's card on a phone
- The Display Steps
- The Tour's last cards
- The Song's card or caption

**Acceptance criteria:**
- [ ] Tests for each, on a phone where the item is a phone's
- [ ] The Tour's and the Tutorials' tests keep passing, their words checked by the short-words rule
- [ ] Every test passes in both engines and in Linux's fonts

**Out of scope:** the Tour's other cards (their words for a ten-year-old are v2, [262](./262-v2-ideas-from-the-1-26-1-round.md)); the control the Tour turns ([254](./254-the-tour-keeps-what-it-turns-in-view.md)).
