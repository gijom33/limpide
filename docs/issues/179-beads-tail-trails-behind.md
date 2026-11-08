# 179: Bead's tail trails behind

**What to build:** The owner's idea (inbox, 2026-11-01): "Bead's tail should go to left when it goes right. It's good to have it on right when static as that's what the logo looks like." Bead is drawn as the logo's drop, its trailing wave (its tail) on its right; it turns round only in some funny turns, so when it strolls, hops or leaps to the right its tail leads instead of trailing. Polish of Bead in v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: "Perfect."

## Decisions

1. **Moving, the tail trails:** going right, its tail on its left; going left, on its right. **Still, the tail on its right,** as the logo has it. Decided by the owner, 2026-11-01.

Claude's call, let stand by the owner in 1.20.0:

2. **It turns round as it sets off and as it stops,** with the turn its funny turns already use (its width going through zero), quickly enough that a short step does not look like a spin: under a fifth of a second, and not at all for a step shorter than its own width.
3. **What counts as moving:** a stroll, a hop along, a scoot, a leap or fall between Sections, a ride on an LFO plot (141) and the Demo's surf; a funny turn keeps its own turning; a dance step to a Note (a few pixels) does not turn it; hovering (142) faces as still.
4. **What follows the turn:** everything drawn on it that has a side (its twin by Detune keeps Detune's side of the page, as 174 made it; its props and the water gun's jet follow its facing as they do in the tricks that turn it).

## Agent Brief

**Category:** enhancement
**Summary:** Bead faces the way it moves, so its tail trails behind it, and faces as the logo when still.

**Current behavior:** Bead's facing changes only in a few funny turns; strolling, leaping or riding to the right it keeps its tail on its right, ahead of it.

**Desired behavior:** When Bead sets off to the right it turns round (tail on its left); to the left it faces as drawn (tail on its right); when it stops it faces as drawn. The turn is quick and skipped for small steps and dance steps; funny turns keep their own facing; its twin keeps Detune's side; props and jets follow its facing. Reduced motion: it faces its way with no turning animation.

**Key interfaces:**
- Bead's pose (its turn) and its moves (stroll, gaits, leaps, rides, surf)
- Its drawing (the twin, props, jets)

**Acceptance criteria:**
- [ ] ~~Strolling right: tail on its left; strolling left: on its right; standing still: on its right (unit tests on the pose; a mascot spec check in one browser)~~ (not checked at the time)
- [ ] ~~A dance step to a Note does not turn it; a funny turn keeps its own turning~~ (not checked at the time)
- [ ] ~~Its twin stays on Detune's side whichever way it faces~~ (not checked at the time)
- [ ] ~~The mascot spec and Bead's frame-cost test pass as before~~ (not checked at the time)

## How it was built

Bead keeps one facing, eased like its funny turns' (its width through zero): setting off to the right it turns round, its tail trailing on its left, in 0.15 s; going left it stays as drawn; as it stops, it turns back to the logo's way. Its way is a stroll, a hop along, a scoot (running off too), the Demo's surf and a ride on an LFO plot along its line, and between Sections a leap or fall across; its place now says how far across each leap goes, so it faces its way from the crouch to the landing, and turns back as it lands rather than at once. What it does not turn for: a step shorter than its own width (its 44 px, tail and all), dance steps to the Notes however far they carry it, a funny turn (which keeps its own turning, the suitcase still dragged behind it to the right), hovering, pointing the way in a Tutorial or the Tour (151's facing of the control is unchanged), and in the pointer's hold or thrown. Turned round, its eyes on its way are swapped in its drawing so they still look where it goes. Turned round about a fifth of its width, its drawing reaches 26 px past its box's left, so setting off right from its line's left end it turns only once its trailing tail is clear of that end (else, at four across, it covered the Hold and Tap buttons its room keeps it off). Its twin keeps Detune's side of the page as 174 made it (the twin's spec now skips the one frame Bead is edge-on, where neither has a side; the hover spec now measures where Bead is by its box, not its drawing, which turns), and its props and the water gun's jet follow its facing as before. Sent away mid-stroll, it turns back as it melts. With reduced motion it never strolls, so it faces as drawn.

Claude's calls, let stand by the owner in 1.21.0:

1. **Its own width is its whole drawing's, 44 px:** a Cutoff turn's step (24 px) and Glide's slide (40 px at most) do not turn it; only walks of 44 px and more do, and a Cutoff turned in steps walks it step by step, so its tail leads there as before.
2. **Turning takes 0.15 s**, a straight ease of its width, like the turns of its tricks; from its line's left end it turns a little later, once its tail has room behind it, rather than its tail hanging past the end.
3. **A funny turn begun while it is turned round** (a word, or the fright at its line's right end) turns from there to the trick's own facing in that 0.15 s, its eyes kept on the trick's side; one that faces that way already (the water gun fired to the right) just stays turned round.
4. **Leaping or falling between Sections**, it now shows the facing its motion has (turned its way, or a funny turn's, or pointing the way's) rather than always as drawn.
5. **A scoot leans in less with its tail trailing:** 3° rather than 8°, as the 8° lean lifted a trailing tail's tip 5 px (into the header's buttons, 2 px over its line at four across); with its tail leading, as when scooting left before, it leans 8° as ever.

Known before this: at four across Bead strolls 2 px under the header's Hold, Tap, Song and About buttons, so stretched by a held Note and bobbing it can touch them, and the mascot spec's "four across … covering nothing" fails now and then on the tip as on this branch (6 runs in 8 on the tip, alone).

**Since then (2026-11-01, issue 154):** the cause was 154's buttons reaching the header's foot; from 861 px wide and 700 px tall the sections now start 36 px under the header, and the test passes 12 runs in 12. Claude's call, let stand by the owner in 1.21.0.

What to try in the app: watch Bead stroll along its edge: to the right its tail is behind it, on its left; to the left, and standing still, on its right, as the logo. Play a quick run of Notes: it dances along without turning. Send it to another Section (wait for a visit) and watch it leap across facing its way. Turn Osc 2's Detune as it strolls right: the twin stays on Detune's side.

