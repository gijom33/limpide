import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

const voices = (page: import('@playwright/test').Page) => page.getByRole('radiogroup', { name: 'Voices' });

test('Voices is chosen on the Amp heading line, starts at 1, and is kept with the Patch', async ({ page }) => {
  await page.goto('/');
  const amp = page.getByRole('region', { name: 'Amp' });
  await expect(amp.getByRole('radiogroup', { name: 'Voices' }).getByRole('radio', { name: '1' })).toHaveAttribute('aria-checked', 'true');
  await expect(voices(page).getByRole('radio')).toHaveCount(8);
  await voices(page).getByRole('radio', { name: '4' }).click();
  await expect(voices(page).getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: /^Patch:/ })).toContainText('Init'); // the Patch is edited, not swapped
  await expect.poll(() => page.evaluate(() => Object.values(localStorage).some((v) => v.includes('"voices":4')))).toBe(true); // autosaved
  await page.reload();
  await expect(voices(page).getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true'); // autosaved
});

test('with four Voices a chord sounds: both held keys light, and the Viewers follow the newest Note', async ({ page }) => {
  await page.goto('/');
  await voices(page).getByRole('radio', { name: '4' }).click();
  const piano = page.getByRole('group', { name: 'Piano' });
  await page.keyboard.down('a');
  await page.keyboard.down('d');
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(2);
  // The Oscillator Scope is Cycle Locked to the newest Note: it reports a level, i.e. it is drawing a Voice.
  await expect(page.getByLabel('Oscillator Scope', { exact: true })).toHaveAttribute('data-db', /^-?\d/);
  await page.keyboard.up('d');
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(1);
  await page.keyboard.up('a');
  await expect(piano.locator('[aria-pressed="true"]')).toHaveCount(0);
});

test('the Voices control is a row of its own under the Amp heading, as Filter Mode is under the Filter’s', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const heading = page.getByRole('region', { name: 'Amp' }).getByRole('heading', { level: 2 });
  const [h, v] = await Promise.all([heading.boundingBox(), page.locator('.voices-field').boundingBox()]);
  expect(v!.y).toBeGreaterThanOrEqual(h!.y + h!.height - 1);
  expect(Math.abs(v!.x - h!.x)).toBeLessThanOrEqual(1); // the field (caption first) starts where the heading starts
  const filterHeading = page.getByRole('region', { name: 'Filter' }).getByRole('heading', { level: 2 });
  const [fh, fm] = await Promise.all([filterHeading.boundingBox(), page.getByRole('radiogroup', { name: 'Filter Mode' }).boundingBox()]);
  expect(fm!.y).toBeGreaterThanOrEqual(fh!.y + fh!.height - 1);
});

test('the Display panel chooses what the Amp Viewers follow: all Voices by default, or the newest Note', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const follow = page.getByRole('radiogroup', { name: 'Viewers follow' });
  await expect(follow.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
  await follow.getByRole('radio', { name: 'Newest' }).click();
  await expect(follow.getByRole('radio', { name: 'Newest' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await page.keyboard.down('a');
  await expect(page.getByLabel('Oscillator Scope', { exact: true })).toHaveAttribute('data-db', /^-?\d/);
  await page.keyboard.up('a');
});

test('Osc 2’s tuning knobs are one shared row below both Oscillator tabs: same place and state whichever shows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const tuning = page.getByRole('group', { name: 'Tuning' });
  await expect(tuning.getByRole('slider')).toHaveCount(3);
  const state = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[aria-label="Tuning"] .knob')].map((k) => {
        const r = k.querySelector('.knob-dial')!.getBoundingClientRect();
        return `${k.querySelector('.knob-label')!.textContent} ${Math.round(r.left)},${Math.round(r.top)} inactive=${k.hasAttribute('data-inactive')}`;
      }),
    );
  const onOsc1 = await state();
  expect(onOsc1.every((s) => s.endsWith('inactive=true'))).toBe(true); // Osc 2 is mixed out in Init
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  expect(await state()).toEqual(onOsc1);
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await page.getByRole('group', { name: 'Mixer' }).getByRole('slider', { name: 'Osc 2' }).focus();
  await page.keyboard.press('ArrowUp');
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  await expect(tuning.locator('.knob[data-inactive]')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Osc 1' }).click();
  await expect(tuning.locator('.knob[data-inactive]')).toHaveCount(0); // still awake on the other tab
});

test('Glide sits beside Voices in the Amp, greyed out with more than one Voice (it only slides a single Voice)', async ({ page }) => {
  await page.goto('/');
  const amp = page.getByRole('region', { name: 'Amp' });
  const glide = amp.locator('.knob', { has: page.getByRole('slider', { name: 'Glide' }) });
  await expect(glide).toBeVisible();
  await expect(page.getByRole('region', { name: 'LFO & Envelopes' }).getByRole('slider', { name: 'Glide' })).toHaveCount(0);
  const voices = amp.getByRole('radiogroup', { name: 'Voices' });
  const [v, g] = [(await voices.boundingBox())!, (await glide.locator('.knob-dial').boundingBox())!];
  expect(g.x).toBeGreaterThan(v.x + v.width); // to the right of Voices…
  expect(g.y).toBeLessThan(v.y + v.height); // …on its line
  await expect(glide).not.toHaveAttribute('data-inactive');
  await voices.getByRole('radio', { name: '2', exact: true }).click();
  await expect(glide).toHaveAttribute('data-inactive', 'true');
  await voices.getByRole('radio', { name: '1', exact: true }).click();
  await expect(glide).not.toHaveAttribute('data-inactive');
});
