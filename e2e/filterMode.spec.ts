import { expect, test } from '@playwright/test';

test('the Filter Mode and Slope can be chosen, starting at a 12 dB low-pass', async ({ page }) => {
  await page.goto('/');
  const mode = page.getByRole('radiogroup', { name: 'Filter Mode' });
  const slope = page.getByRole('radiogroup', { name: 'Slope' });
  await expect(mode.getByRole('radio', { name: 'Low-pass' })).toHaveAttribute('aria-checked', 'true');
  await expect(slope.getByRole('radio', { name: '12 dB' })).toHaveAttribute('aria-checked', 'true');

  await mode.getByRole('radio', { name: 'Band-pass' }).click();
  await slope.getByRole('radio', { name: '24 dB' }).click();
  await expect(mode.getByRole('radio', { name: 'Band-pass' })).toHaveAttribute('aria-checked', 'true');
  await expect(mode.getByRole('radio', { name: 'Low-pass' })).toHaveAttribute('aria-checked', 'false');
  await expect(slope.getByRole('radio', { name: '24 dB' })).toHaveAttribute('aria-checked', 'true');
});

test('each Filter Mode explains itself', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radiogroup', { name: 'Filter Mode' }).hover();
  await expect(page.getByRole('tooltip')).toContainText(/high-pass/i);
});

test('Key Track sits with the Filter’s knobs, starts off, and its tooltip says what it does', async ({ page }) => {
  await page.goto('/');
  const knob = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Key Track' });
  await expect(knob).toHaveAttribute('aria-valuetext', '0 %');
  await knob.hover();
  await expect(page.getByRole('tooltip')).toContainText(/octave per octave/i);
});
