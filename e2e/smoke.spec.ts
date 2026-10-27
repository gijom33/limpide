import { expect, type Locator, test } from '@playwright/test';

// A missing reading (the Tap hasn't drawn yet) must not count as loud: Number(null) would be 0 dB.
const db = (level: Locator) => level.getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));

test('a key press after starting audio makes the Amp Tap sound and the Viewers draw', async ({ page }) => {
  await page.goto('/');

  const level = page.getByLabel('Amp Scope', { exact: true });
  await expect(level).toHaveAttribute('data-db', /.+/); // the app is listening for keys once the Viewers draw

  await page.keyboard.down('KeyA');
  await expect.poll(() => db(level)).toBeGreaterThan(-40);

  for (const tap of ['Oscillator', 'Filter', 'Amp']) {
    const drawn = await page.getByLabel(`${tap} Spectrum`).evaluate((c: HTMLCanvasElement) => {
      const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
      return data.some((v, i) => i % 4 === 3 && v > 0);
    });
    expect(drawn, `${tap} Spectrum drew`).toBe(true);
  }

  await page.keyboard.up('KeyA');
  await expect.poll(() => db(level)).toBeLessThan(-80);
});


test('the Viewers stand on their own: no Tap captions and no dB readouts over them', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amp Scope')).toHaveAttribute('data-db', /.+/); // the level is still measured, for tests
  for (const stage of ['Oscillators', 'Filter', 'Amp']) {
    const block = page.getByRole('region', { name: stage });
    await expect(block.getByText(/\bTap\b/), stage).toHaveCount(0);
    await expect(block.getByText(/-?\d+(\.\d)? dB$|^silent$/), stage).toHaveCount(0);
  }
});
