import { expect, test } from '@playwright/test';

test('hovering Freeze explains what it does, and how to use it', async ({ page }) => {
  await page.goto('/');
  const freeze = page.getByRole('button', { name: 'Freeze' });
  await freeze.hover();
  const tip = page.getByRole('tooltip');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('not the sound');
  await expect(tip).toContainText('Space');
  await expect(freeze).toHaveAttribute('aria-describedby', (await tip.getAttribute('id'))!);

  await page.mouse.move(0, 400);
  await expect(tip).toBeHidden();
});

test('hovering Snapshot explains the grey comparison trace', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Snapshot', exact: true }).hover();
  await expect(page.getByRole('tooltip')).toContainText('grey');
});

test('keyboard users get the same explanation on focus, and Escape dismisses it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Snapshot', exact: true }).focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
});

test('every toolbar control explains itself, without doubling up on native browser tooltips', async ({ page }) => {
  await page.goto('/');
  const toolbar = page.getByRole('region', { name: 'Viewer controls' });
  await expect(toolbar.locator('[title]')).toHaveCount(0);
  for (const name of ['Harmonics', 'Ideal', 'Curve', 'Ghost', 'Guides']) {
    await toolbar.getByRole('button', { name }).hover();
    await expect(page.getByRole('tooltip'), name).toBeVisible();
  }
  for (const name of ['Frequency axis', 'Level axis', 'Scope cycles']) {
    await toolbar.getByRole('radiogroup', { name }).hover();
    await expect(page.getByRole('tooltip'), name).toBeVisible();
  }
});
