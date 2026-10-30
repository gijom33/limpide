# 105: The header, panels and cards on every screen

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 1, 2, 3 and 7, [curious contact](../reviews/2026-10-30/1-curious-contact.md), [synth enthusiast](../reviews/2026-10-30/2-synth-enthusiast.md), [UI maniac](../reviews/2026-10-30/3-ui-maniac.md), [recruiter](../reviews/2026-10-30/7-recruiter.md)):

- From 601 px up the MIDI panel is as wide as the MIDI button (60 px at 1440, 34 at 690): one word a line, MIDI Learn and Quick Setup clipped, the Bend choices over the Amp section.
- The Patch name is cut even when short: every Preset reads "I…" or "S…" at 601 px (a 17 px text box), and longer names (Split Octave Bass) are cut from 861 to 1100 px.
- On a phone (393 × 659, and 393 × 700 in LinkedIn's browser) the welcome's credits push Play the Demo, Follow the Tutorial and Close below the fold, with no hint that it scrolls.
- On a phone the Bass Tutorial's Step 4 points at the Oscillator Spectrum, hidden under its own docked card; the page does not scroll to it, and the Step's text is cut short with "…".
- The mouse wheel cannot turn Osc 1's or Osc 2's Octave (a notch rounds back to the same octave), nor small trackpad scrolls the Semitone.

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** What the reviewers found cut, hidden or stuck on particular screens works on every layout.

**Current behavior:** as listed above.

**Desired behavior:**
- **MIDI panel:** as wide as its content needs (up to its existing maximum) at every width, its words on whole lines, nothing clipped, the Bend choices inside its border.
- **Patch name:** a Preset's name shows whole wherever the header has the room; at 601 px at least a short name ("Init", "Kick", "Breathing Pad") shows whole. Where a long name must be cut, it is cut with an ellipsis after as many letters as fit.
- **Welcome on a phone:** Play the Demo, Follow the Tutorial and Close are on the first screen at 393 × 659; the credits come after them, or scroll inside the card with a visible hint.
- **Tutorial on a phone:** each Step's control and the Viewer it points at are scrolled clear of the docked card, and the Step's whole text can be read.
- **Stepped knobs:** each wheel notch or trackpad scroll that goes past a step's threshold moves a stepped knob (an Octave, a Semitone, any choice-like knob) by one step; small scrolls add up until they do.

**Key interfaces:**
- The MIDI panel, the Patch picker's name, the welcome card
- The Tutorial's scrolling of a Step into view
- The knob's wheel handling for stepped Parameters

**Acceptance criteria:**
- [ ] At 601, 690, 1440 and 1920 px the MIDI panel's content fits inside it (no clipping, no wrap mid-word)
- [ ] At 601 px "Init" shows whole; at 861 to 1100 px a test lists the names it cuts, none under the room it has
- [ ] At 393 × 659 the welcome's three buttons are inside the viewport on first load
- [ ] On a phone, each Step of every Tutorial brings its control and Viewer clear of the card (the existing check extended to the Viewer a Step names)
- [ ] One wheel notch on an Octave moves it one octave; ten small trackpad deltas adding to one notch move a Semitone one step
- [ ] Every test passes in Linux's fonts too (the Verdana emulation)

**Out of scope:**
- The icon-only header buttons with Tips off ([106](./106-header-icons-named-with-tips-off.md), waiting on the owner)
- The review's other nitpicks (the piano off-centre outside 1205–1924 px, first rows not aligned across columns, the tabs' hidden dots' space): left in review 3's report for a later pass
