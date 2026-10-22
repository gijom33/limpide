import { expect, test } from '@playwright/test';

// A missing reading (the Tap hasn't drawn yet) must not count as loud: Number(null) would be 0 dB.
const level = (page: import('@playwright/test').Page) =>
  page.getByTestId('amp-level').getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));

test('Space freezes the Viewers on a frame while the sound carries on', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start audio/i }).click();
  const freeze = page.getByRole('button', { name: 'Freeze' });
  await expect(page.getByTestId('amp-level')).toBeVisible(); // audio is up and listening for keys

  await page.keyboard.down('KeyA');
  await expect.poll(() => level(page)).toBeGreaterThan(-40);
  await page.keyboard.press('Space');
  await expect(freeze).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.up('KeyA'); // the Note ends, but the frozen Viewers still show it
  await page.waitForTimeout(800);
  expect(await level(page)).toBeGreaterThan(-40);

  await page.keyboard.press('Space');
  await expect(freeze).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => level(page)).toBeLessThan(-80);
});

test('Space never presses the focused button instead', async ({ page }) => {
  await page.goto('/');
  const snapshot = page.getByRole('button', { name: 'Snapshot', exact: true });
  await snapshot.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Freeze' })).toHaveAttribute('aria-pressed', 'true');
  await expect(snapshot).toHaveAttribute('aria-pressed', 'false');
});

test('a Snapshot can be taken and cleared', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Snapshot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Snapshot', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Clear Snapshot' }).click();
  await expect(page.getByRole('button', { name: 'Snapshot', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Clear Snapshot' })).toHaveCount(0);
});

test('the Spectrum axes switch between log/linear and dB/linear', async ({ page }) => {
  await page.goto('/');
  const hz = page.getByRole('radiogroup', { name: 'Hz' });
  await hz.getByRole('radio', { name: 'Lin' }).click();
  await expect(hz.getByRole('radio', { name: 'Lin' })).toHaveAttribute('aria-checked', 'true');
  const levelAxis = page.getByRole('radiogroup', { name: 'Level' });
  await levelAxis.getByRole('radio', { name: 'Lin' }).click();
  await expect(levelAxis.getByRole('radio', { name: 'dB' })).toHaveAttribute('aria-checked', 'false');
});

test('hovering a Spectrum reads out frequency, note and level', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start audio/i }).click();
  const spectrum = page.getByLabel('Filter Spectrum');
  const box = (await spectrum.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  // Halfway along the log axis is the geometric middle of 20 Hz–20 kHz: about 632 Hz.
  await expect(spectrum).toHaveAttribute('data-readout', /^6\d\d Hz · [A-G]#?\d.* · (−\d+ dB|silent)$/);
  await page.mouse.move(0, 0);
  await expect(spectrum).not.toHaveAttribute('data-readout');
});
