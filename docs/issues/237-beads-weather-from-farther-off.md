# 237: Bead's weather from farther off

**What to build:** The owner's idea (inbox, 2026-11-04): "I would like if, for Bead's umbrella animation, the rain comes from top of screen. Similarly, with the sun melting and clous animations, would be great if there are farther from Bead." Today the umbrella's rain falls from a stretch of sky 120 px over Bead's edge, 80 px either side of it, and the evaporating trick's sun and cloud are drawn just over its head, as part of its picture ([127](./127-more-tricks-for-bead.md)). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-05). Built (2026-11-05) on day/2026-11-05 and on main, merged into main, not yet released; accepted by the owner: "OK with the rest of the tickets reviewed", then, of the rain from its own heights, "Also like the new rain animation!"

## Decisions

Decided by the owner, 2026-11-04:

1. **The umbrella's rain comes from the top of the screen.**
2. **The sun and the cloud are farther from Bead.**

Claude's calls, open to the owner:

3. **From the window's top edge,** behind the header, which stays on top ([200](./200-beads-tricks-above-the-top-rows.md)); across the same stretch as now, 80 px either side of Bead.
4. **Rain falls as rain does, fast:** each drop takes about as long as today's to land, so the trick keeps its length, and the first drops leave the top early enough to land as the umbrella's wince starts.
5. **The sun and the cloud twice as far above Bead as today,** inside the window and clear of the header; where there is no room (Bead near the top), as far as fits. The cloud's shower falls that longer way onto Bead, and the steam rises to the sun.
6. **With reduced motion,** as each trick is today.

Decided by the owner, 2026-11-05, trying it ("The rain does not look realistic, should see pixel "drops" fall at a realistic speed compared the Bead's height (if it were a human!)"); it replaces call 4:

7. **Pixel drops falling at rain's speed, at Bead's scale as if it were a person.**

Claude's calls, open to the owner:

8. **The speed:** Bead's 26 px as a person's 1.7 m, and rain at 5 to 8 m/s, as drops of 1 to 3 mm fall: 80 to 120 px a second, steady (rain falls at its own top speed, not speeding up). A drop takes some 5 s from a phone's top to Bead.
9. **Rain already falling when the trick starts:** the stretch from the window's top down to Bead fills with drops at once, as rain is seen to start all around, and new drops come in at the top; so the wince and the umbrella keep their times and the trick its 3.6 s.
10. **As many drops in the air as Bead's droplets allow** (60 at most, some kept for its splashes): slower drops are more in the air at once, so new ones come in only as others land. When the rain stops, the drops still in the air fade out within a third of a second, before the umbrella goes away, and the umbrella stops every drop that comes to it while it is open.

Decided by the owner, 2026-11-05, on seeing decisions 7 to 10 built (not committed): "You know what? I prefer the way the rain was before, even if local to Bead. Maybe all I wanted is the drops not all coming from the same imaginary line." It replaces decisions 1 and 7 and calls 3, 4 and 8 to 10:

11. **The rain as before 237, local to Bead, its drops not all from one line.**

Claude's call, open to the owner:

12. **Each drop from its own height, 60 to 120 px over Bead's edge,** the highest where all of them started before, and under what is over the page there, as before. Bead winces as the rain starts, as before.

## Agent Brief

_Since then (2026-11-05): the rain part of this Brief is replaced by decisions 11 and 12, near Bead and from varied heights; see the last section._

**Category:** enhancement
**Summary:** Bead's umbrella rain starts at the top of the window, and its evaporating trick's sun and cloud sit farther above it.

**Current behavior:** In the umbrella trick, the rain falls from 120 px above Bead's edge and ends on the open umbrella or the ground. In the evaporating trick, the sun and the cloud are drawn just over Bead's head, and the cloud's shower falls from just under it.

**Desired behavior:**
- The umbrella's rain starts at the window's top edge, behind the header, over the same width as now, and still ends on the umbrella's canopy or the ground; the trick lasts as long as now.
- The sun and the cloud are drawn about twice as far above Bead as now, inside the window and clear of the header, nearer where there is no room; the steam rises to the sun and the shower falls from the cloud onto Bead.
- Bead's frame cost stays within its budget with the rain's longer fall.
- Browser tests: the rain's first drops start at the window's top; the sun and cloud sit at their new height and inside the window.

