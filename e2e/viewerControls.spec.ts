import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

// A missing reading (the Tap hasn't drawn yet) must not count as loud: Number(null) would be 0 dB.
const level = (page: import('@playwright/test').Page) =>
  page.getByTestId('amp-level').getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));

test('Space freezes the Viewers on a frame while the sound carries on', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const freeze = page.getByRole('button', { name: 'Freeze' });
  await expect(page.getByTestId('amp-level')).toBeVisible(); // audio is up and listening for keys

  await page.keyboard.down('KeyA');
  await expect.poll(() => level(page)).toBeGreaterThan(-40);
  await page.keyboard.press('Space');
  await expect(freeze).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('main')).toHaveAttribute('data-frozen', 'true'); // the Viewers show it too

  await page.keyboard.up('KeyA'); // the Note ends, but the frozen Viewers still show it
  await page.waitForTimeout(800);
  expect(await level(page)).toBeGreaterThan(-40);

  await page.keyboard.press('Space');
  await expect(freeze).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('main')).not.toHaveAttribute('data-frozen', 'true');
  await expect.poll(() => level(page)).toBeLessThan(-80);
});

test('Space never presses the focused button instead', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const snapshot = page.getByRole('button', { name: 'Snapshot', exact: true });
  await snapshot.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Freeze' })).toHaveAttribute('aria-pressed', 'true');
  await expect(snapshot).toHaveAttribute('aria-pressed', 'false');
});

test('a Snapshot can be taken and cleared', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('button', { name: 'Snapshot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Snapshot', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Clear Snapshot' }).click();
  await expect(page.getByRole('button', { name: 'Snapshot', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Clear Snapshot' })).toHaveCount(0);
});

test('the Spectrum axes switch between log/linear and dB/linear', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const hz = page.getByRole('radiogroup', { name: 'Frequency axis' });
  await hz.getByRole('radio', { name: 'Lin' }).click();
  await expect(hz.getByRole('radio', { name: 'Lin' })).toHaveAttribute('aria-checked', 'true');
  const levelAxis = page.getByRole('radiogroup', { name: 'Level axis' });
  await levelAxis.getByRole('radio', { name: 'Lin' }).click();
  await expect(levelAxis.getByRole('radio', { name: 'dB' })).toHaveAttribute('aria-checked', 'false');
});

test('hovering a Spectrum reads out frequency, note and level', async ({ page }) => {
  await page.goto('/');
  const spectrum = page.getByLabel('Filter Spectrum');
  await spectrum.scrollIntoViewIfNeeded();
  const box = (await spectrum.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  // Halfway along the log axis is the geometric middle of 20 Hz–20 kHz: about 632 Hz.
  await expect(spectrum).toHaveAttribute('data-readout', /^6\d\d Hz · [A-G]#?\d.* · (−\d+ dB|silent)$/);
  await page.mouse.move(0, 0);
  await expect(spectrum).not.toHaveAttribute('data-readout');
});

test('controls are grouped under View, Axes and Show', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const toolbar = page.getByRole('region', { name: 'Viewer controls' });
  await expect(toolbar.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Freeze' })).toBeVisible();
  await expect(toolbar.getByRole('group', { name: 'Axes' }).getByRole('radiogroup', { name: 'Scope cycles' })).toBeVisible();
  await expect(toolbar.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Ghost' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Freeze' })).toHaveAttribute('aria-keyshortcuts', 'Space');
});

test('frozen Viewers do not change when a new Note is played or a knob is turned', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('amp-level')).toBeVisible();
  await page.keyboard.down('KeyA');
  await expect.poll(() => level(page)).toBeGreaterThan(-40);
  await page.keyboard.press('Space');

  const pixels = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('canvas')].map((c) => {
        const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
        let hash = 0;
        for (let i = 0; i < data.length; i += 7) hash = (hash * 31 + data[i]) | 0;
        return hash;
      }),
    );
  await page.waitForTimeout(200);
  const frozen = await pixels();

  await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyG'); // a different Note: G4
  const cutoff = page.getByRole('slider', { name: 'Cutoff' });
  await cutoff.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(400);

  expect(await pixels()).toEqual(frozen);
  await page.keyboard.up('KeyG');
});

test('a Snapshot keeps the waveform on every Scope as well as every Spectrum', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await expect(page.getByTestId('amp-level')).toBeVisible();
  const scopes = page.locator('canvas.scope');
  await expect(scopes).toHaveCount(3);

  await page.getByRole('button', { name: 'Snapshot', exact: true }).click();
  for (const scope of await scopes.all()) await expect(scope).toHaveAttribute('data-snapshot', 'true');

  await page.getByRole('button', { name: 'Clear Snapshot' }).click();
  for (const scope of await scopes.all()) await expect(scope).not.toHaveAttribute('data-snapshot', 'true');
});
