import { expect, type Page, test } from '@playwright/test';
import { openDisplay, reachAudio, sliderName } from './helpers';

// The sound pauses in a long silence (issue 216): with nothing sounding for a while the page suspends its
// AudioContext, so the browser's audio thread stops and the Viewers rest on their last picture. Any Note wakes it and
// sounds; the LFO plots go on moving through the pause; and the page never asks for a tap for its own pause. The wait
// is 30 s on the site, a second here.

const state = (page: Page) => page.evaluate(() => (window as unknown as { audioContext: AudioContext }).audioContext.state);
const db = (page: Page) => page.getByLabel('Amp Scope', { exact: true }).getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));
const invite = (page: Page) => page.getByRole('group', { name: 'Piano' }).getByRole('status');

/** Counts each canvas's draws, by its accessible name: every Viewer clears its canvas as it starts drawing. */
const countDraws = (page: Page) =>
  page.addInitScript(() => {
    const draws: Record<string, number> = {};
    (window as unknown as { draws: Record<string, number> }).draws = draws;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      const name = this.canvas.getAttribute('aria-label') ?? '';
      draws[name] = (draws[name] ?? 0) + 1;
      return clear.apply(this, args);
    };
  });

/** Each Viewer's draws over the next `frames` frames, counted inside the page. */
const drawsOver = (page: Page, frames: number) =>
  page.evaluate(async (n) => {
    const draws = (window as unknown as { draws: Record<string, number> }).draws;
    const before = { ...draws };
    for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame);
    return Object.fromEntries(Object.keys(draws).map((k) => [k, draws[k] - (before[k] ?? 0)]));
  }, frames);

/** The sound started by a click, then left to pause: the page's own pause, not the browser's. */
async function paused(page: Page) {
  await expect.poll(() => state(page), { timeout: 15000 }).toBe('suspended');
  await expect(invite(page)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await reachAudio(page);
  await countDraws(page);
  await page.addInitScript(() => (window.__limpidePauseAfter = 1));
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await openDisplay(page); // a click: the sound starts
  await expect.poll(() => state(page)).toBe('running');
  await paused(page);
});

test('paused, the Viewers rest on their last picture and the page asks for no tap (issue 216)', async ({ page }) => {
  await expect
    .poll(async () => {
      const draws = await drawsOver(page, 30);
      return ['Oscillator Scope', 'Oscillator Spectrum', 'Filter Scope', 'Filter Spectrum', 'Amp Scope', 'Amp Spectrum'].filter((v) => draws[v] !== 0);
    }, { timeout: 10000 })
    .toEqual([]);
  // The Oscillators still show: the picture held is the last one, not silence.
  expect(Number(await page.getByLabel('Oscillator Scope', { exact: true }).getAttribute('data-db'))).toBeGreaterThan(-40);
  await expect(invite(page)).toHaveCount(0);
  await expect(page.getByText(/enable sound/i)).toHaveCount(0);
});

test('after the pause a key sounds, and the sound pauses again after the next silence (issue 216)', async ({ page }) => {
  await page.keyboard.down('KeyA');
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  expect(await state(page)).toBe('running');
  await page.keyboard.up('KeyA');
  await paused(page);
});

test('after the pause a click on the piano sounds (issue 216)', async ({ page }) => {
  const c4 = page.getByRole('group', { name: 'Piano' }).getByRole('button', { name: 'C4' });
  await c4.scrollIntoViewIfNeeded();
  await paused(page);
  // A press with no move first: the Note itself wakes it.
  await c4.evaluate((el) => {
    const { left, top, width, height } = el.getBoundingClientRect();
    const at = { clientX: left + width / 2, clientY: top + height - 5, bubbles: true, pointerId: 1, isPrimary: true, button: 0, buttons: 1 };
    el.dispatchEvent(new PointerEvent('pointerdown', at));
  });
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  expect(await state(page)).toBe('running');
});

test('after the pause the Demo plays (issue 216)', async ({ page }) => {
  await page.getByRole('button', { name: 'Demo' }).click();
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  // Playing, it never pauses.
  await page.waitForTimeout(3000);
  expect(await state(page)).toBe('running');
});

test('an LFO plot goes on moving through the pause (issue 216, the owner)', async ({ page }) => {
  const lfo = page.getByRole('region', { name: 'LFO & Envelopes' }).getByRole('group', { name: 'LFO 1', exact: true });
  await lfo.getByRole('slider', { name: sliderName('Depth') }).evaluate(async (el) => {
    for (let i = 0; i < 5; i++) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
  await paused(page);
  const line = page.getByRole('img', { name: /^LFO 1:/ }).locator('.lfo-plot-line');
  const before = await line.getAttribute('d');
  await expect.poll(() => line.getAttribute('d')).not.toBe(before);
  expect(await state(page)).toBe('suspended');
});
