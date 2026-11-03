# 204: BAGGAGE, the air guitar and the surfing, seen

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [127](./127-more-tricks-for-bead.md): "I do not see BAGGAGE and the surfing, nor air guitar." Three of Bead's tricks that 127 built do not show for the owner: the word BAGGAGE (B, A, G, G, A, G, E played within 4 s), and two of the Demo's three acts, the air guitar on its tail and surfing an LFO's plot (127, decisions 13, 15 and 21). Polish of v1's Bead ([131](./131-v1.md)).

**Blocked by:** none. Surfing shares its ride with [197](./197-bead-rides-everywhere.md) (Bead riding the LFOs, which the owner has not seen either, [141](./141-bead-rides-the-lfos.md)); build after 197 or alongside it, so the two do not fix the same code twice (Claude's call, open to the owner).

**Status:** needs-info · bug. Polish for v1; reproduced 2026-11-02 on night/2026-11-02, waiting on the questions below

## What reproducing found (2026-11-02)

Measured headless in Chromium and WebKit, at 1280 × 720 to 1728 × 1117 (three across) and 1920 × 1080 and 2560 × 1440 (four across), the Demo played from each of its 15 parts:

- **BAGGAGE plays.** B, A, G, G, A, G, E from the computer keys and from the piano, 0.15 s to 0.62 s apart (up to 3.7 s in all), gives the suitcase every time, in both browsers; the repeated G is counted. The likely cause the owner missed it: the pace. The words have B, E, A, D's 4 s from first Note to last (127's call), so BAGGAGE's seven Notes need one every 0.67 s at the slowest, twice B, E, A, D's pace; a Note read off the letters and found on the keys is slower. A word played during a funny turn also waits for that turn's end.
- **The air guitar plays but does not read as one.** It comes in parts 2, 5, 8, 11 and 14 (and 6 and 12 in place of surfing), but its pose is the tail swung down 40 to 58° below its foot, eyes shut, a rock: on screen a tail drooping over the edge, no guitar to see.
- **Surfing almost never comes, for two causes.** (a) The turn: the acts go by the part's number, so surfing falls on parts 3, 6, 9, 12 and 15, and only part 6 (Self-Oscillation) has an LFO on; the LFO parts (4 to 8, and 13) fall mostly to conducting and the air guitar. (b) The Demo's card: three across, the page fits the window and the LFO plots sit at its foot, where the docked card covers them (at 1440 × 900 the plots are 749 to 855 px down, the card from 775, its left 37 px right of LFO 1's plot's left). Bead never surfs under a card (issue 164), so at 1440 × 900 it never surfs; from about 1470 wide a sliver of LFO 1's plot left of the card is wide enough; from 1680 wide its whole plot is clear. Four across the plots are top right, clear of the card.

Conducting shows as built.

## Questions for the owner

1. **The Demo's card over the LFO plots, three across:** at a laptop's 1440 × 900 the card covers both plots, so Bead cannot surf. What should give? Claude's recommendation: **a.** While the Demo plays, three across, the page leaves room under itself as tall as the card, and the Demo's following scrolls the LFO section clear of the card in the parts that turn an LFO; Bead then surfs where it can be seen. Other ways: **b.** the card docks to one side (right of LFO 2's plot) instead of the middle; **c.** with no plot clear, Bead surfs the Oscillator Scope's trace (127's first idea) instead; **d.** leave it: surfing only on windows from about 1470 wide, or with the card dragged aside.
2. **The turn of the acts:** may the turn follow the LFOs rather than the part's number, so surfing comes in the parts with an LFO on? Claude's recommendation: yes: each part takes the next act in the order conducting, air guitar, surfing, skipping surfing when no plot is clear; through the Demo that gives conducting at part 1, the air guitar at 2, and surfing first at part 5 (Tremolo Keys), then at 8 and 13.
3. **The air guitar's look:** may its pose change so it reads as an air guitar? Claude's recommendation: its tail raised across its front like a guitar's neck (pointing up and out, about 30° above level), strummed with a quick shake on each Note, eyes shut, rocking and a little hop on the loud ones; and the act lasts the whole part, as now.
4. **BAGGAGE's time:** give each word a second a Note (4 s for the four-Note words, as now; 7 s for BAGGAGE) rather than 4 s for all? Claude's recommendation: yes. Within 4 s still plays it, and a pace read off the letters does too.

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
