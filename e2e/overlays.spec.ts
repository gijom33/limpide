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

test('the Ideal rings show only while a sound is there to compare them with: none after a reload, before a Note (the owner, 2026-10-27)', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('group', { name: 'Show on Viewers' }).getByRole('button', { name: 'Ideal' }).click();
  await page.keyboard.press('Escape');
  const rings = () => page.getByLabel('Oscillator Spectrum', { exact: true }).getAttribute('data-ideal-rings').then(Number);
  // A reload, with Ideal remembered: the browser holds the sound back until a tap, so the Spectrum is empty.
  await page.reload();
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/); // drawing
  await expect.poll(rings).toBe(0);
  await page.keyboard.down('KeyA');
  await expect.poll(rings, { timeout: 10000 }).toBeGreaterThan(3);
  await page.keyboard.up('KeyA'); // the Oscillators run on after the Release, their trace and rings with them
});

test('the Harmonic Markers’ ticks show only while a sound is there, as the Ideal rings: none after a reload, before a Note (the owner, 2026-10-27)', async ({ page }) => {
  await page.goto('/');
  const ticks = () => page.getByLabel('Oscillator Spectrum', { exact: true }).getAttribute('data-markers').then(Number);
  // The browser holds the sound back until a tap, so the Spectrum is empty.
  await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/); // drawing
  await expect.poll(ticks).toBe(0);
  await page.keyboard.down('KeyA');
  await expect.poll(ticks, { timeout: 10000 }).toBeGreaterThan(7);
  await page.keyboard.up('KeyA');
});
