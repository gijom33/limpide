# 141: Bead rides the LFOs

**What to build:** The owner's idea (inbox, 2026-10-31): "I really wanted Bead to sometime \"ride\" the LFOs. Let's make it so if the waveform is suitable to a nice move and rate is slow enough." Today Bead surfs an LFO's plot only as one of its acts during the Demo ([bead.md](../bead.md)); this lets it ride one now and then while the person plays.

**Blocked by:** none

**Status:** superseded (2026-11-02) by [197](./197-bead-rides-everywhere.md). Built (2026-11-01) on night/2026-10-31 and released; tried by the owner: "I never see Bead surf anymore. I filed another issue for that." 197 makes the rides happen, on a phone and in 2 × 2 too.

## Agent Brief

**Category:** enhancement
**Summary:** Now and then, outside the Demo, Bead jumps onto an LFO's plot and rides its line, when that LFO's shape and speed make a ride worth watching.

**Current behavior:** Bead surfs an LFO's plot only during the Demo, as one of its acts. Otherwise it stays on its section's edge or visits another section now and then.

**Desired behavior:**
- **When it may ride:** an LFO is on (its Depth above 0), its plot is in view and wide enough for Bead (as the Demo's surf already checks), its Waveform is a Sine or a Triangle (a Saw's or a Square's cliff would throw it off rather than carry it), and its Rate is 1 Hz or slower (with Sync, issue 112, the Hz the note value gives).
- **How often:** as one of its visits: when one is due, a rideable LFO is a choice beside the sections in view; it rides for 8 to 18 seconds, then goes home as from a visit.
- **The ride:** the same as the Demo's surf: it jumps onto the plot and rides the line under its middle as the plot draws it.
- **It gets off** with a jump home when the LFO stops being rideable (the Depth to 0, a Waveform or a Rate out of the bounds, the plot out of view), when it is picked up, or when it leaves.
- **Never** while the Demo plays (its acts rule there), while reduced motion is asked for, or in the middle of a funny turn.
- **[bead.md](../bead.md)** lists the new ride beside the Demo's surf.

**Key interfaces:**
- Bead's choice of visits and its perch
- The LFO plot's line, as the Demo's surf reads it
- The Patch's LFO Waveforms, Rates and Depths

**Acceptance criteria:**
- [x] A unit test of the choice: a Sine or a Triangle at 1 Hz or slower with Depth above 0 is rideable; a Saw, a Square, a Rate over 1 Hz or a Depth of 0 is not
- [x] An e2e test: with a slow Sine on LFO 1 and a visit due, Bead's foot follows the plot's line; turning the Depth to 0 sends it home
- [x] No ride while the Demo plays or under reduced motion
- [x] Bead's frame-cost test still passes
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- New moves on the ride (tricks belong to [127](./127-more-tricks-for-bead.md))
- Riding the Envelope Timeline or other Viewers

## How it was built

- **The choice:** a pure `ridesFor` beside Bead's perch choice takes both LFOs and the tempo and gives the LFOs it may ride: Depth above 0, a Sine or a Triangle, 1 Hz or slower (with Sync, the Hz its note value gives at the tempo), none while the Demo plays or with reduced motion. Its unit tests cover each bound, a synced quarter and bar at 60 and 120 BPM, the Demo and reduced motion.
- **As a visit:** when a visit is due (three or four across, standing, no funny turn, not being sent away), each LFO plot it may ride that is in view, wide enough and clear of the cards (issue 164) is one more choice beside the sections in view, picked at random like them. The ride lasts 8 to 18 seconds, and the next visit comes 20 to 40 seconds after, as from a section.
- **The ride** is the Demo's surf: it jumps onto the plot and slides along its line, end to end, its foot where the plot draws the LFO under its middle, eyes happy.
- **Getting off:** the Depth to 0, a Waveform or a Rate out of bounds, the plot out of view or covered, the Demo starting, or reduced motion: it jumps home at once.
- **Picked up:** the ride ends and it is thrown as anywhere, landing on the first edge it comes down onto, not home. Claude's call, let stand by the owner in 1.20.0: jumping home from the pointer's hold would fight the throw.
- **Sent away on a ride:** it jumps home first, then melts there, rather than melting on the moving line or dripping away from the air. Claude's call, let stand by the owner in 1.20.0.
- **A funny turn cued during a ride** (a word spelled with Notes, the theme) plays on the line, and the ride goes on after. The Demo's surf instead drops it home for a trick. Claude's call, let stand by the owner in 1.20.0: a jump home in the middle of a turn would break "once begun, a funny turn plays to its end".
- **Only three and four across:** on a phone and in 2 × 2 Bead makes no visits, so it never rides there. Claude's call, since reversed by the owner. Reversed by the owner in [197](./197-bead-rides-everywhere.md) (2026-11-02): it rides on every layout, a ride comes first when a visit is due, and a drop near a slow plot rides it.
- **The plots are only looked up** in a Demo part, during a ride, or when a visit is due with an LFO to ride, so a frame costs no more while Bead stays home.
- `docs/bead.md` lists the ride under "Where it lives" and beside the Demo's surf. CONTEXT.md's Mascot entry names it too.
- **Tests:** the mascot spec's new test sets LFO 1 to a Sine at 0.5 Hz, half on, by a Share link. It stubs `Math.random` to 0 so the first visit is due 15 seconds in and goes to the first choice, a ride. It checks that the foot stays within 4 px of the plotted line as it rises and falls, and that a double-click putting the Depth to 0 ends the ride and lands Bead on the Amp's edge. Bead's frame-cost test failed now and then under the night's load (1.0 to 1.4 ms against its 1 ms bound), and failed just the same with HEAD's Bead swapped back in, so it is a load flake, not this change; it passed on the last full run. In that run WebKit's throw test failed once. Run again, it failed now and then with or without this change (the press missing Bead as it strolled, or a hop as it landed) while the machine was loaded, so it is a load flake too. The last criterion, Linux's fonts, is for GitHub's run to show.

**To try:** at three or four across, turn LFO 1's Depth up and its Rate to 1 Hz or slower, keep a Sine or a Triangle, and wait: within a visit or two (15 to 40 seconds each) Bead may jump onto the plot and ride it. Then turn the Rate past 1 Hz, choose a Saw, or put the Depth to 0, and it jumps home. Try picking it up mid-ride, and playing B, E, A, D mid-ride. With Sync on, a 1/2 at 120 BPM (1 Hz) rides and a 1/4 (2 Hz) does not.

**Since then (2026-11-07, [250](./250-tidy-ups-after-1-26.md))**: the foot along the line is read once in the browser; the ride's rule is Bead's frame's unit tests.

**Since then (2026-11-08, [270](./270-bead-rides-up-to-2-5-hz.md)):** the bound is 2.5 Hz, the owner's: a Sine or a Triangle up to 2.5 Hz rides, so a synced 1/4 at 120 BPM (2 Hz) rides too, and past 2.5 Hz it jumps home.
