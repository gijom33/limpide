# 204: BAGGAGE, the air guitar and the surfing, seen

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [127](./127-more-tricks-for-bead.md): "I do not see BAGGAGE and the surfing, nor air guitar." Three of Bead's tricks that 127 built do not show for the owner: the word BAGGAGE (B, A, G, G, A, G, E played within 4 s), and two of the Demo's three acts, the air guitar on its tail and surfing an LFO's plot (127, decisions 13, 15 and 21). Polish of v1's Bead ([131](./131-v1.md)).

**Blocked by:** none. Surfing shares its ride with [197](./197-bead-rides-everywhere.md) (Bead riding the LFOs, which the owner has not seen either, [141](./141-bead-rides-the-lfos.md)); build after 197 or alongside it, so the two do not fix the same code twice (Claude's call, open to the owner).

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, not yet released; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

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

Decided by the owner, 2026-11-03, answering the questions above:

5. **Question 1, the card over the LFO plots, three across: left as it is** ("I would leave it"). Bead surfs only where a plot is clear of the card: on windows from about 1470 px wide, four across, or with the card dragged aside. No room is kept under the page for it ([212](./212-no-room-for-a-card-three-and-four-across.md): three and four across never scroll for a card).
6. **Question 2, the turn of the acts: as recommended** ("Yes"). Each part takes the next act in the order conducting, the air guitar, surfing, skipping surfing when no LFO plot is clear and its LFO on; through the Demo, conducting at part 1, the air guitar at 2, surfing first at part 5 (Tremolo Keys), then at 8 and 13, where a plot is clear.
7. **Question 3, the air guitar's look: as recommended** ("Yes"). Its tail raised across its front like a guitar's neck, pointing up and out about 30° above level, strummed with a quick shake on each Note; eyes shut, rocking, a little hop on the loud Notes; the act lasting the whole part.
8. **Surfing on a surfboard, leaning with the wave** (the owner's idea, inbox 2026-11-03: "Let's have Bead use a surfboard and lean with the wave"). Claude's calls, open to the owner: a small pixel board under its foot, lying along the line's slope where it stands; Bead leans with it, forward going down the wave and back going up, its tail out behind for balance; the same board on its rides outside the Demo ([197](./197-bead-rides-everywhere.md)), which draw as the surf does.
9. **Question 4, BAGGAGE's time: a second a Note** ("Yes, 7s is easier"). Each word has as many seconds as it has Notes from its first Note to its last: 4 s for B, E, A, D and the four-Note words, as now; 7 s for BAGGAGE.

## Agent Brief

**Category:** bug
**Summary:** Bead's word trick BAGGAGE, and its air guitar and surfing during the Demo, do not show for the owner, though 127 built them.

**Current behavior:** The owner sees no word trick for B, A, G, G, A, G, E. The owner did not say whether the other words (DEAD, FADE, CAFE, DEAF) and conducting show; check them too. During the Demo, the owner sees neither the air guitar on its tail nor Bead surfing an LFO's plot.

**Desired behavior:**
- B, A, G, G, A, G, E within 7 s (a second a Note), from the computer keys, the piano or a Controller, plays BAGGAGE's trick, the repeated Notes counted.
- During the Demo, each part has one act in turn: conducting, the air guitar, surfing. Surfing goes on the first LFO plot in view whose LFO is on, its Depth above 0; with none, the part is conducting or the air guitar instead.
- A person watching one Demo through sees each act that can play.
- Surfing, and riding a plot outside the Demo, show Bead on a surfboard along the line's slope, leaning with the wave.

**Key interfaces:**
- Bead's words (the Notes heard and each word's window, a second a Note)
- Bead's Demo acts and their turn
- The LFO plots, and whether one is in view and its LFO on

**Acceptance criteria:**
- [x] The cause of each trick not showing is found and written in the issue
- [x] BAGGAGE plays its trick from the computer keys and the piano, fast and slow within 7 s; a four-Note word still within 4 s
- [x] In one Demo at three across with an LFO on, Bead conducts, plays the air guitar and surfs, each at least once
- [x] With no LFO on, the parts are conducting and the air guitar
- [x] Surfing and riding show the board along the line's slope, Bead leaning forward going down and back going up
- [x] Browser tests for BAGGAGE and for the three acts in a Demo

**Out of scope:**
- Bead's rides outside the Demo ([197](./197-bead-rides-everywhere.md)), but for the board and the lean, which they share
- New tricks or words

## How it was built

Built 2026-11-03 on night/2026-11-03, test-first. The causes, as reproducing found them: **BAGGAGE** had the same 4 s as B, E, A, D for seven Notes, twice the pace; **the air guitar** was drawn as the tail swung 40° down below the foot, which read as a droop, not a guitar; **surfing** fell on the parts by number (3, 6, 9, 12, 15), of which only part 6 has an LFO on, and three across below about 1470 px wide the Demo's card covers the plots.

- **The words** (decision 9): each word has a second a Note from its first Note to its last: 7 s for BAGGAGE, 4 s for D, E, A, D and the other four-Note words, and B, E, A, D's own 4 s, all from one named rule.
- **The turn of the acts** (decision 6): each new Demo part takes the next act after the last part's, conducting, the air guitar, surfing; a Demo begun starts conducting. A part on surfing's turn surfs whenever an LFO plot is clear and its LFO on, and conducts while none is; a part that never surfed counts as conducting, so the next plays the air guitar. Played from part 1: conducting at 1, the air guitar at 2, surfing first at 5 (Tremolo Keys), then at 8 and 13 where a plot is clear. The card stays as it is (decision 5).
- **The air guitar** (decision 7): its tail straight (drawn rising 30° from level), up across it like a guitar's neck, shaken a few degrees for 0.2 s on each Note; eyes shut, rocking, and the hop on the loud Notes only.
- **The surfboard** (decision 8): a 13-pixel board in the Filter's colour with the Oscillator's stripe, under its foot in place of its legs, its nose turned up on the side it faces as drawn. On the wave the whole drawing turns with the line's slope under its middle (read 8 px across, never steeper than 35°), so it leans forward going down and back going up whichever way it goes; its tail raised 15° out behind. The same on its rides outside the Demo. During a funny turn on the wave the board is put away, and the turn plays as anywhere.
- **Docs:** `docs/bead.md` and a dated line in [127](./127-more-tricks-for-bead.md).
- **Tests:** unit tests for the words' windows, the turn of the acts (with and without an LFO, a surfing turn waiting for a clear plot), the air guitar's pose and the board's lean; browser tests for BAGGAGE (fast and a Note a second on the computer keys, and from the piano), for the acts in turn at 1728 × 1117 with surfing on its board leaning with the wave at part 5, and for the board on a ride outside the Demo. Not tested: BAGGAGE from a Controller, which goes through the same Notes as the piano.

Claude's calls, open to the owner:

1. A part on surfing's turn **changes act within the part** if a plot comes clear or goes under the card (scrolled, or the card dragged): it conducts until it can surf, and conducts again once it cannot.
2. A part **played from its button** takes the next act after the last part's, as the Demo going on would; only a Demo begun again starts with conducting.
3. **The neck** is the straight tail Resonance already draws, on Bead's usual side rather than drawn across its front; its strum is a shake of ±8° fading over 0.2 s.
4. **The board's look:** the Filter's colour with the Oscillator's stripe, 13 pixels long, nose up; its tail raised 15° on it; the lean at most 35°.

**To try in the app:** with Bead out, play J, H, G, G, H, G, D slowly, about a Note a second: the suitcase. Then, on a window at least about 1470 px wide three across (or four across), play the Demo from part 1 and watch parts 1 to 5: the baton, the air guitar with its tail up like a neck, the baton again at part 3 (no LFO), the air guitar at 4, and at part 5 Bead on its surfboard on the LFO's plot, leaning down the wave and back up it. Outside the Demo, set LFO 1 to a slow Sine (0.5 Hz, some Depth) and drop Bead on its plot: the same board.

**Since then (2026-11-04):** the air guitar's neck is drawn on Bead's usual side (call 3), not across its front as "How it was built" says; `docs/bead.md` and the code's comment say so.

**Since then (2026-11-04, issue [230](./230-the-demos-card-small-in-the-corner.md)):** in three and four across the Demo's card sits in the window's bottom right corner, opening folded and small there; at 1440 × 900 Bead surfs LFO 1's plot, the card even unfolded, and a card moved over a plot still keeps Bead off it.
