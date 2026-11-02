import { expect, type Page, test } from '@playwright/test';
import { openDisplay, sliderName } from './helpers';

const value = (page: Page, stage: string, name: string) =>
  page.getByRole('region', { name: stage }).locator('.knob', { has: page.getByRole('slider', { name: sliderName(name) }) }).locator('.knob-value > span').first();

test('the Synth Geek Layer is off at first; on, it shows Q, dB, the formulas and the Effective Cutoff, and is remembered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const resonance = value(page, 'Filter', 'Resonance');
  await expect(resonance).toHaveText(/%$/);
  await expect(page.getByLabel('Oscillator formula')).toHaveCount(0);

  await openDisplay(page);
  const toggle = page.getByRole('button', { name: 'Geek' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  // Its swatch is a pair of glasses, drawn (two round lenses), so it looks the same in every font (issue 165).
  const lenses = await toggle.locator('.swatch').evaluate((s) =>
    ['::before', '::after'].map((p) => getComputedStyle(s, p)).map((c) => ({ content: c.content, round: c.borderRadius === '50%' })),
  );
  expect(lenses).toEqual([{ content: '""', round: true }, { content: '""', round: true }]);
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
  // The Effective Cutoff's value on the Timeline, while its line is drawn: once the Filter Envelope moves it (issue 63).
  await expect(page.locator('.timeline canvas')).toHaveAttribute('data-cutoff-readout', '');
  await page.getByRole('slider', { name: 'Filter Envelope Amount' }).press('ArrowUp');
  await expect(page.locator('.timeline canvas')).toHaveAttribute('data-cutoff-readout', /Hz$/);

  await page.reload();
  await expect(value(page, 'Filter', 'Resonance')).toHaveText(/^Q /);
});

test('under FM and Ring the Synth Geek Layer gives their rules for the knobs, and no longer the saw’s series as the sound’s (issue 109)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.goto('/');
  const formula = page.getByLabel('Oscillator formula');
  await expect(formula).toContainText('every n: each Harmonic 1/n of the first');
  const fm = page.getByRole('region', { name: 'Oscillators' }).getByRole('slider', { name: 'FM' });
  await fm.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('PageUp');
  await expect(fm).toHaveAttribute('aria-valuetext', '50 %');
  await expect(formula).toContainText('β = 4 × FM = 2.00');
  await expect(formula).toContainText('Osc 1 before FM, not the sound now');
  await expect(formula).not.toContainText('every n: each Harmonic 1/n of the first');

  await page.getByRole('button', { name: /^Patch: / }).click();
  await page.getByRole('dialog', { name: 'Patches' }).getByRole('button', { name: 'Ring Bell', exact: true }).click();
  await expect(formula).toHaveText(/^Ring, Osc 1 × Osc 2.*the first pair 1\.38 and 3\.38 × f₁$/s);
  await expect(formula).not.toContainText('bₙ =');
});

test('the Synth Geek Layer keeps the page inside a laptop screen and moves no knob', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const knobs = () => page.locator('.knob').evaluateAll((all) => all.map((k) => Math.round(k.getBoundingClientRect().top)));
  const before = await knobs();
  await openDisplay(page);
  await page.getByRole('button', { name: 'Geek' }).click();
  await page.keyboard.press('Escape');
  expect(await knobs()).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
});

