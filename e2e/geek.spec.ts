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

// Issue 169: the LFOs' periods and swings, and the Cutoff at the Note under Key Track.
const lfo = (page: Page, n: 1 | 2 = 1) => page.getByRole('group', { name: `LFO ${n}`, exact: true });
const lfoValue = (page: Page, name: string) => page.locator('.knob', { has: page.getByRole('slider', { name, exact: true }) }).locator('.knob-value > span').first();

test('an LFO’s Rate reads its period, at the tempo while synced, and its Depth the swing in its Destination’s unit (issue 169)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(lfoValue(page, 'LFO 1 Rate')).toHaveText('2.00 Hz');
  await expect(lfoValue(page, 'LFO 1 Depth')).toHaveText('0 %');
  await page.evaluate(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.reload();

  await expect(lfoValue(page, 'LFO 1 Rate')).toHaveText('0.50 s');
  await lfo(page).getByRole('button', { name: 'LFO 1 Sync' }).click();
  await expect(lfo(page).getByRole('slider', { name: 'LFO 1 Rate' })).toHaveAttribute('aria-valuetext', '1/4, 2 Hz');
  await expect(lfoValue(page, 'LFO 1 Rate')).toHaveText('0.50 s');
  // At the tempo: 1/4 at 110 BPM.
  const bpm = page.getByRole('spinbutton', { name: 'Tempo' });
  await bpm.focus();
  await page.keyboard.press('PageDown');
  await expect(bpm).toHaveAttribute('aria-valuenow', '110');
  await expect(lfoValue(page, 'LFO 1 Rate')).toHaveText('0.55 s');

  // LFO 1 on the Cutoff: 40 % is ±0.80 octave; LFO 2 on Pitch, 50 % is ±0.50 semitone.
  const depth = lfo(page).getByRole('slider', { name: 'LFO 1 Depth' });
  await expect(lfoValue(page, 'LFO 1 Depth')).toHaveText('±0.00 oct');
  for (let i = 0; i < 4; i++) await depth.press('PageUp');
  await expect(lfoValue(page, 'LFO 1 Depth')).toHaveText('±0.80 oct');
  const depth2 = lfo(page, 2).getByRole('slider', { name: 'LFO 2 Depth' });
  for (let i = 0; i < 5; i++) await depth2.press('PageUp');
  await expect(lfoValue(page, 'LFO 2 Depth')).toHaveText('±0.50 st');
  // Volume dips: 40 % is −4.4 dB below the wave's top; Pulse Width in its own %.
  const next = lfo(page).getByRole('button', { name: 'Next destination' });
  await next.click();
  await next.click();
  await expect(lfo(page).getByRole('button', { name: /Destination:/ })).toHaveAccessibleName('LFO 1 Destination: Volume');
  await expect(lfoValue(page, 'LFO 1 Depth')).toHaveText('−4.4 dB');
  for (let i = 0; i < 4; i++) await next.click();
  await expect(lfo(page).getByRole('button', { name: /Destination:/ })).toHaveAccessibleName('LFO 1 Destination: Pulse Width');
  await expect(lfoValue(page, 'LFO 1 Depth')).toHaveText('±16 %');
});

test('Key Track reads the Cutoff at the Note played, A4’s before any (issue 169)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.goto('/');
  const keyTrack = page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Key Track' });
  const readout = value(page, 'Filter', 'Key Track');
  await expect(readout).toHaveText('2.00 kHz'); // at 0 %, the Cutoff's own
  await keyTrack.press('End'); // 100 %: an octave per octave from C4, so A4 is 2 kHz × 2^(9/12)
  await expect(readout).toHaveText('3.36 kHz');
  await keyTrack.blur();
  await page.keyboard.down('KeyA'); // C4
  await page.keyboard.up('KeyA');
  await expect(readout).toHaveText('2.00 kHz');
});

