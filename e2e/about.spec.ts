import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

test('the logo opens the About splash: version, build and credits; Close, Escape or a click outside close it', async ({ page }) => {
  await page.goto('/');
  const about = page.getByRole('dialog', { name: 'Limpide' });
  await expect(about).toBeHidden();
  await page.getByRole('heading', { level: 1 }).getByRole('button', { name: 'Limpide' }).click();
  await expect(about).toBeVisible();
  await expect(about).toContainText(`Version ${version}`);
  await expect(about).toContainText('Guillaume Boillet');
  await expect(about.getByRole('link', { name: 'Source on GitHub' })).toHaveAttribute('href', 'https://github.com/gijom33/limpide');

  await about.getByRole('button', { name: 'Close' }).click();
  await expect(about).toBeHidden();

  await page.getByRole('button', { name: 'Limpide' }).click();
  await page.keyboard.press('Escape');
  await expect(about).toBeHidden();

  await page.getByRole('button', { name: 'Limpide' }).click();
  await page.mouse.click(5, 5); // the backdrop
  await expect(about).toBeHidden();
  await page.getByRole('button', { name: 'Limpide' }).click(); // and it opens again
  await expect(about).toBeVisible();
});

test('wide screens have an About button beside Display that opens the splash; narrower ones keep it behind the logo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const about = page.getByRole('dialog', { name: 'Limpide' });
  await page.getByRole('button', { name: 'About' }).click();
  await expect(about).toBeVisible();
  await expect(about).toContainText(`Version ${version}`);
  await about.getByRole('button', { name: 'Close' }).click();
  await expect(about).toBeHidden();

  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(page.getByRole('button', { name: 'About' })).toBeHidden();
});
