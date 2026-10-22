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

test('no "Press a key" message over the Viewers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);
  await expect(page.getByText(/press a key/i)).toHaveCount(0);
});
