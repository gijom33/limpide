import { expect, test } from '@playwright/test';

test('picking a Waveform selects it, and Pulse Width only comes alive for the pulse', async ({ page }) => {
  await page.goto('/');
  const waveforms = page.getByRole('radiogroup', { name: 'Osc 1 Waveform' });
  const pulseWidth = page.getByRole('group', { name: 'Osc 1' }).locator('.knob', { has: page.getByRole('slider', { name: 'Pulse Width' }) });

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
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  const osc1 = page.getByRole('radiogroup', { name: 'Osc 1 Waveform' });
  const osc2 = page.getByRole('radiogroup', { name: 'Osc 2 Waveform' });
  await osc2.getByRole('radio', { name: 'Square' }).click();
  await expect(osc2.getByRole('radio', { name: 'Square' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('tab', { name: 'Osc 1' }).click();
  await expect(osc1.getByRole('radio', { name: 'Saw' })).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('tab', { name: /Osc 2/ }).click(); // Detune lives on the Osc 2 tab
  const detune = page.locator('.knob', { has: page.getByRole('slider', { name: 'Detune' }) });
  await expect(detune).toHaveAttribute('data-inactive', 'true');
  const mixOsc2 = page.getByRole('group', { name: 'Mixer' }).getByRole('slider', { name: 'Osc 2' });
  await mixOsc2.focus();
  await page.keyboard.press('ArrowUp');
  await expect(detune).not.toHaveAttribute('data-inactive');
});

test('each Oscillator has its own Pulse Width, awake only while that Oscillator plays a pulse', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  const osc2 = page.getByRole('group', { name: 'Osc 2' });
  const width2 = osc2.locator('.knob', { has: page.getByRole('slider', { name: 'Pulse Width' }) });
  const mix2 = page.getByRole('group', { name: 'Mixer' }).getByRole('slider', { name: 'Osc 2' });
  await mix2.focus();
  await page.keyboard.press('ArrowUp');
  await expect(width2).toHaveAttribute('data-inactive', 'true'); // Osc 2 is still a saw
  await osc2.getByRole('radio', { name: 'Pulse' }).click();
  await expect(width2).not.toHaveAttribute('data-inactive');
  await page.getByRole('tab', { name: 'Osc 1' }).click();
  const width1 = page.getByRole('group', { name: 'Osc 1' }).locator('.knob', { has: page.getByRole('slider', { name: 'Pulse Width' }) });
  await expect(width1).toHaveAttribute('data-inactive', 'true'); // Osc 1 is still a saw
});
