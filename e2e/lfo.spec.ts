import { expect, test, type Page } from '@playwright/test';

async function turnUp(page: Page, name: string, steps: number) {
  await page.getByRole('slider', { name, exact: true }).evaluate(async (el, n) => {
    for (let i = 0; i < n; i++) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0)); // a tick for React to render each step
    }
  }, steps);
}
/** How far the plotted line swings, top to bottom, in the plot's units. */
const swing = (page: Page) =>
  page.getByRole('img', { name: 'LFO' }).locator('.lfo-plot-line').evaluate((el) => {
    const ys = [...el.getAttribute('d')!.matchAll(/[ML]\S+ (\S+)/g)].map((m) => Number(m[1]));
    return Math.max(...ys) - Math.min(...ys);
  });

test('the LFO sits in the LFO & Envelopes section: shape buttons, Destination, and a plot of it moving', async ({ page }) => {
  await page.goto('/');
  const lfo = page.getByRole('region', { name: 'LFO & Envelopes' }).getByRole('group', { name: 'LFO' });
  const shapes = lfo.getByRole('radiogroup', { name: 'LFO Waveform' });
  const destination = lfo.getByRole('radiogroup', { name: 'LFO Destination' });
  await expect(shapes.getByRole('radio', { name: 'Sine' })).toHaveAttribute('aria-checked', 'true');
  await expect(destination.getByRole('radio', { name: 'Cutoff' })).toHaveAttribute('aria-checked', 'true');
  await expect(lfo.getByRole('img', { name: 'LFO' })).toBeVisible(); // the plot shows; it picks nothing

  await shapes.getByRole('radio', { name: 'Square' }).click();
  await destination.getByRole('radio', { name: 'Pitch' }).click();
  await expect(shapes.getByRole('radio', { name: 'Square' })).toHaveAttribute('aria-checked', 'true');
  await expect(destination.getByRole('radio', { name: 'Pitch' })).toHaveAttribute('aria-checked', 'true');
});

test('the LFO Rate wakes up once Depth is turned up', async ({ page }) => {
  await page.goto('/');
  const lfo = page.getByRole('group', { name: 'LFO' });
  const rate = lfo.locator('.knob', { has: page.getByRole('slider', { name: 'Rate' }) });
  await expect(rate).toHaveAttribute('data-inactive', 'true');
  await lfo.getByRole('slider', { name: 'Depth' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(rate).not.toHaveAttribute('data-inactive');
});

test('the LFO explains itself', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radiogroup', { name: 'LFO Destination' }).hover();
  await expect(page.getByRole('tooltip')).toContainText(/vibrato/i);
});

test('the LFO plot draws the LFO moving, from the Modulation model', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/); // listening
  await turnUp(page, 'Depth', 50);
  await page.keyboard.down('KeyA'); // sound starts with the first key, and with it the clock the LFO runs on
  const line = page.getByRole('img', { name: 'LFO' }).locator('.lfo-plot-line');
  await expect(line).toHaveAttribute('d', /\d/);
  const before = await line.getAttribute('d');
  await expect.poll(() => line.getAttribute('d')).not.toBe(before);
  await page.keyboard.up('KeyA');
});

// The plot is one second long: 1 Hz is one period, 20 Hz twenty. (Two cycles of a 20 Hz LFO would scroll a third
// of a cycle per frame and read as noise, the wagon-wheel effect.)
test('the LFO plot shows one second: as many periods as the Rate in Hz', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await turnUp(page, 'Depth', 50);
  await page.keyboard.down('KeyA');
  const plot = page.getByRole('img', { name: 'LFO' });
  // Peaks of the drawn line: points higher than both neighbours (y grows downwards).
  const peaks = () =>
    plot.locator('.lfo-plot-line').evaluate((el) => {
      const ys = [...el.getAttribute('d')!.matchAll(/[ML]\S+ (\S+)/g)].map((m) => Number(m[1]));
      return ys.filter((v, i) => i > 0 && i < ys.length - 1 && v < ys[i - 1] && v <= ys[i + 1]).length;
    });
  await expect.poll(peaks).toBe(2); // the default 2 Hz: two periods
  const rate = page.getByRole('slider', { name: 'Rate' });
  await rate.evaluate(async (el) => {
    for (let n = 0; n < 60; n++) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0)); // a tick for React to render each step
    }
  });
  await expect(rate).toHaveAttribute('aria-valuetext', '20 Hz');
  await expect.poll(peaks).toBe(20);
  await page.keyboard.up('KeyA');
});

test('the LFO plot shows the Depth as well as the Rate: flat at 0, half as tall at half Depth as at full', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
  await page.keyboard.down('KeyA');
  await expect(page.getByRole('img', { name: 'LFO' }).locator('.lfo-plot-line')).toHaveAttribute('d', /\d/);
  expect(await swing(page)).toBe(0);
  await turnUp(page, 'Depth', 25); // 50 %
  await expect.poll(() => swing(page)).toBeGreaterThan(0);
  await page.waitForTimeout(1100); // a whole second at that Depth
  const half = await swing(page);
  await turnUp(page, 'Depth', 25); // 100 %
  await page.waitForTimeout(1100);
  const full = await swing(page);
  expect(half / full).toBeCloseTo(0.5, 1);
  await page.keyboard.up('KeyA');
});
