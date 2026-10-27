import { expect, type Page, test } from '@playwright/test';
import { openDisplay, sliderName } from './helpers';

const value = (page: Page, stage: string, name: string) =>
  page.getByRole('region', { name: stage }).locator('.knob', { has: page.getByRole('slider', { name: sliderName(name) }) }).locator('.knob-value > span').first();

test('the Maths Layer is off at first; on, it shows Q, dB, the formulas and the Effective Cutoff, and is remembered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const resonance = value(page, 'Filter', 'Resonance');
  await expect(resonance).toHaveText(/%$/);
  await expect(page.getByLabel('Oscillator formula')).toHaveCount(0);

  await openDisplay(page);
  const toggle = page.getByRole('button', { name: 'Maths' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await page.keyboard.press('Escape');

  // Resonance as the Filter's Q: one stage at 12 dB, two at 24 dB.
  await expect(resonance).toHaveText(/^Q \d+\.\d+$/);
  await page.getByRole('radiogroup', { name: 'Slope' }).getByRole('radio', { name: '24 dB' }).click();
  await expect(resonance).toHaveText(/^Q \d+\.\d+ ×2$/);
  // Levels in dB.
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await expect(value(page, 'Oscillators', 'Osc 1')).toHaveText(/dB$/);
  // The Harmonic formula of Osc 1's Waveform, and the Response Curve's for the Filter Mode and Slope.
  await page.getByRole('tab', { name: 'Osc 1' }).click();
  await expect(page.getByLabel('Oscillator formula')).toContainText('bₙ = 2 / (π n)');
  await page.getByRole('radiogroup', { name: 'Osc 1 Waveform' }).getByRole('radio', { name: 'Square' }).click();
  await expect(page.getByLabel('Oscillator formula')).toContainText('odd n only');
  await expect(page.getByLabel('Filter formula')).toContainText(/^\|H\| = \(.*\)²/);
  // The Effective Cutoff's value on the Timeline.
  await expect(page.locator('.timeline canvas')).toHaveAttribute('data-cutoff-readout', /Hz$/);

  await page.reload();
  await expect(value(page, 'Filter', 'Resonance')).toHaveText(/^Q /);
});

test('the Maths Layer keeps the page inside a laptop screen and moves no knob', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const knobs = () => page.locator('.knob').evaluateAll((all) => all.map((k) => Math.round(k.getBoundingClientRect().top)));
  const before = await knobs();
  await openDisplay(page);
  await page.getByRole('button', { name: 'Maths' }).click();
  await page.keyboard.press('Escape');
  expect(await knobs()).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
});
