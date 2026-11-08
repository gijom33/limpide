# 270: Bead rides an LFO up to 2.5 Hz

**What to build:** The owner's idea (the inbox, 2026-11-08): "make Bid be able to surf up to 2.5 Hz." Bead rides a Sine or a Triangle LFO's plot only at 1 Hz or slower, 141's bound kept by [197](./197-bead-rides-everywhere.md)'s call 5; the bound becomes 2.5 Hz. "Bid" read as Bead, and "surf" as its ride on an LFO's plot, the same board as the Demo's surf.

**Blocked by:** none

**Status:** done (2026-11-08). Built (2026-11-08) on night/2026-11-08 and merged into main on 2026-11-08, approved by the owner: "All good! Go for it."; released in 1.28.0. In v1 as polish of 197's rides, as 264 was of 229's Glow; Claude's call, open to the owner (2026-11-08). The bound is the owner's (decided by the owner, 2026-11-08).

## Decisions

Decided by the owner (2026-11-08, the idea):

1. **Bead rides a Sine or a Triangle up to 2.5 Hz,** with Sync the Hz its note value gives, as now.

Claude's calls, open to the owner (2026-11-08):

2. **The same bound everywhere a ride is decided:** a ride by itself, a ride on a drop, and the Demo's surf's choice of plot where it checks one.
3. **Nothing else of the ride changes:** a Sine or a Triangle only, Depth above 0, 8 to 18 seconds, its lean and its board.

## Agent Brief

**Category:** enhancement
**Summary:** Bead's fastest rideable LFO goes from 1 Hz to 2.5 Hz.

**Current behavior:** Bead rides an LFO's plot only when it is a Sine or a Triangle at 1 Hz or slower; faster, it lands as anywhere.

**Desired behavior:**
- A Sine or a Triangle up to 2.5 Hz is ridden, by itself and on a drop; faster, as now.
- Bead stays on the line at 2.5 Hz, at every layout: its lean and its board keep up with the line, and it does not shake or leave it.
- `docs/bead.md`, CONTEXT.md if it names the bound, and 197 (a Since then line) say 2.5 Hz.

**Key interfaces:**
- The rule that says which LFOs Bead may ride
- Bead's ride along a plot's line

**Acceptance criteria:**
- [x] A unit test: a Sine at 2.5 Hz is rideable, at 2.6 Hz not; a synced note value at that Hz counts
- [x] An end-to-end test: Bead dropped near a 2.5 Hz Sine's plot rides its line
- [x] Bead's ride tests pass as they are

**Out of scope:** a Saw's or a Square's plot; the Demo's acts.

## How it was built

Built on 2026-11-08, on night/2026-11-08.

1. **The bound:** Bead rides a Sine or a Triangle up to 2.5 Hz, with Sync the Hz its note value gives (a 1/4 T at 100 BPM, 2.5 Hz worked out a hair over in floating point, rides; at 104 BPM, 2.6 Hz, it does not). One rule decides a ride by itself and a ride on a drop; the Demo's surf checks no Hz, so decision 2 needed nothing more there.
2. **On the line at 2.5 Hz.** At 2.5 Hz the plot's line is up to about 70° steep at half Depth (three across, 2.5 cycles in its 120 px). Measured before the change, Bead read the line under where it stood the frame before; strolling along so steep a wave, a frame's stroll left it up to 3.6 px over or under the line, and its lean up to 20° behind it. It now reads the line under where it stands this frame, for its foot and its lean. It also read the plot's box with its 1 px border, where the line is drawn inside it; it now reads the drawing's own box. Measured after: in its frame's tests at 60 frames a second, its foot is on the line (under 0.5 px) three across, on a phone and in 2 × 2. In the browser, three across, about half a pixel off on average in Chromium and WebKit, the worst frame 2 to 5 px.
3. **Its lean and board** follow the line up to 35°, its steepest, as before (decision 3). At 2.5 Hz the line is steeper than that for most of each rise and fall, so the board sits at 35° there, and the lean turns from forward to back five times a second, exactly as often as the line under it does.

Tests: `npx tsc` and `npm run lint` clean; the unit tests of `src/ui` (429 passed), with the rule's bounds (`mascotPlace.test.ts`) and a 2.5 Hz ride at every layout in Bead's frame's tests, its foot, its lean against the line's slope and its turns measured each frame. In the browser, the mascot spec, whole, in Chromium and WebKit (93 passed, 3 skipped as before), then its ride, drop and surf tests again after the review's fixes (12 passed). Its new test drops Bead just beside a 2.5 Hz Sine's plot and measures two seconds of the ride frame by frame: its foot against the line, its lean with the slope, its turns. Its line checks, the old tests' too, now measure against the plot's drawing inside its border, as Bead reads it. The review (standards and spec) found a repeated condition and formula in Bead's frame, a fallback no plot reaches, two comments and a test name, and 141's missing Since then line: all fixed.

**Calls made (Claude's call, open to the owner):**

1. **Reading the line where it stands this frame,** and the plot's drawing inside its border: a fix to how the ride follows its line, not a change to how Bead moves or looks. It also makes the Demo's surf a little truer.
2. **The 35° lean kept** (decision 3), though a 2.5 Hz line is up to 70° steep: the board is along the line on its gentle parts and at 35° on its steep ones. A steeper lean is the owner's to ask for.
3. **Phone and 2 × 2 measured in Bead's frame's tests,** not the browser's, as 245 moved them there; the browser test is three across.
4. **The browser test's bound:** a frame in twenty may be more than 3 px off, none more than 8. On a 70° line a few milliseconds between the clock Bead reads and the one its plot reads, in the same frame, is pixels. GitHub's WebKit on Linux, at about fifteen frames a second, is for the branch run to show.

**What to try in the app:** turn LFO 1's Depth to about half and its Rate to 2.5 Hz, a Sine, then pick Bead up and drop it on the plot or just beside it: it rides the line, leaning forward down each slope and back up each rise, five times a second, and should neither float off the line nor shake. Then try a Triangle, full Depth, a phone's width and 2 × 2, and 2.6 Hz, where a drop lands as anywhere. With Sync, a 1/4 T at 100 BPM is 2.5 Hz.
