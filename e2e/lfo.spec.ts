import { expect, test } from '@playwright/test';

test('the LFO and Glide controls sit with the Envelope Timeline', async ({ page }) => {
  await page.goto('/');
  const timeline = page.getByRole('region', { name: 'Envelope Timeline' });
  const lfo = timeline.getByRole('group', { name: 'LFO' });
  await expect(lfo.getByRole('radiogroup', { name: 'LFO Waveform' }).getByRole('radio', { name: 'Sine' })).toHaveAttribute('aria-checked', 'true');
  await expect(lfo.getByRole('radiogroup', { name: 'LFO Destination' }).getByRole('radio', { name: 'Cutoff' })).toHaveAttribute('aria-checked', 'true');
  await expect(timeline.getByRole('slider', { name: 'Glide' })).toHaveAttribute('aria-valuetext', 'Off');

  await lfo.getByRole('radiogroup', { name: 'LFO Destination' }).getByRole('radio', { name: 'Pitch' }).click();
  await lfo.getByRole('radiogroup', { name: 'LFO Waveform' }).getByRole('radio', { name: 'Square' }).click();
  await expect(lfo.getByRole('radiogroup', { name: 'LFO Destination' }).getByRole('radio', { name: 'Pitch' })).toHaveAttribute('aria-checked', 'true');
  await expect(lfo.getByRole('radiogroup', { name: 'LFO Waveform' }).getByRole('radio', { name: 'Square' })).toHaveAttribute('aria-checked', 'true');
});

test('the LFO Rate wakes up once Depth is turned up', async ({ page }) => {
  await page.goto('/');
  const lfo = page.getByRole('group', { name: 'LFO' });
  const rate = lfo.locator('.knob', { has: page.getByRole('slider', { name: 'Rate' }) });
  await expect(rate).toHaveAttribute('data-inactive', 'true');
  await lfo.getByRole('slider', { name: 'Depth' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(rate).not.toHaveAttribute('data-inactive');
});

test('the LFO and Glide explain themselves', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radiogroup', { name: 'LFO Destination' }).hover();
  await expect(page.getByRole('tooltip')).toContainText(/vibrato/i);
});
