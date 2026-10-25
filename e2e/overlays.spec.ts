import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

test('the Viewers start with Harmonics and the Curve; overlays switched on or off stay so after a reload', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const overlays = page.getByRole('group', { name: 'Show on Viewers' });
  for (const [name, on] of [['Harmonics', 'true'], ['Ideal', 'false'], ['Curve', 'true'], ['Guides', 'false'], ['Maths', 'false']] as const) {
    await expect(overlays.getByRole('button', { name })).toHaveAttribute('aria-pressed', on);
  }
  await expect(overlays.getByRole('button')).toHaveCount(5); // no Ghost: it was dropped; the Maths Layer joined

  await overlays.getByRole('button', { name: 'Guides' }).click();
  await overlays.getByRole('button', { name: 'Curve' }).click();
  await page.reload();
  await openDisplay(page);

  await expect(overlays.getByRole('button', { name: 'Guides' })).toHaveAttribute('aria-pressed', 'true');
  await expect(overlays.getByRole('button', { name: 'Curve' })).toHaveAttribute('aria-pressed', 'false');
  await expect(overlays.getByRole('button', { name: 'Harmonics' })).toHaveAttribute('aria-pressed', 'true');
});

test('explanations live in tooltips, not as text on screen', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await expect(page.getByText(/runs all the time/)).toBeHidden();
  await page.getByRole('button', { name: 'Curve' }).hover();
  await expect(page.getByRole('tooltip')).toContainText('gain at every frequency');
});
