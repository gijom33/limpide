import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

const demo = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Demo' });
const patchName = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^Patch:/ });

test('the Demo tours one Preset per group, in order, making sound, and stops when a key is pressed', async ({ page }) => {
  test.setTimeout(60000);
  test.slow(); // waits for a phrase to end and the next Preset to load
  await page.goto('/');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(patchName(page)).toContainText('Init'); // the Start group's Preset, first
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /^-?[0-5]?\d(\.\d+)?$/, { timeout: 4000 }); // sound
  await expect(patchName(page)).toContainText('PWM Morph', { timeout: 15000 }); // Shapes, next
  await expect(patchName(page)).not.toHaveAttribute('data-changed', 'true'); // loaded, not edited
  await page.keyboard.press('a');
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.up('a');
  const name = await patchName(page).textContent();
  await page.waitForTimeout(1500);
  expect(await patchName(page).textContent()).toBe(name); // the tour has stopped moving
});

test('the Demo never touches the Display settings, and a knob touch stops it', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('button', { name: 'Guides' }).click(); // a setting that is not the default
  await page.keyboard.press('Escape');
  await demo(page).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Cutoff' }).click();
  await expect(demo(page)).toHaveAttribute('aria-pressed', 'false');
  await openDisplay(page);
  await expect(page.getByRole('button', { name: 'Guides' })).toHaveAttribute('aria-pressed', 'true'); // untouched
  await expect(page.getByRole('radiogroup', { name: 'Viewers follow' }).getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
});
