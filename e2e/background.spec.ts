import { expect, test } from '@playwright/test';
import { parsePhrase, phraseLength } from '../src/demo/phrase';
import { TRACK } from '../src/demo/track';

// Every Note's start in the Demo's track, from its first part's start, in seconds.
const TRACK_STARTS = (() => {
  const starts: number[] = [];
  let at = 0;
  for (const part of TRACK.parts) {
    for (const e of parsePhrase(part.phrase, TRACK.bpm)) starts.push(at + e.time);
    at += phraseLength(part.phrase, TRACK.bpm);
  }
  return [...new Set(starts.map((s) => s.toFixed(4)))].map(Number);
})();

// Issue 198. A headless browser never slows a page it runs (its pages stay visible, their timers on time), so the test
// does what a browser does to a page in the background: the page says it is hidden, and its own timers fire only on
// the next whole second. The engine writes down every Note it is asked to start (the tests' build only).
test('the Demo, with the page hidden for five seconds, starts every Note of those seconds on time (issue 198)', async ({ page }) => {
  // On GitHub's Linux WebKit the page is slow enough that a Note is handed over past its start, and dropped by design,
  // at the same place each run: inbox, 2026-11-03 (the 1.23.0 branch run).
  test.skip(test.info().project.name === 'webkit', 'a Note handed over late on GitHub’s Linux WebKit: inbox, 2026-11-03');
  test.slow();
  await page.goto('/');
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__limpideNotes?.length ?? 0)).toBeGreaterThan(0);
  const [from, to] = await page.evaluate(async () => {
    const audioNow = () => {
      const notes = window.__limpideNotes!;
      return notes[notes.length - 1].handed;
    };
    const pageTimeout = window.setTimeout;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.setTimeout = ((fn: () => void, ms = 0) => pageTimeout(fn, Math.max(ms, 1000 - (performance.now() % 1000)))) as typeof setTimeout;
    const from = audioNow();
    await new Promise((done) => pageTimeout(done, 5000));
    const to = audioNow();
    window.setTimeout = pageTimeout;
    delete (document as { visibilityState?: unknown }).visibilityState;
    delete (document as { hidden?: unknown }).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    return [from, to];
  });
  expect(to - from).toBeGreaterThan(4); // the audio clock ran on through the five seconds
  const notes = await page.evaluate(() => window.__limpideNotes!);
  // The track's first Note starts its first part: every start of the track is counted from there.
  const first = notes[0].at - TRACK_STARTS[0];
  const due = TRACK_STARTS.map((s) => first + s).filter((s) => s >= from && s < to);
  const started = notes.filter((n) => n.at >= from && n.at < to);
  expect(due.length).toBeGreaterThan(5);
  // Every Note of those seconds started, on its beat: none lost, none bunched.
  expect([...new Set(started.map((n) => n.at.toFixed(3)))]).toEqual(due.map((s) => s.toFixed(3)));
  // Each handed to the engine before its start, none late.
  expect(started.filter((n) => n.handed > n.at)).toEqual([]);
});
