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
// does what a browser does to a page in the background: the page says it is hidden, its own timers fire only on the
// next whole second, and it draws no frame (issue 224: drawing on, a slow frame on GitHub's Linux WebKit held the page
// past the Demo's 0.15 s look-ahead, and a Note handed over past its start is dropped by design). The engine writes
// down every Note it is asked to start (the tests' build only).
test('the Demo, with the page hidden for five seconds, starts every Note of those seconds on time (issue 198)', async ({ page }) => {
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
    const [pageFrame, pageCancel] = [window.requestAnimationFrame, window.cancelAnimationFrame];
    const frames = new Map<number, FrameRequestCallback>();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.setTimeout = ((fn: () => void, ms = 0) => pageTimeout(fn, Math.max(ms, 1000 - (performance.now() % 1000)))) as typeof setTimeout;
    // The frames asked for wait until the page is shown again.
    let held = 1e9;
    window.requestAnimationFrame = (fn) => {
      frames.set(++held, fn);
      return held;
    };
    window.cancelAnimationFrame = (id) => (frames.delete(id) ? undefined : pageCancel(id));
    const from = audioNow();
    await new Promise((done) => pageTimeout(done, 5000));
    const to = audioNow();
    window.setTimeout = pageTimeout;
    [window.requestAnimationFrame, window.cancelAnimationFrame] = [pageFrame, pageCancel];
    for (const fn of frames.values()) pageFrame(fn);
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

// Issue 227. Hidden, the Song hands its Notes about 2 s ahead; back in front, those not yet due are taken back and made
// again as they fall due, so an octave changed at once is heard at once, not after up to 2 s of the old one.
test('the Song, hidden then shown and its octave moved at once, plays the next Notes in the new octave (issue 227)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Song', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__limpideNotes?.length ?? 0)).toBeGreaterThan(0);
  const before = await page.evaluate(async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((done) => setTimeout(done, 1000));
    delete (document as { visibilityState?: unknown }).visibilityState;
    delete (document as { hidden?: unknown }).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    (document.querySelector('[aria-label="Octave up"]') as HTMLButtonElement).click();
    return window.__limpideNotes!.length;
  });
  await page.waitForTimeout(2500);
  const notes = await page.evaluate(() => window.__limpideNotes!);
  const [handedHidden, handedAfter] = [notes.slice(0, before), notes.slice(before)];
  const shownAt = handedHidden[handedHidden.length - 1].handed;
  // Hidden, Notes were handed well ahead; each of those due a moment after the change is made again, an octave up
  // (the Song's C4 to C5, now C5 to C6).
  const farAhead = handedHidden.filter((n) => n.at > shownAt + 0.5);
  expect(farAhead.length).toBeGreaterThan(2);
  expect(farAhead.every((n) => n.note <= 72)).toBe(true);
  for (const { at } of farAhead) {
    const remade = handedAfter.filter((n) => Math.abs(n.at - at) < 1e-6);
    expect(remade.length, `the Note at ${at.toFixed(3)} made again`).toBeGreaterThan(0);
    expect(remade.every((n) => n.note >= 72)).toBe(true);
  }
});
