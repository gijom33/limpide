import { expect, test } from '@playwright/test';

test('a key press after starting audio makes the Amp Tap sound and the Viewers draw', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start audio/i }).click();

  const level = page.getByTestId('amp-level');
  await expect(level).toBeVisible();

  await page.keyboard.down('KeyA');
  await expect.poll(async () => Number(await level.getAttribute('data-db'))).toBeGreaterThan(-40);

  const drawn = await page.getByLabel('Amp Spectrum').evaluate((c: HTMLCanvasElement) => {
    const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
    return data.some((v, i) => i % 4 === 3 && v > 0);
  });
  expect(drawn).toBe(true);

  await page.keyboard.up('KeyA');
  await expect.poll(async () => Number(await level.getAttribute('data-db'))).toBeLessThan(-80);
});
