# 150: Bead shown by default

**What to build:** The owner's idea (inbox, 2026-10-31): "Show Bead by default, without requiring to play BEAD first." Bead, the water drop of [115](./115-an-easter-egg.md), comes onto the page by itself on a first visit, and Display's Bead switch is there from the start. Playing B, E, A, D still sends it away and calls it back. It turns 115's decision 7 (Bead hidden from the tips and the README) around for what is now in plain view; its tricks stay a surprise. In v1 as Bead's polish ([131](./131-v1.md), decision 12; Claude's call, open to the owner).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Decisions

The idea is the owner's; how it is done is Claude's call, open to the owner (2026-10-31):

1. **On by default.** A visitor who has never met Bead (its stored setting still "unmet") is treated as on. A visitor who switched Bead off keeps it off; one who has it on keeps it on.
2. **Its first entrance:** a few seconds after the page is ready, by one of its ways in, as when called by the Notes; while the welcome card is up, it waits until the card is closed, so the first thing a newcomer reads is not covered or upstaged.
3. **The Notes stay:** B, E, A, D by hand sends Bead away when it is out and calls it when it is not, as now, and flips Display's switch to match (as the switch already stops the Notes calling it while off).
4. **Display's switch is shown from the start,** not only once Bead has been met, and its tip says in a line who Bead is and how to send it away: the switch, or the Notes.
5. **The words:** the README says in a line that a water drop called Bead lives on the page; [bead.md](../bead.md) no longer calls Bead hidden, its tricks still listed there and nowhere else.
6. **Reduced motion:** as now (Bead's own rule for reduced motion holds on a first visit too).

## Agent Brief

**Category:** enhancement
**Summary:** Bead comes onto the page by itself for every visitor who has not switched it off, instead of only after B, E, A, D has been played.

**Current behavior:** Bead appears only once B, E, A, D is played by hand. Its Display switch is shown only once it has been met, and its stored setting starts at "unmet". The tips and the README leave it out on purpose.

**Desired behavior:** A visitor whose stored Bead setting is "unmet" or "on" sees Bead come in by itself a few seconds after the page is ready, or after the welcome card closes when it is up. "Off" keeps it away. Display's Bead switch shows from the first visit, its tip naming Bead and how to send it away. B, E, A, D still sends it away or calls it, and the switch follows. The README gains one line about Bead; bead.md stops calling it hidden.

**Key interfaces:**
- The Display settings module's Bead setting ("unmet", "on", "off") and what reads it
- Bead's entrance (its ways in) and the B, E, A, D Notes rule
- Display's Bead switch and its tip
- The welcome card's closing
- The end-to-end tests' starting state: with Bead out by default, its pixels take the pointer, so every spec that is not about Bead starts with Bead off (one fixture), and the mascot spec starts as it needs

**Acceptance criteria:**
- [ ] A first visit (nothing stored): Bead comes in by itself once the welcome card is closed
- [ ] A visitor with Bead switched off: no Bead after a reload; one with it on: Bead as now
- [ ] Display's Bead switch and its tip show on a first visit
- [ ] B, E, A, D sends Bead away and calls it back, the switch following
- [ ] The other end-to-end specs pass unchanged, Bead kept out of their way; the mascot spec covers the default
- [ ] Bead's frame-cost test passes as before
- [ ] The README's line and bead.md's opening say so
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- New tricks ([127](./127-more-tricks-for-bead.md)) or Bead riding the LFOs ([141](./141-bead-rides-the-lfos.md))
- The tips naming Bead's tricks
