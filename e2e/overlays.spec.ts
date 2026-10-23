import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

test('overlays can be switched off to declutter the Viewers, and stay off after a reload', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const overlays = page.getByRole('group', { name: 'Show on Viewers' });
  for (const name of ['Harmonics', 'Ideal', 'Curve', 'Guides']) {
    await expect(overlays.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(overlays.getByRole('button')).toHaveCount(4); // no Ghost: it was dropped

  await overlays.getByRole('button', { name: 'Guides' }).click();
  await overlays.getByRole('button', { name: 'Ideal' }).click();
  await page.reload();
  await openDisplay(page);

  await expect(overlays.getByRole('button', { name: 'Guides' })).toHaveAttribute('aria-pressed', 'false');
  await expect(overlays.getByRole('button', { name: 'Ideal' })).toHaveAttribute('aria-pressed', 'false');
  await expect(overlays.getByRole('button', { name: 'Curve' })).toHaveAttribute('aria-pressed', 'true');
});

test('explanations live in tooltips, not as text on screen', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await expect(page.getByText(/runs all the time/)).toBeHidden();
  await page.getByRole('button', { name: 'Curve' }).hover();
  await expect(page.getByRole('tooltip')).toContainText('gain at every frequency');
});
