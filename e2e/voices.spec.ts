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

// Each Oscillator's tab has its own pitch row under its Waveform (the owner, issue 90; it was one shared row of Osc
// 2's tuning under both tabs, issue 19).
test('Osc 2’s Tuning is a row of its own tab, greyed out until Osc 2 is heard: mixed in, through Ring or by FM on a heard Osc 1', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const tuning = page.getByRole('group', { name: 'Tuning' });
  await expect(tuning).toBeHidden(); // Osc 1's tab shows its own pitch row
  await expect(page.getByRole('group', { name: 'Osc 1 Pitch' }).getByRole('slider')).toHaveCount(2);
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  await expect(tuning.getByRole('slider')).toHaveCount(4);
  await expect(tuning.locator('.knob:not([data-inactive])')).toHaveCount(0); // Osc 2 is mixed out in Init
  await page.getByRole('tab', { name: 'Osc 1' }).click();
  await page.getByRole('group', { name: 'Osc 1 Pitch' }).getByRole('slider', { name: 'FM' }).focus();
  await page.keyboard.press('ArrowUp');
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  await expect(tuning.locator('.knob[data-inactive]')).toHaveCount(0); // heard through FM
  // FM on a silent Osc 1 is not heard: no dot, greyed out again.
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await page.getByRole('group', { name: 'Mixer' }).getByRole('slider', { name: 'Osc 1' }).focus();
  await page.keyboard.press('Home');
  const osc2 = page.getByRole('tab', { name: /Osc 2/ });
  await expect(osc2).not.toHaveAttribute('data-sounding', 'true');
  await osc2.click();
  await expect(tuning.locator('.knob:not([data-inactive])')).toHaveCount(0);
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

// Issue 86 (the owner's bug, 2026-10-28): Glide is right of the Voices numbers and level with them at every width; at
// 1075 px the name beside the numbers left Glide no room, and it wrapped under them.
test('Glide stays right of the Voices numbers at every width (issue 86)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  const wrong: string[] = [];
  for (let width = 340; width <= 1920; width += 7) {
    await page.setViewportSize({ width, height: 900 });
    const place = await page.evaluate(
      () =>
        new Promise<{ right: boolean; level: boolean }>((resolve) =>
          requestAnimationFrame(() => {
            const numbers = document.querySelector('.voices-field [role="radiogroup"]')!.getBoundingClientRect();
            const glide = document.querySelector('.voices-field .knob')!.getBoundingClientRect();
            resolve({ right: glide.left >= numbers.right, level: glide.top < numbers.bottom });
          }),
        ),
    );
    if (!place.right || !place.level) wrong.push(`${width}px`);
  }
  expect(wrong).toEqual([]);
});