test('the tips of the LFOs’ Rate and Depth and of Key Track give their formulas under the hood, with the layer on (issue 169)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.goto('/');
  const tipOf = (text: string) => page.getByRole('tooltip').filter({ hasText: text });
  await page.keyboard.press('Tab'); // the keys in use: a focus shows its tip
  await lfo(page).getByRole('slider', { name: 'LFO 1 Rate' }).focus();
  await expect(tipOf('How fast the LFO repeats').locator('.tooltip-hood')).toContainText('T = 1 / f');
  await lfo(page).getByRole('slider', { name: 'LFO 1 Depth' }).focus();
  await expect(tipOf('How far the LFO moves').locator('.tooltip-hood')).toContainText(/swing = Depth × its reach.*Cutoff ±2 oct/);
  await page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Key Track' }).focus();
  await expect(tipOf('How far the Cutoff follows').locator('.tooltip-hood')).toContainText('fc = Cutoff × 2^(k·(n − 60)/12)');
  await lfo(page).getByRole('button', { name: 'LFO 1 Sync' }).click();
  await page.keyboard.press('Tab');
  await lfo(page).getByRole('slider', { name: 'LFO 1 Rate' }).focus();
  await expect(tipOf('With Sync on').locator('.tooltip-hood')).toContainText('T = beats × 60 / BPM');
});

test('on a phone the LFOs’ and Key Track’s numbers show in the name’s place while the control moves (issue 169)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.goto('/');
  const depth = page.getByRole('slider', { name: 'LFO 1 Depth' });
  const knob = page.locator('.knob', { has: depth });
  await expect(knob.locator('.knob-value > span').first()).toBeHidden();
  for (let i = 0; i < 4; i++) await depth.press('PageUp');
  await expect(knob.locator('.knob-value > span').first()).toBeVisible();
  await expect(knob.locator('.knob-value > span').first()).toHaveText('±0.80 oct');
  await expect(knob.locator('.knob-label')).toBeHidden();
  const keyTrack = page.getByRole('slider', { name: 'Key Track', exact: true });
  await keyTrack.press('End');
  await expect(page.locator('.knob', { has: keyTrack }).locator('.knob-value > span').first()).toHaveText('3.36 kHz');
});

test('the Envelope faders’ and Glide’s tips work out τ under the hood, with the layer on only; the readouts stay (issue 168)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const amp = page.getByRole('region', { name: 'Amp' });
  const decay = amp.getByRole('slider', { name: sliderName('Decay') });
  const tipOf = (text: string) => page.getByRole('tooltip').filter({ hasText: text });
  await page.keyboard.press('Tab'); // the keys in use: a focus shows its tip
  await decay.focus();
  await expect(tipOf('How long the Envelope then takes to fall')).toBeVisible();
  await expect(tipOf('How long the Envelope then takes to fall').locator('.tooltip-hood')).toHaveCount(0);

  await page.evaluate(() => localStorage.setItem('limpide.overlays', JSON.stringify({ geek: true })));
  await page.reload();
  await page.keyboard.press('Tab');
  await decay.focus();
  const hood = tipOf('How long the Envelope then takes to fall').locator('.tooltip-hood');
  // Init's 300 ms Decay: τ a quarter of it, worked out live as the fader moves.
  await expect(hood).toContainText(/x = S \+ \(x₀ − S\)·e\^\(−t\/τ\)\s*τ = Decay ÷ 4 = 75\.0 ms now/);
  await expect(value(page, 'Amp', 'Decay')).toHaveText('300 ms');
  await decay.press('End');
  await expect(hood).toContainText('τ = Decay ÷ 4 = 2.50 s now');
  await amp.getByRole('slider', { name: sliderName('Attack') }).focus();
  await expect(tipOf('How long the Envelope takes to rise').locator('.tooltip-hood')).toContainText(/τ = Attack ÷ 3 = .* now.*not a straight rise/);
  await amp.getByRole('slider', { name: sliderName('Release') }).focus();
  await expect(tipOf('How long the Envelope takes to fall back').locator('.tooltip-hood')).toContainText(/x = x₀·e\^\(−t\/τ\)\s*τ = Release ÷ 6 = .* now/);
  const glide = page.getByRole('slider', { name: 'Glide', exact: true });
  await glide.focus();
  const glideHood = tipOf('Slides the pitch').locator('.tooltip-hood');
  await expect(glideHood).toContainText(/f = f₂ \+ \(f₁ − f₂\)·e\^\(−t\/τ\)\s*Off: the pitch jumps/);
  await glide.press('End');
  await expect(glideHood).toContainText('τ = Glide ÷ 4 = 500 ms now');
});
