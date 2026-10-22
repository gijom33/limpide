import { expect, test, type Locator } from '@playwright/test';

// A missing reading (the Tap hasn't drawn yet) must not count as loud: Number(null) would be 0 dB.
const db = (level: Locator) => level.getAttribute('data-db').then((v) => (v === null ? NaN : Number(v)));

test('a key press after starting audio makes the Amp Tap sound and the Viewers draw', async ({ page }) => {
  await page.goto('/');

  const level = page.getByTestId('amp-level');
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

