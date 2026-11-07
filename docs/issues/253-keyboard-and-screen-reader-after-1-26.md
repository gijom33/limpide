# 253: Keyboard and screen reader after 1.26

**What to build:** Review 6's findings on 1.26.1 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/6-accessibility.md)):

1. **Tap Tempo changes the BPM without announcing it** to a screen reader (WCAG 4.1.3, since 1.21.1; [189](./189-accessibility-after-1-21.md) meant to announce it).
2. **Escape does not close the Tour's card or a Tutorial's,** though it closes every other panel.
3. **With Safari's default Tab setting, Tab skips every plain button** (Patch, ‹ ›, Demo, Song, Tutorial, About, MIDI, Display, Hold, Tap…): 32 stops against Chromium's 56, a Preset or a panel out of reach (WCAG 2.1.1).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** The tapped tempo is not spoken, Escape leaves the Tour's and the Tutorials' cards open, and Safari's default Tab setting skips every button.

**Current behavior:** As the three items above say. Safari reaches a button by Tab only with "Press Tab to highlight each item" turned on, which most people leave off.

**Desired behavior:**
- Each new BPM from Tap is announced politely, once the tapping settles, as a clock's is meant to be.
- Escape on the Tour's card or a Tutorial's closes it, as Done or Quit does, focus returning to what opened it.
- With Safari's default setting every control a keyboard needs is reachable by Tab, or the page offers another way to each (the buttons made focusable for Tab, without changing how they look or what they do elsewhere).

**Key interfaces:**
- The tempo's live region
- The Tour's and the Tutorials' cards and their close
- What Tab reaches in WebKit

**Acceptance criteria:**
- [ ] A test: three taps change the BPM and the live region says the new tempo
- [ ] A test: Escape closes the Tour's card and a Tutorial's, focus back on their opener
- [ ] A WebKit test with Tab reaching every header button and a Preset, as in Chromium
- [ ] Every test passes in both engines

**Out of scope:** a real screen reader's run (a human check, later).
