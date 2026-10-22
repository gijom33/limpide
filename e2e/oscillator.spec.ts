import { expect, test } from '@playwright/test';

test('picking a Waveform selects it, and Pulse Width only comes alive for the pulse', async ({ page }) => {
  await page.goto('/');
  const waveforms = page.getByRole('radiogroup', { name: 'Waveform' });
  const pulseWidth = page.locator('.knob', { has: page.getByRole('slider', { name: 'Pulse Width' }) });

  await expect(waveforms.getByRole('radio', { name: 'Saw' })).toHaveAttribute('aria-checked', 'true');
  await expect(pulseWidth).toHaveAttribute('data-inactive', 'true');

  await waveforms.getByRole('radio', { name: 'Pulse' }).click();
  await expect(waveforms.getByRole('radio', { name: 'Pulse' })).toHaveAttribute('aria-checked', 'true');
  await expect(waveforms.getByRole('radio', { name: 'Saw' })).toHaveAttribute('aria-checked', 'false');
  await expect(pulseWidth).not.toHaveAttribute('data-inactive');
});

test('the Scope cycles choice switches between 1, 2 and 4', async ({ page }) => {
  await page.goto('/');
  const cycles = page.getByRole('radiogroup', { name: 'Scope cycles' });
  await expect(cycles.getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'true');
  await cycles.getByRole('radio', { name: '4' }).click();
  await expect(cycles.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true');
  await expect(cycles.getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'false');
});
