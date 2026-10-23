import { expect, test } from '@playwright/test';

test('the header shows the SynthView logo and wordmark, and the tab has its icon', async ({ page }) => {
  await page.goto('/');
  const title = page.getByRole('heading', { level: 1, name: 'SynthView' });
  await expect(title).toBeVisible();
  await expect(title.locator('svg.logo')).toBeVisible();

  const icon = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(icon).toBeTruthy();
  const response = await page.request.get(icon!);
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('svg');
});

for (const width of [861, 872, 884, 900, 920, 1000, 1100, 1440, 1710]) {
  test(`the SynthView name is on screen, on the header line, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const title = page.getByRole('heading', { level: 1, name: 'SynthView' });
    await expect(title).toBeVisible();
    const { text, header, display } = await page.evaluate(() => ({
      text: document.querySelector('.wordmark-text')!.getBoundingClientRect(),
      header: document.querySelector('header')!.getBoundingClientRect(),
      display: document.querySelector('.display-menu')!.getBoundingClientRect(),
    }));
    expect(text.width).toBeGreaterThan(60); // drawn at full size, not clipped away
    expect(text.right).toBeLessThanOrEqual(header.right);
    expect(display.right).toBeLessThanOrEqual(header.right + 1); // the Display button stays inside the window
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(Math.abs(text.top + text.height / 2 - (display.top + display.height / 2))).toBeLessThanOrEqual(8); // one line
  });
}

test('no "Press a key" message over the Viewers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
  await expect(page.getByText(/press a key/i)).toHaveCount(0);
});