// Issue 167: Osc 2's tuning in the numbers the engine plays, Detune's beats at the Note played (A4 before any, said).
test('Osc 2’s Octave and Semitone read their multiples, Detune its beats at the Note played (issue 167)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Osc 2' }).click();
  const osc2 = (name: string) => value(page, 'Oscillators', name);
  await expect(osc2('Semitone')).toHaveText('×1');
  await expect(osc2('Detune')).toHaveText('0.00 Hz at A4');

  const detune = page.getByRole('region', { name: 'Oscillators' }).getByRole('slider', { name: sliderName('Detune') });
  await detune.press('PageUp'); // 10 cents
  await expect(detune).toHaveAttribute('aria-valuetext', '+10 ¢');
  await expect(osc2('Detune')).toHaveText('2.55 Hz at A4');
  // A Note played: its beats, no longer A4's.
  await detune.blur();
  await page.keyboard.down('KeyA');
  await page.keyboard.up('KeyA');
  await expect(osc2('Detune')).toHaveText(/^\d\.\d\d Hz beats$/);

  const semitone = page.getByRole('region', { name: 'Oscillators' }).getByRole('slider', { name: sliderName('Semitone') });
  for (let i = 0; i < 7; i++) await semitone.press('ArrowUp');
  await expect(osc2('Semitone')).toHaveText('×1.498');
  const octave = page.getByRole('slider', { name: 'Osc 2 Octave' });
  const octaveValue = page.locator('.knob', { has: octave }).locator('.knob-value > span').first();
  await expect(octaveValue).toHaveText('×1');
  await octave.press('ArrowUp');
  await expect(octaveValue).toHaveText('×2');
  await octave.press('ArrowDown');
  await octave.press('ArrowDown');
  await expect(octaveValue).toHaveText('×½');
});

test('the tips of Osc 2’s tuning and the Noise give their formulas under the hood, with the layer on only (issue 167)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Osc 2' }).click();
  const region = page.getByRole('region', { name: 'Oscillators' });
  const tipOf = (text: string) => page.getByRole('tooltip').filter({ hasText: text });
  await page.keyboard.press('Tab'); // the keys in use: a focus shows its tip
  await region.getByRole('slider', { name: sliderName('Detune') }).focus();
  await expect(tipOf('Fine-tunes Osc 2')).toBeVisible();
  await expect(tipOf('Fine-tunes Osc 2').locator('.tooltip-hood')).toHaveCount(0);
  await expect(value(page, 'Oscillators', 'Detune')).toHaveText(/¢$/);

  await page.evaluate(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.reload();
  await page.getByRole('tab', { name: 'Osc 2' }).click();
  await page.keyboard.press('Tab');
  await region.getByRole('slider', { name: sliderName('Detune') }).focus();
  const detune = tipOf('Fine-tunes Osc 2');
  await expect(detune.locator('.tooltip-hood')).toContainText(/^Under the hood\s*Δf = f·\(2\^\(c\/1200\) − 1\)/);
  // Above the History line, which stays last.
  await expect(detune.locator('.tooltip-hood + .tooltip-history')).toHaveCount(1);
  await region.getByRole('slider', { name: sliderName('Semitone') }).focus();
  await expect(tipOf('Shifts Osc 2 by semitones').locator('.tooltip-hood')).toContainText('2^(s/12)');
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await page.keyboard.press('Tab'); // the keys in use again, after the click
  await region.getByRole('slider', { name: 'Noise' }).focus();
  await expect(tipOf('An unpitched sound').locator('.tooltip-hood')).toContainText(/white.*flat.*pink.*−3 dB per octave/);
});

test('on a phone Osc 2’s numbers show in the name’s place while the control moves (issue 167)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Osc 2' }).click();
  const semitone = page.getByRole('slider', { name: 'Osc 2 Semitone' });
  const knob = page.locator('.knob', { has: semitone });
  await expect(knob.locator('.knob-value > span').first()).toBeHidden();
  for (let i = 0; i < 7; i++) await semitone.press('ArrowUp');
  await expect(knob.locator('.knob-value > span').first()).toBeVisible();
  await expect(knob.locator('.knob-value > span').first()).toHaveText('×1.498');
  await expect(knob.locator('.knob-label')).toBeHidden();
  // Detune's figure alone there, its words too wide for the name's place: 440 Hz × 1.498 × (2^(10/1200) − 1).
  const detune = page.getByRole('slider', { name: 'Osc 2 Detune' });
  await detune.press('PageUp');
  await expect(page.locator('.knob', { has: detune }).locator('.knob-value > span').first()).toHaveText('3.82 Hz', { useInnerText: true });
});
