import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

test('the display controls hide behind a Display button, leaving the space to the synth', async ({ page }) => {
  await page.goto('/');
  const controls = page.getByRole('region', { name: 'Viewer controls' });
  await expect(controls).toBeHidden();
  await openDisplay(page);
  for (const group of ['View', 'Axes', 'Show']) await expect(controls.getByRole('group', { name: group, exact: true })).toBeVisible();
});

test('the panel stays open while several settings are changed, and Escape closes it', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('radiogroup', { name: 'Frequency axis' }).getByRole('radio', { name: 'Lin' }).click();
  await page.getByRole('button', { name: 'Guides' }).click();
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Display' })).toHaveAttribute('aria-expanded', 'false');
});

test('clicking elsewhere closes the panel', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.locator('.timeline h2').click(); // well away from the panel, which overlays the stages below the header
  await expect(page.getByRole('region', { name: 'Viewer controls' })).toBeHidden();
});

test('Space still freezes with the panel closed, and the Display button shows that something is held', async ({ page }) => {
  await page.goto('/');
  const display = page.getByRole('button', { name: 'Display' });
  await expect(display).not.toHaveAttribute('data-active', 'true');
  await page.keyboard.press('Space');
  await expect(page.locator('main')).toHaveAttribute('data-frozen', 'true');
  await expect(display).toHaveAttribute('data-active', 'true');
  await page.keyboard.press('Space');
  await expect(display).not.toHaveAttribute('data-active', 'true');
});

test('the header is a single line at every laptop width, no taller than the piano', async ({ page }) => {
  for (const width of [1710, 1100, 872]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.piano')).toBeVisible(); // drawn: under load the page may still be starting
    const [header, piano] = await page.evaluate(() => ['header', '.piano'].map((s) => document.querySelector(s)!.getBoundingClientRect().height));
    expect(header, `${width}px`).toBeLessThanOrEqual(64);
    expect(header, `${width}px`).toBe(piano);
  }
});

for (const width of [1710, 1300, 960, 872, 420]) {
  test(`the open Display panel fits inside the window (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await openDisplay(page);
    const box = (await page.getByRole('region', { name: 'Viewer controls' }).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  });
}

test('the keyboard sits at the top centre', async ({ page }) => {
  await page.setViewportSize({ width: 1710, height: 1060 });
  await page.goto('/');
  const piano = (await page.getByRole('group', { name: 'Piano' }).boundingBox())!;
  const header = (await page.locator('header').boundingBox())!;
  expect(piano.y + piano.height).toBeLessThanOrEqual(header.y + header.height + 1);
  expect(Math.abs(piano.x + piano.width / 2 - 1710 / 2)).toBeLessThan(60);
});

test('the theme is chosen in the Display panel, and remembered', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
