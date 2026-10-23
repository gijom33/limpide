import { expect, test } from '@playwright/test';

test('Osc 1 and Osc 2 are tabs, one shown at a time, with the Mixer always visible', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Oscillator' });
  const osc1 = tabs.getByRole('tab', { name: 'Osc 1' });
  const osc2 = tabs.getByRole('tab', { name: /Osc 2/ });
  await expect(osc1).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('radiogroup', { name: 'Osc 1 Waveform' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Osc 2 Waveform' })).toBeHidden();

  await osc2.click();
  await expect(osc2).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('radiogroup', { name: 'Osc 2 Waveform' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Osc 1 Waveform' })).toBeHidden();
  await expect(page.getByRole('group', { name: 'Mixer' })).toBeVisible();
});

test('the tabs work from the keyboard (arrow keys)', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Oscillator' });
  await tabs.getByRole('tab', { name: 'Osc 1' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: /Osc 2/ })).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByRole('tab', { name: /Osc 2/ })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.getByRole('tab', { name: 'Osc 1' })).toHaveAttribute('aria-selected', 'true');
});

test('the Osc 2 tab shows when Osc 2 is sounding, even while Osc 1 is selected', async ({ page }) => {
  await page.goto('/');
  const osc2 = page.getByRole('tablist', { name: 'Oscillator' }).getByRole('tab', { name: /Osc 2/ });
  await expect(osc2).not.toHaveAttribute('data-sounding', 'true');
  const mix2 = page.getByRole('group', { name: 'Mixer' }).getByRole('slider', { name: 'Osc 2' });
  await mix2.focus();
  await page.keyboard.press('ArrowUp');
  await expect(osc2).toHaveAttribute('data-sounding', 'true');
});

for (const [width, height] of [
  [1300, 900],
  [1100, 900],
]) {
  test(`intermediate windows fit without scrolling too (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
  });
}

for (const width of [1710, 1100, 872]) {
  test(`Pulse Width sits in the same place on both Oscillator tabs (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const where = async (osc: 'Osc 1' | 'Osc 2') => {
      await page.getByRole('tab', { name: new RegExp(osc) }).click();
      const box = await page.getByRole('group', { name: osc }).getByRole('slider', { name: 'Pulse Width' }).boundingBox();
      return { x: Math.round(box!.x), y: Math.round(box!.y) };
    };
    expect(await where('Osc 2')).toEqual(await where('Osc 1'));
  });
}
