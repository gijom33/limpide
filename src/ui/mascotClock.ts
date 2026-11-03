/** How long the audio clock may stand still before it counts as stopped: longer than any step it takes while running. */
const STALLED = 0.1;

/**
 * Bead's time, in seconds: the audio clock's while the sound runs, so it moves with what is heard; while the browser
 * holds the sound stopped (before the first tap, or on an iPhone back from another app, until a tap starts it again),
 * the page's own clock carries it on, so it never stands frozen. It never goes back. `audio` and `wall` are both in
 * seconds.
 */
export function mascotClock(audio: () => number, wall: () => number): () => number {
  let lastAudio: number | null = null;
  let lastWall = 0;
  // When the audio clock last moved, by the page's clock.
  let movedAt = 0;
  // The page's time counted while the audio clock stood still.
  let ahead = 0;
  return () => {
    const a = audio();
    const w = wall();
    if (lastAudio === null || a > lastAudio) movedAt = w;
    else if (w - movedAt > STALLED) ahead += w - Math.max(lastWall, movedAt + STALLED);
    lastAudio = a;
    lastWall = w;
    return a + ahead;
  };
}
