import { expect, test } from '@playwright/test';

const db = (page: import('@playwright/test').Page) =>
  page.getByLabel('Amp Scope', { exact: true }).getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));
const ready = (page: import('@playwright/test').Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

test('Hold keeps the Note sounding after the key is released, until Hold is switched off', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const hold = page.getByRole('button', { name: 'Hold' });
  await hold.click();
  await expect(hold).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.down('KeyA');
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await page.keyboard.up('KeyA');
  await page.waitForTimeout(1200); // well past the 400 ms Release
  expect(await db(page)).toBeGreaterThan(-40);

  await hold.click();
  await expect.poll(() => db(page)).toBeLessThan(-80);
});

test('the Envelope Timeline draws the Envelopes as they happen', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const timeline = page.getByLabel('Envelope Timeline').locator('canvas');
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(400);
  const inked = await timeline.evaluate((c: HTMLCanvasElement) => {
    const { data } = c.getContext('2d')!.getImageData(Math.floor(c.width * 0.9), 0, Math.floor(c.width * 0.1), c.height);
    return data.filter((v, i) => i % 4 === 3 && v > 0).length;
  });
  expect(inked).toBeGreaterThan(100);
  await page.keyboard.up('KeyA');
});

test('the Filter Envelope knobs wake up once Envelope Amount is turned away from zero', async ({ page }) => {
  await page.goto('/');
  const decay = page.getByRole('region', { name: 'Filter' }).locator('.knob', { has: page.getByRole('slider', { name: 'Decay' }) });
  await expect(decay).toHaveAttribute('data-inactive', 'true');
  const amount = page.getByRole('slider', { name: 'Amount' });
  await amount.focus();
  await page.keyboard.press('ArrowUp');
  await expect(amount).toHaveAttribute('aria-valuetext', '+0.2 oct');
  await expect(decay).not.toHaveAttribute('data-inactive');
});

test('the Envelope Timeline shows the Filter Envelope too, with its own key, rising and settling as the Note plays', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const panel = page.getByRole('region', { name: 'Envelope Timeline' });
  await expect(panel.locator('[data-mark="filterEnvelope"]')).toHaveText('Filter Envelope');
  const canvas = panel.locator('canvas');
  const level = () => canvas.getAttribute('data-filter-envelope').then(Number);
  await expect.poll(level).toBe(0); // no Note yet
  await page.getByRole('button', { name: 'Hold' }).click();
  await page.keyboard.down('KeyA');
  // Init's Filter Envelope settles at its Sustain, 30 %.
  await expect.poll(level, { timeout: 5000 }).toBeCloseTo(0.3, 1);
  await page.keyboard.up('KeyA');
});
