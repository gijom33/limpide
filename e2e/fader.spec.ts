import { expect, type Locator, type Page, test } from '@playwright/test';
import { sliderName } from './helpers';

// Levels and envelope stages are faders (ADR-0008): vertical sliders with a cap that drags, and a track that a
// click (without a drag) sets.

const fader = (page: Page, region: string, name: string) =>
  page.getByRole('region', { name: region }).getByRole('slider', { name: sliderName(name) });
const track = (cap: Locator) => cap.locator('xpath=ancestor::*[contains(@class, "fader")][1]');
const percent = async (cap: Locator) => Number(await cap.getAttribute('aria-valuenow'));

test('the Mixer levels and both envelopes are vertical faders; the other Parameters are knobs', async ({ page }) => {
  await page.goto('/');
  // Every laid-out slider, the Mixer's too on its (hidden) tab: getByRole would skip it.
  const vertical = await page
    .locator('[role=slider]')
    .evaluateAll((sliders) =>
      sliders
        .filter((s) => s.getClientRects().length > 0 && s.getAttribute('aria-orientation') === 'vertical')
        .map((s) => s.getAttribute('aria-label')),
    );
  // The Envelopes' faders are named with their Envelope (issue 51).
  expect(vertical.sort()).toEqual(
    [
      'Osc 1', 'Osc 2', 'Ring', 'Noise', 'Sub',
      'Filter Attack', 'Filter Decay', 'Filter Sustain', 'Filter Release',
      'Amp Attack', 'Amp Decay', 'Amp Sustain', 'Amp Release',
    ].sort(),
  );
});

test('dragging a fader’s cap up raises it, and down lowers it', async ({ page }) => {
  await page.goto('/');
  const cap = fader(page, 'Amp', 'Sustain');
  const before = await percent(cap);
  const box = (await cap.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 30, { steps: 6 });
  await page.mouse.up();
  const raised = await percent(cap);
  expect(raised).toBeGreaterThan(before);

  const now = (await cap.boundingBox())!;
  await page.mouse.move(now.x + now.width / 2, now.y + now.height / 2);
  await page.mouse.down();
  await page.mouse.move(now.x + now.width / 2, now.y + 50, { steps: 6 });
  await page.mouse.up();
  expect(await percent(cap)).toBeLessThan(raised);
});

test('a click on a fader’s track, without a drag, sets the value there', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Mixer' }).click();
  const cap = fader(page, 'Oscillators', 'Noise');
  expect(await percent(cap)).toBe(0);
  const t = (await track(cap).boundingBox())!;
  await page.mouse.click(t.x + t.width / 2, t.y + t.height * 0.25);
  const set = await percent(cap);
  expect(set).toBeGreaterThan(55);
  expect(set).toBeLessThan(95);
});

test('a fader takes the arrow keys and resets on double-click', async ({ page }) => {
  await page.goto('/');
  const cap = fader(page, 'Filter', 'Sustain');
  const start = await cap.getAttribute('aria-valuetext');
  await cap.focus();
  await cap.press('ArrowUp');
  await cap.press('ArrowUp');
  expect(await cap.getAttribute('aria-valuetext')).not.toBe(start);
  await cap.dblclick();
  await expect(cap).toHaveAttribute('aria-valuetext', start!);
});

// The Mixer's tab takes the place of both Oscillator rows (Waveform and Tuning): its Levels faders use that height.
for (const [width, height] of [
  [1440, 900],
  [1100, 900],
  [393, 852],
]) {
  test(`the Levels faders fill the Mixer tab, taller than the envelopes’, without growing the stage (${width}×${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const stage = page.getByRole('region', { name: 'Oscillators' });
    const stageHeight = async () => (await stage.boundingBox())!.height;
    const before = await stageHeight();
    await page.getByRole('tab', { name: 'Mixer' }).click();
    const tall = (await track(fader(page, 'Oscillators', 'Noise')).boundingBox())!.height;
    const envelope = (await track(fader(page, 'Amp', 'Sustain')).boundingBox())!.height;
    expect(tall).toBeGreaterThan(envelope * 1.4);
    expect(await stageHeight()).toBe(before);
  });
}

/** The distances between neighbouring faders' centres, row by row (the Mixer's on its tab, shown). */
const faderSteps = async (page: Page) => {
  await page.getByRole('tab', { name: /Mixer/ }).click();
  return page.evaluate(() =>
    [...document.querySelectorAll('.knobs')]
      .filter((row) => row.getClientRects().length && row.querySelector('[data-kind=fader]'))
      .map((row) => {
        const centres = [...row.querySelectorAll('[data-kind=fader] .fader')].map((f) => f.getBoundingClientRect()).map((r) => r.left + r.width / 2);
        return centres.slice(1).map((c, i) => Math.round(c - centres[i]));
      }),
  );
};

for (const [width, height] of [[375, 812], [430, 932], [872, 920], [961, 800], [1280, 800], [1440, 900], [1710, 1060]]) {
  test(`at ${width}×${height} faders are evenly and roomily spaced, whatever their names’ lengths`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const rows = await faderSteps(page);
    expect(rows, JSON.stringify(rows)).toHaveLength(3);
    for (const steps of rows) {
      expect(Math.max(...steps) - Math.min(...steps), JSON.stringify(rows)).toBeLessThanOrEqual(1);
      expect(Math.min(...steps), JSON.stringify(rows)).toBeGreaterThanOrEqual(48);
    }
    // Where there is room, every row of faders is spaced alike.
    if (![375, 872, 961].includes(width)) {
      const all = rows.flat();
      expect(Math.max(...all) - Math.min(...all), JSON.stringify(rows)).toBeLessThanOrEqual(1);
    }
  });
}
