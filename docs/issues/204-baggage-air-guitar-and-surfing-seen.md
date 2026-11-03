# 204: BAGGAGE, the air guitar and the surfing, seen

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [127](./127-more-tricks-for-bead.md): "I do not see BAGGAGE and the surfing, nor air guitar." Three of Bead's tricks that 127 built do not show for the owner: the word BAGGAGE (B, A, G, G, A, G, E played within 4 s), and two of the Demo's three acts, the air guitar on its tail and surfing an LFO's plot (127, decisions 13, 15 and 21). Polish of v1's Bead ([131](./131-v1.md)).

**Blocked by:** none. Surfing shares its ride with [197](./197-bead-rides-everywhere.md) (Bead riding the LFOs, which the owner has not seen either, [141](./141-bead-rides-the-lfos.md)); build after 197 or alongside it, so the two do not fix the same code twice (Claude's call, open to the owner).

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Decided by the owner, 2026-11-02:

1. **The three show as 127 decided:** BAGGAGE's word trick on its seven Notes; during the Demo, each part one of conducting, the air guitar and surfing, in turn (127, decision 13), surfing on an LFO's plot whose LFO is on (decisions 15 and 21).

Claude's calls, open to the owner:

2. **Reproduce first, in the browser the owner uses,** at the widths the owner tries (a laptop, three or four across): BAGGAGE played on the computer keys, the piano and a Controller, fast and slow within 4 s; the Demo played through, part by part, with the LFO plots in view and not, an LFO on and off. Find why each does not show before changing it: a cause per trick, or one shared (the acts' turn, a funny turn waiting, the plot not counted as in view, the repeated G read as one Note).
3. **The Demo's turns are visible to a person watching once:** if the turn order means the air guitar or surfing only comes late in the Demo, or never while a plot is out of view, the order puts each act early enough to be seen in one Demo.
4. **A test for each:** the word, each act appearing in a Demo, in a browser.

## Agent Brief

**Category:** bug
**Summary:** Bead's word trick BAGGAGE, and its air guitar and surfing during the Demo, do not show for the owner, though 127 built them.

**Current behavior:** The owner sees no word trick for B, A, G, G, A, G, E. The owner did not say whether the other words (DEAD, FADE, CAFE, DEAF) and conducting show; check them too. During the Demo, the owner sees neither the air guitar on its tail nor Bead surfing an LFO's plot.

**Desired behavior:**
- B, A, G, G, A, G, E within 4 s, from the computer keys, the piano or a Controller, plays BAGGAGE's trick, the repeated Notes counted.
- During the Demo, each part has one act in turn: conducting, the air guitar, surfing. Surfing goes on the first LFO plot in view whose LFO is on, its Depth above 0; with none, the part is conducting or the air guitar instead.
- A person watching one Demo through sees each act that can play.

**Key interfaces:**
- Bead's words (the Notes heard and the 4 s window)
- Bead's Demo acts and their turn
- The LFO plots, and whether one is in view and its LFO on

**Acceptance criteria:**
- [ ] The cause of each trick not showing is found and written in the issue
- [ ] BAGGAGE plays its trick from the computer keys and the piano, fast and slow within 4 s
- [ ] In one Demo at three across with an LFO on, Bead conducts, plays the air guitar and surfs, each at least once
- [ ] With no LFO on, the parts are conducting and the air guitar
- [ ] Browser tests for BAGGAGE and for the three acts in a Demo

**Out of scope:**
- Bead's rides outside the Demo ([197](./197-bead-rides-everywhere.md))
- New tricks or words
