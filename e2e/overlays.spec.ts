import { expect, test } from '@playwright/test';

test('overlays can be switched off to declutter the Viewers, and stay off after a reload', async ({ page }) => {
  await page.goto('/');
  const overlays = page.getByRole('group', { name: 'Show on Viewers' });
  for (const name of ['Harmonics', 'Ideal', 'Curve', 'Ghost', 'Guides']) {
    await expect(overlays.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
  }

  await overlays.getByRole('button', { name: 'Ghost' }).click();
  await overlays.getByRole('button', { name: 'Ideal' }).click();
  await page.reload();

  await expect(overlays.getByRole('button', { name: 'Ghost' })).toHaveAttribute('aria-pressed', 'false');
  await expect(overlays.getByRole('button', { name: 'Ideal' })).toHaveAttribute('aria-pressed', 'false');
  await expect(overlays.getByRole('button', { name: 'Curve' })).toHaveAttribute('aria-pressed', 'true');
});

test('explanations live in tooltips, not as text on screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/runs all the time/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ghost' })).toHaveAttribute('title', /removed/);
});