**Out of scope:** the other tricks, the drops' look.

## How it was built

- **The rain** starts at the window's top, across the same 80 px either side of Bead, and still ends on the open umbrella or the edge. Each drop is thrown down as fast as it needs to land in 0.29 s, as long as a drop took from 120 px over the edge before, so the farther it falls the faster it goes, and no more drops are in the air at once, as many to draw each frame as before (the frame-cost test passes; it measures Bead at rest, not raining). Where the header stays on screen (a phone, 2 × 2) the drops start behind it.
- **The umbrella's timing:** the rain starts with the trick, and Bead winces 0.29 s in, as the first drops land; the umbrella pops up and opens as quickly after that as before. The trick still lasts 3.6 s.
- **The sun and the cloud** are drawn Bead's own height (26 px) higher than before, their middles about twice as far above its foot (the sun's 49 px, was 23; the cloud's 56, was 30). Where the room up to the header's foot (or the window's top, the header scrolled away) is short, they go up as far as fits, in whole pixels of Bead's grid; with no room, where they were. The cloud's shower falls from wherever the cloud is, and the steam rises to the sun's height, drawn out to get there by the end of its life, still slowing as it goes, and never rising less than before.
- With reduced motion, as before: Bead plays no tricks.
- Tests: the drops' fall time from 120 px and from 700 px, the wince as the first drops land, the steam rising to the sun's height (and under the header where the sun is low), how far the sun and cloud go up with and without room; in the browser, on a phone, the rain's highest drop near the window's top and within 100 px either side of Bead, and the sun and cloud about twice as far above it, under the header, at a phone's width and three across. Run: `tsc`, the lint, the unit tests of the files touched, and the whole mascot spec in Chromium (the frame cost included) and WebKit, all passing.

Claude's calls, open to the owner:

1. **Three across, on its home edge just under the header, the sun and cloud hardly move:** the header's buttons are right over Bead there, with 36 px between the header's foot and Bead's, so the sun goes up 4 px and the cloud not at all (decision 5's "as far as fits"). They are farther off wherever Bead stands lower: on a visit to a lower section, on a phone or in 2 × 2. Drawing them over the header's buttons there, or the sun farther to the side, would be a new call.
2. **On a wide window the rain falls over the header,** from the window's very top, as it already did from Bead's home edge there: the header does not sit over the page on a wide window (200, decision 4). It starts behind the header only where the header stays on top.
3. **The drops land in the same time from any height,** so from far up they fall fast: on a phone, from the window's top to Bead's edge some 600 px down, up to about 40 px from one frame to the next, so they may read as dots jumping down rather than streaks. Their look is unchanged (out of scope); slower drops would mean more in the air at once, or a longer trick.
4. **The steam rises to the sun's height,** straight up from Bead's head, not across to the sun, which stands to its left.
5. **Bead's wait for the first drops:** for the first 0.29 s of the trick it rains and Bead does nothing yet, so the wince and the umbrella come that much later within the same 3.6 s.

To try: let Bead be, playing nothing; every few seconds it does a funny turn, the umbrella among the most frequent. Changing the Filter Slope while nothing plays cues the next funny turn, so turn it a few times to go through them faster; evaporating comes once in each round of about thirty. On a phone or a window under 860 px wide, the rain should come down from behind the header, and the sun and cloud stand well above Bead. Three across, wait for Bead to visit a lower section to see the sun and cloud higher.

## The rain as before, from varied heights (2026-11-05)

- **The rain falls as before 237,** over the same 80 px either side of Bead, 160 to 220 px a second under gravity, ending on the open umbrella or the edge; Bead winces as it starts, and the trick lasts 3.6 s.
- **Each drop starts from its own height,** 60 to 120 px over Bead's edge (decision 12), where before every drop left from 120 px; under what is over the page there, as before, so with the header close over Bead they start lower.
- The sun, the cloud and the steam stay as built.
- Tests: the start heights' spread and the ceiling over them; the umbrella's timing as before; in the browser, on a phone, the rain at most 120 px over Bead and within 100 px either side. Run: `tsc`, the lint, the mascot unit tests and the whole mascot spec in Chromium.

To try: as above; watch the drops start from different heights.
