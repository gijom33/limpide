import { expect, type Locator, type Page } from '@playwright/test';

/** Opens the Display panel (the Viewers' View, Axes and Show, and the page's Keys, Tips, Bead and Theme) if it is not open already. */
export async function openDisplay(page: Page) {
  const button = page.getByRole('button', { name: 'Display' });
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeVisible();
}

/**
 * A slider by its visible label: its accessible name ends with it ("Attack" is "Filter Attack" or "Amp Attack", issue
 * 51), so look it up inside its section or LFO.
 */
export const sliderName = (label: string) => new RegExp(`(^| )${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

/**
 * Keeps the page's AudioContext within reach as `window.audioContext`, so a test can stop the sound as a browser does
 * (an iPhone, back from another app). Call before the page loads.
 */
export const reachAudio = (page: Page) =>
  page.addInitScript(() => {
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        (window as unknown as { audioContext: AudioContext }).audioContext = this;
      }
    };
  });

/**
 * The first change to each element's attribute within `ms` ("aria-label: Patch: Kick"), or null if each stayed as it
 * was: one wait in the page, frame by frame, for a test that proves nothing happens (issue 250).
 */
export async function firstChange(page: Page, watched: readonly (readonly [Locator, string])[], ms: number) {
  const handles = await Promise.all(watched.map(async ([element, name]) => [await element.elementHandle(), name] as const));
  return page.evaluate(
    ([pairs, ms]) =>
      new Promise<string | null>((done) => {
        const read = ([element, name]: (typeof pairs)[number]) => (element?.isConnected ? element.getAttribute(name) : 'gone');
        const [was, end] = [pairs.map(read), performance.now() + ms];
        const frame = (now: number) => {
          const changed = pairs.findIndex((pair, i) => read(pair) !== was[i]);
          if (changed >= 0) done(`${pairs[changed][1]}: ${read(pairs[changed])}`);
          else if (now >= end) done(null);
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
    [handles, ms] as const,
  );
}

/** Stops the page's sound as the browser does when it takes it away (needs `reachAudio`). */
export const stopSound = (page: Page) =>
  page.evaluate(() => (window as unknown as { audioContext: AudioContext }).audioContext.suspend());


/**
 * Unfolds the Demo's card, which opens small and folded in three and four across (issue 230), so its parts' segments
 * are there to press; on a phone and in 2 × 2 it opens whole already.
 */
export async function wholeDemoCard(page: Page) {
  const card = page.getByRole('region', { name: 'Demo', exact: true });
  await expect(card.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
  const unfold = card.getByRole('button', { name: 'Unfold the card' });
  if (await unfold.isVisible()) await unfold.click();
  await expect(card.getByRole('button', { name: 'Fold the card' })).toBeVisible();
}

/**
 * Waits until the page's scroll and scroll size and the elements' boxes and scroll have held still for five frames
 * running, with no short transition or animation running inside them, watched in the page: a layout or a scroll
 * settled (a window resized and its canvases with it, a card unfolded, a wheel's or a fling's scroll ended: issue 263).
 * It gives up after five seconds without failing, and the test's own expectations then say what moved.
 */
export async function steady(page: Page, ...elements: Locator[]) {
  const handles = await Promise.all(elements.map((element) => element.elementHandle()));
  await page.evaluate(
    (elements) =>
      new Promise<void>((done) => {
        const root = document.documentElement;
        const read = () =>
          [
            scrollX,
            scrollY,
            root.scrollWidth,
            root.scrollHeight,
            ...elements.map((e) => (e ? [...Object.values(e.getBoundingClientRect().toJSON()), e.scrollLeft, e.scrollTop].join(' ') : '')),
          ].join();
        // A long one (the Demo card's part filling over its seconds) is no settling.
        const moving = () =>
          elements.some((e) =>
            e?.getAnimations({ subtree: true }).some((a) => a.playState === 'running' && Number(a.effect?.getComputedTiming().endTime) < 2000),
          );
        let [was, still] = [read(), 0];
        const limit = 5000;
        const end = performance.now() + limit;
        const giveUp = setTimeout(done, limit); // were the frames paused
        const frame = (now: number) => {
          const reading = read();
          still = reading === was && !moving() ? still + 1 : 0;
          was = reading;
          if (still >= 5 || now >= end) {
            clearTimeout(giveUp);
            done();
          } else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
    handles,
  );
  await Promise.all(handles.map((handle) => handle?.dispose()));
}

/**
 * Waits for the page to draw `count` frames: what an input handled as it came (a key, a MIDI message, a focus) has
 * changed is on the page by then, the Viewers and the knobs' rings drawn with it (issue 263).
 */
export const frames = (page: Page, count = 2) =>
  page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
  }, count);
