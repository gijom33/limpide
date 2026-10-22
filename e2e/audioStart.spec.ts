import { expect, test } from '@playwright/test';

// The app is listening once the Viewers are drawing (a key pressed in the first few milliseconds after
// the load event, before React attaches its listeners, is not something a person can do).
const ready = (page: import('@playwright/test').Page) => expect(page.getByTestId('amp-level')).toHaveAttribute('data-db', /.+/);

const db = (page: import('@playwright/test').Page) =>
  page.getByTestId('amp-level').getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));

test('the Viewers are on screen from the start, with no button to click first', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /start audio/i })).toHaveCount(0);
  for (const tap of ['Oscillator', 'Filter', 'Amp']) {
    await expect(page.getByLabel(`${tap} Scope`)).toBeVisible();
    await expect(page.getByLabel(`${tap} Spectrum`)).toBeVisible();
  }
});

test('the first key press both unlocks audio and plays its Note', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.keyboard.down('KeyA');
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await page.keyboard.up('KeyA');
  await expect(page.getByText(/enable sound/i)).toHaveCount(0);
});

test('a first click anywhere unlocks audio too', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.getByRole('radiogroup', { name: 'Osc 1 Waveform' }).getByRole('radio', { name: 'Square' }).click();
  await page.keyboard.down('KeyA');
  await expect.poll(() => db(page), { timeout: 10000 }).toBeGreaterThan(-40);
  await page.keyboard.up('KeyA');
});
