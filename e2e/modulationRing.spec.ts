import { expect, test, type Page } from '@playwright/test';

// Serum-style modulation on a knob (issue 20): a ring outside its value arc, over the range modulation can take it,
// and a dot at the value right now while a Note sounds.

const knob = (page: Page, region: string, name: string) =>
  page.getByRole('region', { name: region }).locator('.knob', { has: page.getByRole('slider', { name, exact: true }) });
const ring = (k: ReturnType<typeof knob>) => k.locator('.knob-ring');
const dot = (k: ReturnType<typeof knob>) => k.locator('.knob-live');
const listening = (page: Page) => expect(page.getByLabel('Amp Scope', { exact: true })).toHaveAttribute('data-db', /.+/);

async function turnUp(page: Page, region: string, name: string, steps: number) {
  const slider = page.getByRole('region', { name: region }).getByRole('slider', { name, exact: true });
  await slider.evaluate(async (el, n) => {
    for (let i = 0; i < n; i++) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0)); // a tick for React to render each step
    }
  }, steps);
}

test('no ring while nothing modulates the Cutoff; turning the LFO’s Depth up rings it', async ({ page }) => {
  await page.goto('/');
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await expect(ring(cutoff)).toBeHidden();
  await turnUp(page, 'LFO & Envelopes', 'Depth', 25);
  await expect(ring(cutoff)).toBeVisible();
  await expect(ring(cutoff)).toHaveAttribute('d', /A/); // an arc
});

test('the live dot rides the Effective Cutoff while a Note sounds, and only then', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'LFO & Envelopes', 'Depth', 25);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await expect(dot(cutoff)).toBeHidden();
  await page.keyboard.down('KeyA');
  await expect(dot(cutoff)).toBeVisible();
  const at = await dot(cutoff).getAttribute('cx');
  await expect.poll(() => dot(cutoff).getAttribute('cx')).not.toBe(at); // the LFO moves it
  await page.keyboard.up('KeyA');
  await expect(dot(cutoff)).toBeHidden({ timeout: 3000 }); // once the Release has faded
});

test('the live dot moves with the Filter Envelope alone, no LFO, as with the LFO or both', async ({ page }) => {
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'Filter', 'Amount', 15);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await expect(ring(cutoff)).toBeVisible();
  await page.keyboard.down('KeyA');
  await expect(dot(cutoff)).toBeVisible();
  const seen = new Set<string | null>();
  for (let i = 0; i < 10; i++) {
    seen.add(await dot(cutoff).getAttribute('cx'));
    await page.waitForTimeout(40);
  }
  expect(seen.size, 'the Envelope moves it').toBeGreaterThan(2);
  await page.keyboard.up('KeyA');
});

test('an LFO on Pulse Width rings both Oscillators’ Pulse Width knobs, and not the Cutoff', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radiogroup', { name: 'LFO Destination' }).getByRole('radio', { name: 'Pulse Width' }).click();
  await turnUp(page, 'LFO & Envelopes', 'Depth', 25);
  await expect(ring(page.getByRole('group', { name: 'Osc 1' }).locator('.knob'))).toBeVisible();
  await page.getByRole('tab', { name: /Osc 2/ }).click();
  await expect(ring(page.getByRole('group', { name: 'Osc 2' }).locator('.knob'))).toBeVisible();
  await expect(ring(knob(page, 'Filter', 'Cutoff'))).toBeHidden();
});

test('hovering or focusing a source brightens its own share of the ring', async ({ page }) => {
  await page.goto('/');
  await turnUp(page, 'LFO & Envelopes', 'Depth', 10);
  await turnUp(page, 'Filter', 'Amount', 10);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  const share = cutoff.locator('.knob-share');
  await expect(share).toBeHidden();
  await page.getByRole('region', { name: 'LFO & Envelopes' }).getByRole('slider', { name: 'Depth' }).hover();
  await expect(share).toBeVisible();
  await expect(share).toHaveAttribute('data-source', 'lfo1');
  await page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Amount' }).focus();
  await page.mouse.move(0, 0);
  await expect(share).toHaveAttribute('data-source', 'filterEnvelope');
  await page.getByRole('region', { name: 'Filter' }).getByRole('slider', { name: 'Amount' }).blur();
  await expect(share).toBeHidden();
});

test('with reduced motion asked for, the ring stays and the moving dot does not show', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await listening(page);
  await turnUp(page, 'LFO & Envelopes', 'Depth', 25);
  const cutoff = knob(page, 'Filter', 'Cutoff');
  await page.keyboard.down('KeyA');
  await expect(ring(cutoff)).toBeVisible();
  await page.waitForTimeout(300);
  await expect(dot(cutoff)).toBeHidden();
  await page.keyboard.up('KeyA');
});
