import { expect, test, type Locator, type Page } from '@playwright/test';

// Levels and envelope stages are faders (ADR-0008): vertical sliders with a cap that drags, and a track that a
// click (without a drag) sets.

const fader = (page: Page, region: string, name: string) =>
  page.getByRole('region', { name: region }).getByRole('slider', { name, exact: true });
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
        .map((s) => `${s.closest('[aria-label]:is(section)')?.getAttribute('aria-label')} ${s.getAttribute('aria-label')}`),
    );
  expect(vertical.sort()).toEqual(
    [
      'Oscillators Osc 1', 'Oscillators Osc 2', 'Oscillators Noise', 'Oscillators Sub',
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
