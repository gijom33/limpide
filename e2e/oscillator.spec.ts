import { expect, test } from '@playwright/test';

test('picking a Waveform selects it, and Pulse Width only comes alive for the pulse', async ({ page }) => {
  await page.goto('/');
  const waveforms = page.getByRole('radiogroup', { name: 'Osc 1 Waveform' });
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

test('Osc 2 has its own Waveform, and its tuning knobs wake up once it is mixed in', async ({ page }) => {
  await page.goto('/');
  const osc1 = page.getByRole('radiogroup', { name: 'Osc 1 Waveform' });
  const osc2 = page.getByRole('radiogroup', { name: 'Osc 2 Waveform' });
  await osc2.getByRole('radio', { name: 'Square' }).click();
  await expect(osc2.getByRole('radio', { name: 'Square' })).toHaveAttribute('aria-checked', 'true');
  await expect(osc1.getByRole('radio', { name: 'Saw' })).toHaveAttribute('aria-checked', 'true');

  const detune = page.locator('.knob', { has: page.getByRole('slider', { name: 'Detune' }) });
  await expect(detune).toHaveAttribute('data-inactive', 'true');
  const mixOsc2 = page.getByRole('group', { name: 'Mixer' }).getByRole('slider', { name: 'Osc 2' });
  await mixOsc2.focus();
  await page.keyboard.press('ArrowUp');
  await expect(detune).not.toHaveAttribute('data-inactive');
});
