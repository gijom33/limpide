import { expect, test } from '@playwright/test';
import { openDisplay } from './helpers';

test('hovering Freeze explains what it does, and how to use it', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const freeze = page.getByRole('button', { name: 'Freeze' });
  await freeze.hover();
  const tip = page.getByRole('tooltip');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('not the sound');
  await expect(tip).toContainText('Space');
  await expect(freeze).toHaveAttribute('aria-describedby', (await tip.getAttribute('id'))!);

  await page.mouse.move(0, 400);
  await expect(tip).toBeHidden();
});

test('hovering Snapshot explains the grey comparison trace', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  await page.getByRole('button', { name: 'Snapshot', exact: true }).hover();
  await expect(page.getByRole('tooltip')).toContainText('grey');
});

test('keyboard users get the same explanation on focus, and Escape dismisses it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Display' }).focus(); // open the panel from the keyboard, as a keyboard user would
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Snapshot', exact: true }).focus();
  const snapshotTip = page.getByRole('tooltip').filter({ hasText: 'faint grey trace' });
  await expect(snapshotTip).toBeVisible();
  await page.keyboard.press('Escape');
  // Gone (Escape also closes the panel, back to the Display button, whose own explanation may show: issue 51).
  await expect(snapshotTip).toBeHidden();
});

test('every toolbar control explains itself, without doubling up on native browser tooltips', async ({ page }) => {
  await page.goto('/');
  await openDisplay(page);
  const toolbar = page.getByRole('region', { name: 'Viewer controls' });
  await expect(toolbar.locator('[title]')).toHaveCount(0);
  for (const name of ['Harmonics', 'Ideal', 'Curve', 'Guides']) {
    await toolbar.getByRole('button', { name }).hover();
    await expect(page.getByRole('tooltip'), name).toBeVisible();
  }
  for (const name of ['Frequency axis', 'Level axis', 'Scope cycles', 'Env Timeline length']) {
    await toolbar.getByRole('radiogroup', { name }).hover();
    await expect(page.getByRole('tooltip'), name).toBeVisible();
  }
});

test('headings with an explanation are plain text, with no dotted underline, and still explain themselves on hover', async ({ page }) => {
  await page.goto('/');
  const dotted = await page.evaluate(() =>
    [...document.querySelectorAll('body *')].filter((el) => getComputedStyle(el).textDecorationStyle === 'dotted' && getComputedStyle(el).textDecorationLine.includes('underline')).length,
  );
  expect(dotted).toBe(0);
  await page.getByRole('region', { name: 'LFO & Envelopes' }).getByText('LFO & Envelopes', { exact: true }).hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
});

// Issue 59: the Viewers, every fader, the LFO knobs and the Timeline's key explain themselves too.
test('every Viewer, fader and the Timeline key explain themselves, the tooltip beside what it explains', async ({ page }) => {
  test.slow(); // twenty-odd hovers, each waiting out the hover delay
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const tip = page.getByRole('tooltip').locator('visible=true');
  const check = async (target: import('@playwright/test').Locator, title: string) => {
    await expect(async () => {
      await page.mouse.move(0, 0);
      await target.hover({ timeout: 2000 });
      await expect(tip.locator('strong'), title).toHaveText(title, { timeout: 2000 });
      // Placed by what it explains, not at the page's corner (a Viewer's anchor has no box of its own).
      const [t, b] = [(await tip.boundingBox({ timeout: 1000 }))!, (await target.boundingBox())!];
      expect(Math.abs(t.x + t.width / 2 - (b.x + b.width / 2)), title).toBeLessThan(Math.max(b.width, t.width));
    }).toPass({ timeout: 15000 });
  };
  for (const tap of ['Oscillator', 'Filter', 'Amp']) {
    await check(page.getByRole('img', { name: `${tap} Scope` }), `${tap} Scope`);
    await check(page.getByRole('img', { name: `${tap} Spectrum` }), `${tap} Spectrum`);
  }
  await check(page.getByRole('img', { name: 'Envelope Timeline' }), 'Envelope Timeline');
  for (const stage of ['Attack', 'Decay', 'Sustain', 'Release']) {
    await check(page.getByRole('slider', { name: `Amp ${stage}` }), stage);
    await check(page.getByRole('slider', { name: `Filter ${stage}` }), stage);
  }
  await check(page.getByRole('slider', { name: 'LFO 1 Rate' }), 'Rate');
  await check(page.getByRole('slider', { name: 'LFO 2 Depth' }), 'Depth');
  await page.getByRole('slider', { name: 'Filter Envelope Amount' }).press('ArrowUp'); // its key entry shows only then
  await page.evaluate(() => (document.activeElement as HTMLElement).blur()); // and its own tooltip goes
  for (const [mark, title] of [['filterEnvelope', 'Filter Envelope'], ['cutoff', 'Cutoff'], ['amp', 'Amp Envelope']]) {
    await check(page.locator(`.timeline-key [data-mark="${mark}"]`), title);
  }
  await page.getByRole('tab', { name: 'Mixer' }).click();
  await check(page.getByRole('slider', { name: 'Osc 1', exact: true }), 'Osc 1');
  await check(page.getByRole('slider', { name: 'Osc 2', exact: true }), 'Osc 2');
  // Screen readers hear them too: every slider and picture is described.
  const undescribed = await page.evaluate(() =>
    [...document.querySelectorAll('[role=slider], [role=img]')].filter((e) => e.getClientRects().length && !e.hasAttribute('aria-describedby')).map((e) => e.getAttribute('aria-label')),
  );
  expect(undescribed).toEqual([]);
});
