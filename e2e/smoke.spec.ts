import { expect, test } from '@playwright/test';

test('a key press after starting audio makes the Amp Tap sound and the Viewers draw', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start audio/i }).click();

  const level = page.getByTestId('amp-level');
  const hint = page.getByText(/press a key/i);
  await expect(hint).toBeVisible();

  await page.keyboard.down('KeyA');
  await expect.poll(async () => Number(await level.getAttribute('data-db'))).toBeGreaterThan(-40);
  await expect(hint).toBeHidden();

  for (const tap of ['Oscillator', 'Filter', 'Amp']) {
    const drawn = await page.getByLabel(`${tap} Spectrum`).evaluate((c: HTMLCanvasElement) => {
      const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
      return data.some((v, i) => i % 4 === 3 && v > 0);
    });
    expect(drawn, `${tap} Spectrum drew`).toBe(true);
  }

  await page.keyboard.up('KeyA');
  await expect.poll(async () => Number(await level.getAttribute('data-db'))).toBeLessThan(-80);
  await expect(hint).toBeVisible();
});

test('the theme toggle switches to light and is remembered', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /light theme/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
