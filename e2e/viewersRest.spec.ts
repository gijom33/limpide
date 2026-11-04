import { expect, type Page, test } from '@playwright/test';
import { openDisplay, sliderName } from './helpers';

// The Viewers at rest (issue 214): with nothing playing, the Scopes, Spectrums and the Envelope Timeline draw their
// silent picture once and stop redrawing it, and the first frame after a change draws it again. Before the sound has
// started every Tap is silent; once it runs, the Oscillators run on under a closed Amp, so the Oscillator and Filter
// Taps carry them and only the Amp's Viewers and the Timeline are silent.

const VIEWERS = ['Oscillator Scope', 'Oscillator Spectrum', 'Filter Scope', 'Filter Spectrum', 'Amp Scope', 'Amp Spectrum', 'Envelope Timeline'];
const SILENT_ONCE_SOUNDING = ['Amp Scope', 'Amp Spectrum', 'Envelope Timeline'];

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

/** Each Viewer's draws over the next `frames` frames, counted inside the page so a busy machine cannot stretch them. */
const drawsOver = (page: Page, frames: number) =>
  page.evaluate(async (n) => {
    const draws = (window as unknown as { draws: Record<string, number> }).draws;
    const before = { ...draws };
    for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame);
    return Object.fromEntries(Object.keys(draws).map((k) => [k, draws[k] - (before[k] ?? 0)]));
  }, frames);

/** Waits until each of `viewers` has come to rest: none drawn over half a second. */
async function untilAtRest(page: Page, viewers = VIEWERS) {
  await expect
    .poll(async () => {
      const draws = await drawsOver(page, 30);
      return viewers.filter((v) => draws[v] !== 0);
    }, { timeout: 15000 })
    .toEqual([]);
}

/**
 * Runs `act` (code) in the page at rest, then counts each Viewer's draws over the `frames` frames after it: the frame a
 * change shows on. In one step inside the page, so no round trip comes between the change and the frames counted.
 */
const drawsAfter = (page: Page, act: string, frames: number) =>
  page.evaluate(
    async ({ act, frames }) => {
      const draws = (window as unknown as { draws: Record<string, number> }).draws;
      const before = { ...draws };
      new Function(act)();
      for (let i = 0; i < frames; i++) await new Promise(requestAnimationFrame);
      return Object.fromEntries(Object.keys(draws).map((k) => [k, draws[k] - (before[k] ?? 0)]));
    },
    { act, frames },
  );

test.beforeEach(async ({ page }) => {
  await countDraws(page);
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
});

test('with nothing playing, the Scopes, Spectrums and the Envelope Timeline draw their silence once, then rest (issue 214)', async ({ page }) => {
  await untilAtRest(page);
  const draws = await drawsOver(page, 60);
  for (const viewer of VIEWERS) expect(draws[viewer], viewer).toBe(0);
});

test('once the sound runs, the Amp’s Viewers and the Timeline rest, and the Oscillators go on being drawn (issue 214)', async ({ page }) => {
  await openDisplay(page); // a click: the sound starts
  await expect(page.getByLabel('Oscillator Scope', { exact: true })).toHaveAttribute('data-db', /^-\d/);
  await untilAtRest(page, SILENT_ONCE_SOUNDING);
  const draws = await drawsOver(page, 30);
  for (const viewer of ['Oscillator Scope', 'Oscillator Spectrum', 'Filter Scope', 'Filter Spectrum']) expect(draws[viewer], viewer).toBe(30);
});

test('with an LFO on and nothing playing, its plot goes on moving while the Amp’s Viewers rest (issue 214, the owner, 2026-11-03)', async ({ page }) => {
  const lfo = page.getByRole('region', { name: 'LFO & Envelopes' }).getByRole('group', { name: 'LFO 1', exact: true });
  await lfo.getByRole('slider', { name: sliderName('Depth') }).evaluate(async (el) => {
    for (let i = 0; i < 5; i++) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
  await untilAtRest(page, ['Amp Scope', 'Amp Spectrum']);
  const line = page.getByRole('img', { name: /^LFO 1:/ }).locator('.lfo-plot-line');
  const before = await line.getAttribute('d');
  await expect.poll(() => line.getAttribute('d')).not.toBe(before);
});

test('at rest, a Display switch and a theme change each show on the next frame (issue 214)', async ({ page }) => {
  await openDisplay(page);
  await untilAtRest(page, SILENT_ONCE_SOUNDING);
  // The Spectrums' frequency axis, switched to linear.
  const radio = page.getByRole('radiogroup', { name: 'Frequency axis' }).getByRole('radio', { name: 'Lin' });
  await radio.evaluate((el) => el.setAttribute('data-act', ''));
  let draws = await drawsAfter(page, "document.querySelector('[data-act]').click()", 1);
  expect(draws['Amp Spectrum']).toBeGreaterThan(0);

  await untilAtRest(page, SILENT_ONCE_SOUNDING);
  const theme = (await page.locator('html').getAttribute('data-theme')) === 'light' ? 'dark' : 'light';
  draws = await drawsAfter(page, `document.documentElement.setAttribute('data-theme', '${theme}')`, 1);
  for (const viewer of SILENT_ONCE_SOUNDING) expect(draws[viewer], viewer).toBeGreaterThan(0);
});

test('at rest, a knob turn shows on the next frame: the Response Curve follows the Cutoff, the Timeline the Filter Envelope (issue 214)', async ({ page }) => {
  // The first key on a knob starts the sound too, so the second waits only for the Viewers silent while it runs.
  const turn = async (name: string, viewer: string, waitFor: string[]) => {
    await untilAtRest(page, waitFor);
    const knob = page.getByRole('slider', { name, exact: true });
    await knob.evaluate((el) => el.setAttribute('data-act', ''));
    const draws = await drawsAfter(page, "document.querySelector('[data-act]').dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }))", 1);
    await knob.evaluate((el) => el.removeAttribute('data-act'));
    expect(draws[viewer], viewer).toBeGreaterThan(0);
  };
  await turn('Cutoff', 'Filter Spectrum', VIEWERS);
  await turn('Filter Envelope Amount', 'Envelope Timeline', SILENT_ONCE_SOUNDING);
});

test('at rest, a Note wakes its Viewers as soon as its sound reaches them (issue 214)', async ({ page }) => {
  await untilAtRest(page);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.down('KeyA');
  await expect.poll(async () => (await drawsOver(page, 2))['Amp Scope']).toBeGreaterThan(0);
  const draws = await drawsOver(page, 10);
  for (const viewer of VIEWERS) expect(draws[viewer], viewer).toBe(10);
  await page.keyboard.up('KeyA');
});
