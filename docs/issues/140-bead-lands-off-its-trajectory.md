# 140: Bead lands away from where its flight shows

**What to build:** The owner's bug (inbox, 2026-10-31): "Bead sometimes lands at different location than where the trajectory shows."

**Blocked by:** none

**Status:** done (2026-10-31). A flipped sign in the flight's time to landing: Bead now comes down onto its spot by its own flight.

## Question for the owner

1. **When does it happen?** After Bead is picked up and thrown (it flies under gravity and lands on the first section edge it comes down onto), or when it jumps on its own from one section to another (a visit, in an arc)? And roughly where it lands instead: further along, on another edge, or snapping back home?

**The owner's answer (2026-10-31):** when it jumps on its own, not after a throw.

## How it was diagnosed and fixed

A throwaway spec recorded Bead's box every frame for three minutes at 1440 and 1920 px, through its own visits. Every jump between sections ended with a step across on the frame it landed: 53 to 134 px in one frame, where its flight's steps just before were a few pixels.

The flight steers it across at the speed that brings it over its spot when its foot reaches the line, solving down = vy t + GRAVITY t² / 2 for t. The code had `(vy + √…) / GRAVITY` for `(−vy + √…) / GRAVITY`: rising (vy < 0) it thought it had less time and rushed across; falling it thought it had more, drifted, and was still short when it touched down, where the landing set it on its spot at once.

The fix is the sign, in `createMascotPlace` (`src/ui/mascotPlace.ts`); a unit test in `src/ui/mascotPlace.test.ts` flies it across, down and up, and checks the frame before it lands is within two of its own steps of its spot (it was 30 px short at under a pixel a frame before the fix).
